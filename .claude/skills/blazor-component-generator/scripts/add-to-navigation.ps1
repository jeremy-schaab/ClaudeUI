#Requires -Version 7.0
<#
.SYNOPSIS
    Adds a new page to the Blazor application navigation menu

.DESCRIPTION
    Automatically adds a navigation link to the navigation component by:
    - Locating NavMenu.razor or navigation component
    - Parsing existing navigation structure
    - Adding new navigation link with icon
    - Preserving formatting and structure
    - Supporting nested menu items

.PARAMETER PageName
    Display name for the navigation item (e.g., "Products")

.PARAMETER PageRoute
    Route/URL path for the page (e.g., "/products")

.PARAMETER IconName
    Icon name or class based on framework (e.g., "fas fa-box" or "@Icons.Material.Filled.Store")

.PARAMETER ProjectPath
    Path to the Blazor project

.PARAMETER ParentMenu
    Optional parent menu for nested navigation

.PARAMETER Framework
    UI framework: MudBlazor, Telerik, Syncfusion, Bootstrap

.EXAMPLE
    .\add-to-navigation.ps1 -PageName "Products" -PageRoute "/products" `
        -IconName "fas fa-box" -ProjectPath "C:\projects\MyApp" -Framework "Bootstrap"

.OUTPUTS
    PSCustomObject with:
    - Success: Boolean indicating success
    - NavComponentPath: Path to updated navigation component
    - LinkAdded: Information about added link
    - Message: Human-readable status message
    - Errors: Array of error messages if any

.RETURN
    Exit code 0: Navigation link added successfully
    Exit code 1: Error occurred during navigation update
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Display name for navigation item")]
    [string]$PageName,

    [Parameter(Mandatory = $true, HelpMessage = "Route/URL path")]
    [string]$PageRoute,

    [Parameter(Mandatory = $true, HelpMessage = "Icon name or class")]
    [string]$IconName,

    [Parameter(Mandatory = $true, HelpMessage = "Path to the Blazor project")]
    [ValidateScript({ Test-Path $_ -PathType Container })]
    [string]$ProjectPath,

    [string]$ParentMenu = $null,

    [ValidateSet("MudBlazor", "Telerik", "Syncfusion", "Bootstrap")]
    [string]$Framework = "Bootstrap",

    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

try {
    Write-Verbose "Adding navigation link: $PageName -> $PageRoute"

    # ========== Find navigation component ==========
    Write-Verbose "Searching for navigation component..."

    $navComponentCandidates = @(
        "Shared/NavMenu.razor"
        "Shared/Navigation.razor"
        "Components/Shared/NavMenu.razor"
        "Layout/Navigation.razor"
    )

    $navComponentPath = $null
    foreach ($candidate in $navComponentCandidates) {
        $fullPath = Join-Path $ProjectPath $candidate
        if (Test-Path $fullPath) {
            $navComponentPath = $fullPath
            Write-Verbose "Found navigation component: $navComponentPath"
            break
        }
    }

    if (-not $navComponentPath) {
        throw "Navigation component not found. Checked: $($navComponentCandidates -join ', ')"
    }

    # ========== Read existing navigation ==========
    Write-Verbose "Reading existing navigation component..."

    $navContent = Get-Content -Path $navComponentPath -Raw

    # ========== Generate navigation link based on framework ==========
    Write-Verbose "Generating navigation link for framework: $Framework"

    $navigationLink = ""
    switch ($Framework) {
        "MudBlazor" {
            $navigationLink = @"
    <MudNavLink Href="$PageRoute" Icon="@Icons.Material.Filled.Store">
        $PageName
    </MudNavLink>
"@
        }
        "Telerik" {
            $navigationLink = @"
    <TelerikNavLink Href="$PageRoute">
        <span class="$IconName"></span>
        $PageName
    </TelerikNavLink>
"@
        }
        "Syncfusion" {
            $navigationLink = @"
    <SfSidebar>
        <SfSidebarItem NavigateUrl="$PageRoute" Text="$PageName" IconCss="$IconName" />
    </SfSidebar>
"@
        }
        "Bootstrap" {
            # Default Bootstrap/HTML approach
            $navigationLink = @"
    <li class="nav-item px-3">
        <NavLink class="nav-link" href="$PageRoute">
            <span class="oi oi-list-rich" aria-hidden="true"></span> $PageName
        </NavLink>
    </li>
"@
        }
    }

    # ========== Find insertion point ==========
    Write-Verbose "Locating insertion point in navigation component..."

    # Try to find a nav list or menu container
    $insertionFound = $false
    $insertionPoint = -1

    # Look for common navigation containers
    $containerPatterns = @(
        '(<nav[^>]*>|<div[^>]*class="[^"]*nav[^"]*"[^>]*>)',  # nav element or nav div
        '(<ul class="nav[^>]*>|<ul[^>]*class="[^"]*nav[^"]*"[^>]*>)',  # nav list
    )

    foreach ($pattern in $containerPatterns) {
        if ($navContent -match $pattern) {
            Write-Verbose "Found navigation container matching pattern: $pattern"
            $insertionFound = $true
            break
        }
    }

    if (-not $insertionFound) {
        Write-Verbose "Could not find standard navigation container, appending to end"
    }

    # ========== Insert navigation link ==========
    Write-Verbose "Inserting navigation link into component..."

    $updatedContent = $navContent

    if ($Framework -eq "Bootstrap" -and $navContent -match '<ul[^>]*class="[^"]*nav[^"]*"[^>]*>') {
        # Find the closing </ul> for the nav list
        $lastNavListClose = $navContent.LastIndexOf('</ul>')
        if ($lastNavListClose -gt 0) {
            $insertionPoint = $lastNavListClose
            $updatedContent = $navContent.Insert($lastNavListClose, "`n$navigationLink")
            Write-Verbose "Inserted link into nav list at position $insertionPoint"
        }
    }
    elseif ($Framework -eq "MudBlazor" -and $navContent -match '<MudNavMenu[^>]*>') {
        # Find the closing </MudNavMenu>
        $closingTag = $navContent.LastIndexOf('</MudNavMenu>')
        if ($closingTag -gt 0) {
            $insertionPoint = $closingTag
            $updatedContent = $navContent.Insert($closingTag, "`n$navigationLink`n")
            Write-Verbose "Inserted link into MudNavMenu at position $insertionPoint"
        }
    }
    else {
        # Fallback: append before closing body tag or at the end
        $bodyClose = $updatedContent.LastIndexOf('</body>')
        if ($bodyClose -gt 0) {
            $updatedContent = $updatedContent.Insert($bodyClose, "`n$navigationLink`n")
            Write-Verbose "Appended link before closing body tag"
        }
        else {
            # Just append to the end
            $updatedContent = $updatedContent + "`n$navigationLink"
            Write-Verbose "Appended link to end of component"
        }
    }

    # ========== Write updated navigation component ==========
    Write-Verbose "Writing updated navigation component..."

    Set-Content -Path $navComponentPath -Value $updatedContent -Encoding UTF8

    # ========== Verify changes ==========
    Write-Verbose "Verifying navigation link was added..."

    $verifyContent = Get-Content -Path $navComponentPath -Raw
    $linkAdded = $verifyContent -match [regex]::Escape($PageRoute)

    if (-not $linkAdded) {
        Write-Warning "Navigation link pattern not found in updated component"
    }

    # ========== Build output ==========
    $output = [PSCustomObject]@{
        Success              = $true
        NavComponentPath     = Resolve-Path -Path $navComponentPath
        PageName             = $PageName
        PageRoute            = $PageRoute
        Framework            = $Framework
        LinkAdded            = $linkAdded
        Message              = "Navigation link added successfully: $PageName -> $PageRoute"
        FileSize             = (Get-Item -Path $navComponentPath).Length
        UpdatedTime          = Get-Date -Format "o"
        Errors               = @()
    }

    if (-not $linkAdded) {
        $output.Errors += "Warning: Navigation link pattern not verified after insertion"
    }

    Write-Output ($output | ConvertTo-Json -Depth 2)
    exit 0
}
catch {
    Write-Error "Error adding navigation link: $_"

    $output = [PSCustomObject]@{
        Success          = $false
        NavComponentPath = $navComponentPath
        PageName         = $PageName
        PageRoute        = $PageRoute
        Framework        = $Framework
        Message          = "Failed to add navigation link"
        Errors           = @($_)
        UpdatedTime      = Get-Date -Format "o"
    }

    Write-Output ($output | ConvertTo-Json -Depth 2)
    exit 1
}
