# Product Requirement Prompt - User Dashboard (Blazor)

> **💡 Template Usage**: This is a complete example of a UI/frontend PRP demonstrating Blazor Server with C# 13/.NET 9 best practices. Customize sections marked with 💡 to match your specific requirements.

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Component Name** | 💡 User Dashboard |
| **UI Framework** | Blazor Server (.NET 9) |
| **Complexity** | Medium |
| **Estimated Effort** | 30 hours (4 days) |
| **Technology Stack** | C# 13, .NET 9, Blazor Server, SignalR, Syncfusion/MudBlazor |
| **Primary Users** | Authenticated users viewing personal analytics and activity |
| **Business Value** | Provides real-time insights and personalized experience |

**Component Overview**: Interactive dashboard displaying user analytics, recent activity, and key metrics with real-time updates via SignalR. Includes responsive design, accessibility (WCAG AA), and dark mode support.

---

## Current State Analysis

### Existing Components
💡 **Discovered via `Glob **/*.razor` and `Grep "@page"`**:

- **`Components/Layout/MainLayout.razor`**: Application layout with navigation
- **`Components/Pages/Index.razor`**: Home page component
- **`Services/IUserService.cs`**: User data access service
- **`Services/IAnalyticsService.cs`**: Analytics data aggregation

### Dependencies
- **Syncfusion.Blazor.Grid**: Data grid component
- **Syncfusion.Blazor.Charts**: Chart components
- **MudBlazor**: UI component library (alternative)
- **Microsoft.AspNetCore.SignalR.Client**: Real-time updates

### Gaps (What Needs to Be Built)
- Dashboard.razor component (`Components/Pages/Dashboard.razor`)
- MetricCard.razor sub-component (`Components/Shared/MetricCard.razor`)
- ActivityFeed.razor sub-component (`Components/Shared/ActivityFeed.razor`)
- DashboardService.cs (`Services/DashboardService.cs`)
- Dashboard state management (DashboardState.cs)
- Real-time hub connection for live updates
- Responsive breakpoint handling
- Accessibility attributes (ARIA labels, keyboard navigation)

---

## Functional Requirements

### FR-1: Display Key Metrics Dashboard
**Priority**: Must-have

**Description**: Dashboard displays 4 metric cards showing total orders, revenue, active users, and conversion rate with percentage change indicators.

**Acceptance Criteria**:
- [ ] Dashboard page accessible at `/dashboard` route
- [ ] Four metric cards displayed in responsive grid (4 columns desktop, 2 tablet, 1 mobile)
- [ ] Each card shows: Title, Current value, Percentage change (↑/↓), Trend indicator (green/red)
- [ ] Metrics update in real-time when new data arrives via SignalR
- [ ] Loading skeleton displayed while fetching initial data
- [ ] Empty state shown if no data available
- [ ] Error state with retry button if data fetch fails

**Component Structure**:
```
Dashboard.razor (page)
├── MetricCard.razor (Total Orders)
├── MetricCard.razor (Total Revenue)
├── MetricCard.razor (Active Users)
└── MetricCard.razor (Conversion Rate)
```

### FR-2: Interactive Activity Feed
**Priority**: Must-have

**Description**: Real-time feed showing latest 10 user activities (orders, profile updates, logins) with infinite scroll for history.

**Acceptance Criteria**:
- [ ] Activity feed displayed below metrics
- [ ] Shows activity icon, timestamp (relative: "2 minutes ago"), description, user avatar
- [ ] New activities appear at top with smooth animation
- [ ] Infinite scroll loads next 10 activities when scrolling to bottom
- [ ] Real-time updates: New activities pushed via SignalR
- [ ] Virtualized scrolling for performance (>100 items)
- [ ] Keyboard navigation: Arrow keys to navigate items, Enter to view details

### FR-3: Responsive Chart Visualization
**Priority**: Should-have

**Description**: Line chart showing user activity trend over last 30 days.

**Acceptance Criteria**:
- [ ] Chart displays below activity feed
- [ ] X-axis: Last 30 days (date labels), Y-axis: Activity count
- [ ] Responsive sizing: Full width, adjusts height based on viewport
- [ ] Tooltip on hover showing exact date and count
- [ ] Chart updates when data refreshes
- [ ] Accessible: Screen reader announces chart data summary

---

## Component Architecture

### Dashboard.razor (Main Component)
**Location**: `Components/Pages/Dashboard.razor`
**Route**: `/dashboard`
**Authorization**: `@attribute [Authorize]`

```razor
@page "/dashboard"
@attribute [Authorize]
@inject IDashboardService DashboardService
@inject NavigationManager Navigation
@inject HubConnection HubConnection
@implements IAsyncDisposable

<PageTitle>Dashboard</PageTitle>

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="mt-4">
    @if (_isLoading)
    {
        <MudGrid>
            @for (int i = 0; i < 4; i++)
            {
                <MudItem xs="12" sm="6" md="3">
                    <MudSkeleton SkeletonType="SkeletonType.Rectangle" Height="120px" />
                </MudItem>
            }
        </MudGrid>
    }
    else if (_error != null)
    {
        <MudAlert Severity="Severity.Error">
            @_error
            <MudButton OnClick="LoadDataAsync" Color="Color.Primary">Retry</MudButton>
        </MudAlert>
    }
    else
    {
        <MudGrid>
            <MudItem xs="12" sm="6" md="3">
                <MetricCard Title="Total Orders"
                           Value="@_metrics.TotalOrders.ToString()"
                           PercentageChange="@_metrics.OrdersChange"
                           Icon="@Icons.Material.Filled.ShoppingCart" />
            </MudItem>
            <!-- Other metric cards... -->
        </MudGrid>

        <MudGrid Class="mt-6">
            <MudItem xs="12" md="6">
                <ActivityFeed Activities="@_activities" OnLoadMore="LoadMoreActivitiesAsync" />
            </MudItem>
            <MudItem xs="12" md="6">
                <MudPaper Class="pa-4">
                    <MudText Typo="Typo.h6">Activity Trend</MudText>
                    <SfChart>
                        <ChartPrimaryXAxis ValueType="Syncfusion.Blazor.Charts.ValueType.DateTime" />
                        <ChartSeriesCollection>
                            <ChartSeries DataSource="@_chartData" XName="Date" YName="Count" Type="ChartSeriesType.Line" />
                        </ChartSeriesCollection>
                    </SfChart>
                </MudPaper>
            </MudItem>
        </MudGrid>
    }
</MudContainer>

@code {
    private DashboardMetrics _metrics = new();
    private List<Activity> _activities = new();
    private List<ChartDataPoint> _chartData = new();
    private bool _isLoading = true;
    private string? _error;
    private int _currentPage = 1;

    protected override async Task OnInitializedAsync()
    {
        await LoadDataAsync();
        await ConnectToHubAsync();
    }

    private async Task LoadDataAsync()
    {
        _isLoading = true;
        _error = null;

        try
        {
            _metrics = await DashboardService.GetMetricsAsync();
            _activities = await DashboardService.GetRecentActivitiesAsync(1, 10);
            _chartData = await DashboardService.GetActivityTrendAsync(30);
        }
        catch (Exception ex)
        {
            _error = $"Failed to load dashboard: {ex.Message}";
        }
        finally
        {
            _isLoading = false;
        }
    }

    private async Task ConnectToHubAsync()
    {
        HubConnection.On<Activity>("ReceiveActivity", activity =>
        {
            _activities.Insert(0, activity);
            InvokeAsync(StateHasChanged);
        });

        HubConnection.On<DashboardMetrics>("UpdateMetrics", metrics =>
        {
            _metrics = metrics;
            InvokeAsync(StateHasChanged);
        });

        await HubConnection.StartAsync();
    }

    private async Task LoadMoreActivitiesAsync()
    {
        _currentPage++;
        var moreActivities = await DashboardService.GetRecentActivitiesAsync(_currentPage, 10);
        _activities.AddRange(moreActivities);
    }

    public async ValueTask DisposeAsync()
    {
        await HubConnection.DisposeAsync();
    }
}
```

### MetricCard.razor (Sub-Component)
**Location**: `Components/Shared/MetricCard.razor`

```razor
<MudPaper Class="pa-4 d-flex flex-column" Elevation="2">
    <div class="d-flex justify-space-between align-center">
        <MudIcon Icon="@Icon" Size="Size.Large" Color="Color.Primary" />
        <MudChip Color="@ChipColor" Size="Size.Small">
            @(PercentageChange > 0 ? "↑" : "↓") @Math.Abs(PercentageChange)%
        </MudChip>
    </div>
    <MudText Typo="Typo.h4" Class="mt-4">@Value</MudText>
    <MudText Typo="Typo.body2" Color="Color.Secondary">@Title</MudText>
</MudPaper>

@code {
    [Parameter, EditorRequired] public string Title { get; set; } = "";
    [Parameter, EditorRequired] public string Value { get; set; } = "";
    [Parameter] public decimal PercentageChange { get; set; }
    [Parameter] public string Icon { get; set; } = Icons.Material.Filled.Info;

    private Color ChipColor => PercentageChange >= 0 ? Color.Success : Color.Error;
}
```

---

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Initial page load < 2 seconds (LCP < 2.5s)
- [ ] Time to Interactive < 1.5 seconds
- [ ] Blazor circuit reconnect < 500ms if disconnected
- [ ] SignalR message latency < 100ms
- [ ] Virtualized scrolling for activity feed (handle 1000+ items)
- [ ] Lazy load chart component (render only when visible)

### NFR-2: Accessibility (WCAG AA Compliance)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Space, Arrow keys)
- [ ] Semantic HTML: `<nav>`, `<main>`, `<article>` for proper structure
- [ ] ARIA labels: `aria-label="Dashboard metrics"`, `aria-live="polite"` for updates
- [ ] Color contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for UI components
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces: "Dashboard loaded. 4 metric cards displayed"
- [ ] Chart accessible: Includes data table alternative for screen readers

### NFR-3: Responsive Design
- [ ] Mobile-first design approach
- [ ] Breakpoints: xs (<600px), sm (600-960px), md (960-1280px), lg (1280-1920px), xl (>1920px)
- [ ] Metric cards: 1 column mobile, 2 columns tablet, 4 columns desktop
- [ ] Activity feed stacks below metrics on mobile
- [ ] Chart height adjusts: 200px mobile, 300px tablet, 400px desktop
- [ ] Touch-friendly: Minimum 44x44px tap targets

### NFR-4: Browser Support
- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Edge 120+
- [ ] Safari 17+

---

## State Management

### DashboardState.cs
**Location**: `Services/DashboardState.cs`

```csharp
public class DashboardState
{
    private DashboardMetrics _metrics = new();
    private List<Activity> _activities = new();

    public DashboardMetrics Metrics
    {
        get => _metrics;
        set
        {
            _metrics = value;
            NotifyStateChanged();
        }
    }

    public List<Activity> Activities
    {
        get => _activities;
        set
        {
            _activities = value;
            NotifyStateChanged();
        }
    }

    public event Action? OnChange;

    private void NotifyStateChanged() => OnChange?.Invoke();
}
```

---

## Test Requirements

### Component Tests (bUnit)

```csharp
public class DashboardTests : TestContext
{
    [Fact]
    public void Dashboard_WithValidData_RendersMetricCards()
    {
        // Arrange
        var mockService = new Mock<IDashboardService>();
        mockService.Setup(s => s.GetMetricsAsync())
            .ReturnsAsync(new DashboardMetrics
            {
                TotalOrders = 1234,
                OrdersChange = 12.5m
            });

        Services.AddSingleton(mockService.Object);

        // Act
        var cut = RenderComponent<Dashboard>();

        // Assert
        cut.Find("h4").TextContent.Should().Be("1234");
        cut.Find(".mud-chip").TextContent.Should().Contain("↑ 12.5%");
    }

    [Fact]
    public void MetricCard_WithPositiveChange_ShowsGreenChip()
    {
        // Arrange & Act
        var cut = RenderComponent<MetricCard>(parameters => parameters
            .Add(p => p.Title, "Total Orders")
            .Add(p => p.Value, "100")
            .Add(p => p.PercentageChange, 10.5m));

        // Assert
        cut.Find(".mud-chip").ClassList.Should().Contain("mud-chip-color-success");
    }

    [Fact]
    public async Task Dashboard_WhenSignalRReceivesActivity_AddsToFeed()
    {
        // Test real-time updates...
    }
}
```

### Accessibility Tests

```csharp
[Fact]
public void Dashboard_MeetsAccessibilityStandards()
{
    // Arrange & Act
    var cut = RenderComponent<Dashboard>();

    // Assert
    cut.Find("main").Should().NotBeNull(); // Semantic HTML
    cut.Find("[role='region'][aria-label='Dashboard metrics']").Should().NotBeNull();
    cut.FindAll("[aria-live='polite']").Should().HaveCountGreaterThan(0);
}
```

---

## Quality Gates

### Entry Gate ✅
- [x] Component structure defined
- [x] State management strategy documented
- [x] Accessibility requirements specified
- [x] Responsive design breakpoints defined

### Implementation Gate
- [ ] All components render without errors
- [ ] Props validated and type-safe
- [ ] Event handlers tested
- [ ] Accessibility attributes present
- [ ] Responsive design verified at all breakpoints
- [ ] SignalR connection established and tested
- [ ] Component tests pass (≥85% coverage)

### Exit Gate
- [ ] WCAG AA compliance verified (Lighthouse, axe DevTools)
- [ ] Performance metrics met (Lighthouse score ≥90)
- [ ] Cross-browser testing passed
- [ ] Mobile testing on iOS and Android
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation tested

---

## Agent Delegation Strategy

### Phase 1: Component Design
**Agent**: `frontend-developer` (Taylor)
**Responsibility**: Design component hierarchy and state management
**Deliverable**: Component structure diagram and props definitions

### Phase 2: UI Implementation
**Agent**: `frontend-developer` (Taylor)
**Responsibility**: Implement Blazor components with SignalR integration
**Deliverable**: Dashboard.razor, MetricCard.razor, ActivityFeed.razor with tests

### Phase 3: Accessibility Review
**Agent**: `qa-engineer` (Parker)
**Responsibility**: Verify WCAG AA compliance
**Deliverable**: Accessibility audit report with recommendations

### Phase 4: Responsive Testing
**Agent**: `qa-engineer` (Parker)
**Responsibility**: Test at all breakpoints and devices
**Deliverable**: Responsive testing report

### Phase 5: Documentation
**Agent**: `technical-writer` (Sage)
**Responsibility**: Create component usage documentation
**Deliverable**: Component documentation with examples

---

## 💡 Customization Checklist

- [ ] Replace "User Dashboard" with your component name
- [ ] Update route from `/dashboard` to your desired path
- [ ] Modify metrics to match your business domain
- [ ] Adjust chart type and data visualization
- [ ] Update UI library (Syncfusion vs MudBlazor vs custom)
- [ ] Customize SignalR hub endpoints
- [ ] Modify responsive breakpoints based on design system
- [ ] Update accessibility requirements for your user base
- [ ] Adjust color theme and styling
- [ ] Customize activity feed data structure

---

*This template demonstrates Blazor Server best practices with C# 13/.NET 9, including real-time updates, accessibility, and responsive design. Use as a foundation for your UI PRPs.*
