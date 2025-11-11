Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Generate timestamp-based filename
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$filename = "screenshot-$timestamp.png"
$fullPath = Join-Path "C:\Users\jschaab\source\repos\GitHub\ClaudeUI" $filename

# Capture screenshot
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save($fullPath)
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved to $filename"