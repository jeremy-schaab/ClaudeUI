# UI Component Patterns Library

## Navigation Patterns

### Top Navigation Bar
**When to use:** Global navigation for 5-9 top-level sections

**Structure:**
```html
<nav class="navbar">
  <div class="brand">Logo</div>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/about">About</a></li>
  </ul>
  <div class="nav-actions">
    <button>Search</button>
    <button>Cart (2)</button>
    <button>User Menu</button>
  </div>
</nav>
```

**Mobile:** Hamburger menu that slides in from left/right
**Accessibility:** Skip link, ARIA labels, keyboard navigation

### Sidebar Navigation
**When to use:** Applications with many sections or hierarchical structure

**Structure:**
- Persistent sidebar on desktop (200-280px wide)
- Collapsible on tablet
- Off-canvas drawer on mobile
- Support nested navigation up to 3 levels

### Breadcrumbs
**When to use:** Deep hierarchical structures, multi-step processes

**Format:** Home > Category > Subcategory > Current Page
**Separator:** > or / or chevron icon
**Current page:** Not linked, different visual style

### Pagination
**When to use:** Large datasets, list views, search results

**Patterns:**
1. **Numbered**: << 1 2 3 ... 10 >>
2. **Load More**: Button to load next page
3. **Infinite Scroll**: Auto-load on scroll
4. **Combined**: Load more + show total count

## Form Patterns

### Input Field
```html
<div class="form-field">
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    aria-describedby="email-hint email-error"
    aria-invalid="false"
  >
  <span id="email-hint" class="hint">We'll never share your email</span>
  <span id="email-error" class="error" role="alert"></span>
</div>
```

**States:** Default, Focus, Filled, Disabled, Error, Success
**Validation:** Real-time on blur, inline error messages
**Accessibility:** Associated labels, error announcements

### Multi-Step Forms
**When to use:** Complex forms with 10+ fields or logical groupings

**Patterns:**
1. **Wizard:** Step-by-step with progress indicator
2. **Accordion:** Expand sections as you complete
3. **Tabs:** All sections visible, active tab highlighted

**Best practices:**
- Show progress (Step 2 of 4)
- Allow navigation back
- Save progress automatically
- Validate per step before proceeding

### Autocomplete / Typeahead
**When to use:** Large option lists, search inputs

**Behavior:**
- Show suggestions after 2-3 characters
- Highlight matching text
- Limit to 5-8 suggestions
- Keyboard navigation (arrow keys)
- Clear button when filled

### File Upload
**Patterns:**
1. **Click to browse:** Traditional file input
2. **Drag and drop:** Drag zone with browse fallback
3. **Inline:** Upload within forms or content

**Features:**
- Show file name and size
- Progress bar for large files
- Remove/replace option
- Preview for images
- Error handling for size/type restrictions

## Data Display Patterns

### Cards
**When to use:** Displaying collections of related information

**Variants:**
1. **Simple:** Image + title + description
2. **Interactive:** Hover effects, clickable
3. **Complex:** Multiple actions, metadata, status

**Structure:**
```html
<div class="card">
  <img src="image.jpg" alt="Card image">
  <div class="card-body">
    <h3>Card Title</h3>
    <p>Card description text</p>
    <div class="card-footer">
      <button>Primary Action</button>
      <button>Secondary</button>
    </div>
  </div>
</div>
```

### Data Tables
**When to use:** Structured data with multiple columns

**Features:**
- Sortable columns (click header)
- Filterable data (search, filters)
- Pagination or virtual scrolling
- Row actions (edit, delete, view)
- Selectable rows (checkboxes)
- Responsive (stack on mobile)

**Mobile strategy:**
- Hide less important columns
- Use cards instead of table
- Horizontal scroll for full table
- Expand rows for details

### Lists
**Patterns:**
1. **Simple list:** Text items, maybe icons
2. **Two-line list:** Primary + secondary text
3. **Three-line list:** Title + metadata + description
4. **Avatar list:** Profile image + name + info

**Features:**
- Dividers between items
- Group headers for sections
- Action buttons (delete, edit)
- Checkboxes for selection
- Drag handles for reordering

## Feedback Patterns

### Toast Notifications
**When to use:** Temporary, non-critical feedback

**Variants:**
- Success: ✓ Green background
- Error: ✗ Red background
- Warning: ⚠ Yellow background
- Info: ℹ Blue background

**Behavior:**
- Appear top-right or bottom-center
- Auto-dismiss after 3-5 seconds
- Swipe to dismiss
- Stack multiple toasts
- ARIA live region announcements

### Modal Dialogs
**When to use:** Critical decisions, focused tasks

**Types:**
1. **Alert:** Information only, single OK button
2. **Confirm:** Yes/No decision
3. **Form:** Input required from user
4. **Lightbox:** Display image/video

**Structure:**
```html
<div class="modal-overlay" aria-modal="true" role="dialog">
  <div class="modal-container">
    <div class="modal-header">
      <h2 id="modal-title">Modal Title</h2>
      <button aria-label="Close">×</button>
    </div>
    <div class="modal-body">
      Modal content
    </div>
    <div class="modal-footer">
      <button>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

**Best practices:**
- Trap focus inside modal
- Close on Escape key
- Darken background
- Return focus on close
- Prevent body scroll

### Loading States
**Patterns:**
1. **Spinner:** Circular loading indicator
2. **Progress bar:** Known duration/progress
3. **Skeleton:** Content placeholder while loading
4. **Pulse:** Subtle pulsing animation

**When to use:**
- Spinner: Unknown duration, < 3 seconds expected
- Progress: File uploads, known duration
- Skeleton: Page load, multiple content areas
- Pulse: Background updates, non-blocking

### Empty States
**When to use:** No data, no results, new user

**Components:**
- Illustration or icon
- Heading explaining situation
- Brief description
- Call-to-action button
- Help link (optional)

**Examples:**
- "No results found" → Clear filters, search tips
- "No items yet" → Create first item button
- "Cart is empty" → Continue shopping link

## Interaction Patterns

### Dropdown Menu
**When to use:** Actions or options for an item

**Structure:**
```html
<div class="dropdown">
  <button aria-expanded="false" aria-controls="menu">
    Options ▾
  </button>
  <ul id="menu" hidden role="menu">
    <li role="menuitem"><a href="#">Edit</a></li>
    <li role="menuitem"><a href="#">Delete</a></li>
    <li role="separator"></li>
    <li role="menuitem"><a href="#">Share</a></li>
  </ul>
</div>
```

**Behavior:**
- Click to open/close
- Click outside to close
- Escape to close
- Arrow keys to navigate
- Enter to select

### Accordion
**When to use:** Group related content, progressive disclosure

**Pattern:**
```html
<div class="accordion">
  <button aria-expanded="false" aria-controls="panel1">
    <span>Section 1</span>
    <span class="icon">▾</span>
  </button>
  <div id="panel1" hidden>
    Content for section 1
  </div>
</div>
```

**Variants:**
- Single: Only one open at a time
- Multiple: Multiple sections can be open
- Always one: At least one section must be open

### Tabs
**When to use:** Organizing content into categories

**Structure:**
- Tab list (horizontal buttons)
- Tab panels (content areas)
- One panel visible at a time
- Active tab highlighted

**Accessibility:**
- Role="tablist" on container
- Role="tab" on buttons
- aria-selected on active tab
- aria-controls linking tab to panel
- Arrow key navigation

### Tooltips
**When to use:** Extra information on hover

**Types:**
1. **Info tooltip:** Explain icon or term
2. **Action tooltip:** Describe button function
3. **Rich tooltip:** Formatted content, links

**Behavior:**
- Show on hover (desktop) or tap (mobile)
- Position above/below/left/right of trigger
- Arrow pointing to trigger
- Delay before showing (200-500ms)
- Hide on mouse out or tap away

### Popovers
**When to use:** Contextual information, menus, pickers

**Difference from tooltip:**
- More content
- Interactive (buttons, links, forms)
- Click to open (not hover)
- Close button or click outside

## Search Patterns

### Search Bar
**Variants:**
1. **Simple:** Input + button
2. **With suggestions:** Autocomplete dropdown
3. **Advanced:** Filters and facets
4. **Scoped:** Search within category

**Features:**
- Clear button (×) when filled
- Search icon (magnifying glass)
- Recent searches
- Popular searches
- Voice search (optional)

**Placement:**
- Header: Global search
- Page: Contextual search
- Sidebar: Faceted search with filters

### Filters
**Patterns:**
1. **Sidebar filters:** Multiple filter groups
2. **Top filters:** Dropdown or chips
3. **Inline filters:** Within search bar

**Features:**
- Multi-select (checkboxes)
- Single-select (radio buttons)
- Range sliders (price, date)
- Active filter badges
- Clear all option
- Filter count badges

## Status Indicators

### Badges
**When to use:** Count, status, label

**Variants:**
- Count badge: (3) on button
- Status badge: New, Hot, Sale
- Label badge: Category tag

**Styling:**
- Small, rounded pill shape
- Contrasting color
- Can include icon

### Progress Indicators
**Types:**
1. **Linear:** Horizontal bar
2. **Circular:** Ring that fills
3. **Step indicator:** Dots or numbers

**Usage:**
- File upload: Linear with percentage
- Multi-step form: Step indicator
- Task completion: Circular with %

### Status Messages
**Patterns:**
1. **Inline:** Within form/content
2. **Banner:** Top of page
3. **Toast:** Temporary notification
4. **Modal:** Critical alert

**Types:**
- Success: Action completed
- Error: Something went wrong
- Warning: Proceed with caution
- Info: Helpful information

## Best Practices

### Consistency
- Use same pattern for same function
- Maintain visual hierarchy
- Follow platform conventions
- Use established design system

### Progressive Disclosure
- Show only what's needed
- Reveal details on demand
- Use expand/collapse
- Implement smart defaults

### Feedback
- Immediate response to actions
- Clear success/error states
- Loading indicators for delays
- Helpful error messages

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels and roles
- Focus management

### Responsive Design
- Mobile-first approach
- Touch-friendly targets (44px)
- Adapt patterns per device
- Test on real devices

## Anti-Patterns to Avoid

❌ Fake modal (div that looks like modal but isn't)
❌ Custom scrollbars (poor accessibility)
❌ Infinite nested dropdowns (> 2 levels)
❌ Auto-playing carousels (accessibility issue)
❌ Disabled buttons without explanation
❌ Placeholder as label (accessibility issue)
❌ Tiny click targets (< 44px on mobile)
❌ Forced registration (before seeing content)
❌ Unclear error messages ("Error 500")
❌ Modal on page load (interrupts user)

## Resources

- [UI Patterns](http://ui-patterns.com/)
- [Material Design Components](https://material.io/components)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Inclusive Components](https://inclusive-components.design/)
- [Refactoring UI](https://refactoringui.com/)
