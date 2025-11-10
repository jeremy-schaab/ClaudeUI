# Accessibility Guidelines - WCAG 2.1

## Overview

Web Content Accessibility Guidelines (WCAG) 2.1 provides standards for making web content accessible to people with disabilities. This guide covers practical implementation of WCAG 2.1 Level A, AA, and AAA requirements.

## Four Core Principles (POUR)

### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

### 2. Operable
UI components and navigation must be operable by all users.

### 3. Understandable
Information and operation of UI must be understandable.

### 4. Robust
Content must be robust enough for interpretation by a wide variety of user agents, including assistive technologies.

## Level A Requirements (Minimum)

### 1.1 Text Alternatives
**Guideline:** Provide text alternatives for non-text content.

**Implementation:**
```html
<!-- Images -->
<img src="chart.png" alt="Sales increased 25% in Q4">

<!-- Decorative images -->
<img src="decoration.png" alt="" role="presentation">

<!-- Icons with meaning -->
<button>
  <svg aria-label="Delete item">...</svg>
  Delete
</button>

<!-- Complex images -->
<img src="chart.png" alt="Sales chart" longdesc="#chart-description">
<div id="chart-description">
  <p>Detailed description of chart data...</p>
</div>
```

### 1.3 Adaptable
**Guideline:** Create content that can be presented in different ways without losing information.

**Implementation:**
```html
<!-- Semantic HTML -->
<header>...</header>
<nav>...</nav>
<main>
  <article>
    <h1>Main Title</h1>
    <section>
      <h2>Section Title</h2>
    </section>
  </article>
</main>
<aside>...</aside>
<footer>...</footer>

<!-- Meaningful sequence -->
<form>
  <label for="name">Name</label>
  <input id="name" type="text">

  <label for="email">Email</label>
  <input id="email" type="email">
</form>
```

### 1.4.1 Use of Color
**Guideline:** Don't use color as the only visual means of conveying information.

**Implementation:**
```html
<!-- Bad -->
<p style="color: red">Required field</p>

<!-- Good -->
<p>
  <span class="required-icon" aria-label="required">*</span>
  Required field
</p>
```

### 2.1 Keyboard Accessible
**Guideline:** Make all functionality available from a keyboard.

**Implementation:**
```html
<!-- All interactive elements must be keyboard accessible -->
<button onclick="doSomething()">Click Me</button>

<!-- Not this -->
<div onclick="doSomething()">Click Me</div>

<!-- If you must use div, make it keyboard accessible -->
<div role="button" tabindex="0"
     onclick="doSomething()"
     onkeydown="if(event.key==='Enter') doSomething()">
  Click Me
</div>
```

**Testing:**
- Tab through all interactive elements
- Test Space/Enter on buttons and links
- Test Escape on modals and menus
- Test Arrow keys on custom controls

### 2.2 Enough Time
**Guideline:** Provide users enough time to read and use content.

**Implementation:**
```html
<!-- Timeout warning -->
<div role="alert" aria-live="assertive">
  Your session will expire in 2 minutes.
  <button>Extend Session</button>
</div>

<!-- Pause/stop for moving content -->
<div class="carousel">
  <button aria-label="Pause carousel">⏸</button>
  ...
</div>
```

### 2.3 Seizures
**Guideline:** Don't design content in a way that's known to cause seizures.

**Implementation:**
- Avoid flashing more than 3 times per second
- Limit bright, contrasting flashes
- Provide warning for content with flashes
- Allow users to disable animations:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.1 Readable
**Guideline:** Make text content readable and understandable.

**Implementation:**
```html
<!-- Language of page -->
<html lang="en">

<!-- Language of parts -->
<p>The French word <span lang="fr">bonjour</span> means hello.</p>
```

### 4.1 Compatible
**Guideline:** Maximize compatibility with current and future tools.

**Implementation:**
```html
<!-- Valid HTML with proper nesting -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page Title</title>
</head>
<body>
  <h1>Heading</h1>
  <p>Paragraph</p>
</body>
</html>

<!-- Proper ARIA usage -->
<nav aria-label="Main navigation">...</nav>
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
```

## Level AA Requirements (Standard)

### 1.4.3 Contrast (Minimum)
**Guideline:** Text must have 4.5:1 contrast ratio (3:1 for large text).

**Implementation:**
```css
/* Regular text (4.5:1 minimum) */
.text {
  color: #595959; /* On white background */
  background: #ffffff;
}

/* Large text 18pt+ or 14pt+ bold (3:1 minimum) */
.large-text {
  color: #767676; /* On white background */
  font-size: 18pt;
}

/* Non-text elements (3:1 minimum) */
.button {
  border: 2px solid #767676; /* On white background */
}
```

**Tools:**
- WebAIM Contrast Checker
- Contrast Ratio by Lea Verou
- Browser DevTools Contrast Checker

### 1.4.4 Resize Text
**Guideline:** Text can be resized up to 200% without loss of content or functionality.

**Implementation:**
```css
/* Use relative units */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2rem; /* 32px, scales with user settings */
}

p {
  font-size: 1rem; /* 16px */
  line-height: 1.5; /* 24px */
}

/* Avoid fixed heights that break at zoom */
.container {
  min-height: 10rem; /* Instead of height: 160px */
}
```

### 1.4.5 Images of Text
**Guideline:** Use actual text rather than images of text.

**Implementation:**
```html
<!-- Bad -->
<img src="heading-text.png" alt="Welcome to Our Site">

<!-- Good -->
<h1>Welcome to Our Site</h1>

<!-- Acceptable for logos -->
<img src="company-logo.png" alt="Company Name">
```

### 2.4.1 Bypass Blocks
**Guideline:** Provide a way to skip repeated content.

**Implementation:**
```html
<!-- Skip to main content link -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<header>
  <nav>...</nav>
</header>

<main id="main-content">
  <h1>Page Title</h1>
  ...
</main>
```

```css
/* Visually hidden until focused */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 2.4.2 Page Titled
**Guideline:** Web pages have descriptive and informative titles.

**Implementation:**
```html
<!-- Descriptive page titles -->
<title>Contact Us - Company Name</title>
<title>Shopping Cart (3 items) - Store Name</title>
<title>Error: Page Not Found - Website</title>

<!-- Update dynamically -->
<script>
document.title = `${productName} - Product Details - Store`;
</script>
```

### 2.4.3 Focus Order
**Guideline:** Focusable elements receive focus in a logical order.

**Implementation:**
```html
<!-- Natural tab order -->
<form>
  <label for="name">Name</label>
  <input id="name" type="text">

  <label for="email">Email</label>
  <input id="email" type="email">

  <button type="submit">Submit</button>
</form>

<!-- Avoid tabindex > 0 -->
<!-- Bad: -->
<div tabindex="3">Third</div>
<div tabindex="1">First</div>

<!-- Good: Use natural order or reorder HTML -->
<div tabindex="0">First</div>
<div tabindex="0">Second</div>
```

### 2.4.4 Link Purpose (In Context)
**Guideline:** The purpose of each link can be determined from link text or context.

**Implementation:**
```html
<!-- Bad -->
<p>For more information, <a href="...">click here</a>.</p>

<!-- Good -->
<p><a href="...">Read more about our services</a>.</p>

<!-- Good with context -->
<article>
  <h2>New Product Launch</h2>
  <p>We're excited to announce...</p>
  <a href="...">Read more</a> <!-- Context from heading -->
</article>

<!-- Best with aria-label -->
<a href="..." aria-label="Read more about new product launch">
  Read more
</a>
```

### 3.1.2 Language of Parts
**Guideline:** Language of each passage or phrase can be determined.

**Implementation:**
```html
<p>
  The Spanish phrase
  <span lang="es">Buenos días</span>
  means good morning.
</p>
```

### 3.2.3 Consistent Navigation
**Guideline:** Navigation repeated on multiple pages occurs in the same relative order.

**Implementation:**
```html
<!-- Same navigation on all pages -->
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### 3.3.1 Error Identification
**Guideline:** Errors are automatically detected and described to users.

**Implementation:**
```html
<form>
  <label for="email">Email</label>
  <input id="email" type="email" aria-describedby="email-error" aria-invalid="true">
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
</form>
```

### 3.3.2 Labels or Instructions
**Guideline:** Labels or instructions are provided when content requires user input.

**Implementation:**
```html
<!-- Clear labels -->
<label for="phone">Phone number (format: 555-123-4567)</label>
<input id="phone" type="tel" placeholder="555-123-4567">

<!-- Required fields -->
<label for="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" type="text" required>

<!-- Fieldset for groups -->
<fieldset>
  <legend>Shipping address</legend>
  <label for="street">Street</label>
  <input id="street" type="text">
  ...
</fieldset>
```

## Level AAA Requirements (Enhanced)

### 1.4.6 Contrast (Enhanced)
**Guideline:** Text has 7:1 contrast ratio (4.5:1 for large text).

**Implementation:**
```css
/* Enhanced contrast */
.text {
  color: #404040; /* 10.7:1 on white */
  background: #ffffff;
}

.button {
  color: #ffffff;
  background: #003d7a; /* 7.2:1 */
}
```

### 2.4.8 Location
**Guideline:** Information about user's location within website is available.

**Implementation:**
```html
<!-- Breadcrumbs -->
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/products/shoes">Shoes</a></li>
    <li aria-current="page">Running Shoes</li>
  </ol>
</nav>

<!-- Current page indication in navigation -->
<nav>
  <a href="/">Home</a>
  <a href="/about" aria-current="page">About</a>
  <a href="/contact">Contact</a>
</nav>
```

### 2.5.5 Target Size
**Guideline:** Touch targets are at least 44x44 pixels.

**Implementation:**
```css
/* Minimum target size */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
}

/* Spacing between targets */
.button-group button {
  margin: 8px;
}
```

## ARIA (Accessible Rich Internet Applications)

### ARIA Roles
```html
<!-- Landmark roles -->
<div role="banner">...</div> <!-- or <header> -->
<div role="navigation">...</div> <!-- or <nav> -->
<div role="main">...</div> <!-- or <main> -->
<div role="complementary">...</div> <!-- or <aside> -->
<div role="contentinfo">...</div> <!-- or <footer> -->

<!-- Widget roles -->
<div role="button" tabindex="0">...</div>
<div role="checkbox" aria-checked="false" tabindex="0">...</div>
<div role="dialog" aria-labelledby="dialog-title">...</div>
<div role="tab" aria-selected="true">...</div>
```

### ARIA States and Properties
```html
<!-- aria-label: Provides accessible name -->
<button aria-label="Close dialog">X</button>

<!-- aria-labelledby: References element that labels this element -->
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
  ...
</div>

<!-- aria-describedby: References element that describes this element -->
<input aria-describedby="password-requirements">
<p id="password-requirements">
  Password must be at least 8 characters
</p>

<!-- aria-expanded: Indicates if element is expanded -->
<button aria-expanded="false" aria-controls="menu">
  Menu
</button>
<div id="menu" hidden>...</div>

<!-- aria-hidden: Hides from assistive tech -->
<span aria-hidden="true" class="decorative-icon">★</span>

<!-- aria-live: Announces dynamic changes -->
<div aria-live="polite" aria-atomic="true">
  <p>Loading...</p>
</div>

<!-- aria-current: Indicates current item -->
<nav>
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>
```

### ARIA Best Practices
1. **Use semantic HTML first**: `<button>` over `<div role="button">`
2. **Don't override native semantics**: Don't add role to semantic elements
3. **All interactive ARIA controls must be keyboard accessible**
4. **Don't use aria-label on div or span** unless they have a role
5. **aria-hidden="true" removes element from accessibility tree**
6. **Manage focus for dynamic content**
7. **Test with screen readers**: NVDA, JAWS, VoiceOver

## Testing Procedures

### Automated Testing
```bash
# Install axe-core
npm install --save-dev axe-core

# Run automated checks
# Returns violations with severity and remediation guidance
```

**Tools:**
- axe DevTools Extension
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse (Chrome DevTools)
- Pa11y

### Manual Testing
1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Test Space/Enter on buttons
   - Test Escape on modals
   - Test Arrow keys on custom controls
   - Ensure focus is always visible

2. **Screen Reader Testing**
   - NVDA (Windows, free)
   - JAWS (Windows, paid)
   - VoiceOver (Mac, built-in)
   - TalkBack (Android)
   - Test all interactive elements
   - Verify headings structure
   - Check form labels and errors
   - Test dynamic content announcements

3. **Color Contrast**
   - Check all text against backgrounds
   - Test UI components (buttons, inputs, icons)
   - Verify focus indicators
   - Test in different color modes

4. **Zoom and Reflow**
   - Test at 200% zoom
   - Ensure no horizontal scrolling (except data tables)
   - Verify all content remains accessible

5. **Form Testing**
   - Check all form labels
   - Test error messages
   - Verify required field indicators
   - Test form submission feedback

## Common Patterns

### Modal Dialogs
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
  <p>Are you sure you want to delete this item?</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>

<script>
// Trap focus inside modal
// Close on Escape key
// Return focus to trigger element on close
</script>
```

### Tabs
```html
<div role="tablist" aria-label="Content tabs">
  <button role="tab" aria-selected="true" aria-controls="panel1" id="tab1">
    Tab 1
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel2" id="tab2">
    Tab 2
  </button>
</div>

<div role="tabpanel" id="panel1" aria-labelledby="tab1">
  Content 1
</div>
<div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
  Content 2
</div>
```

### Accordions
```html
<div class="accordion">
  <h3>
    <button aria-expanded="false" aria-controls="section1">
      Section 1
    </button>
  </h3>
  <div id="section1" hidden>
    Content 1
  </div>

  <h3>
    <button aria-expanded="false" aria-controls="section2">
      Section 2
    </button>
  </h3>
  <div id="section2" hidden>
    Content 2
  </div>
</div>
```

### Toast Notifications
```html
<div role="status" aria-live="polite" aria-atomic="true">
  <p>Item added to cart</p>
</div>

<!-- For errors -->
<div role="alert" aria-live="assertive">
  <p>Error: Please try again</p>
</div>
```

## Quick Reference Checklist

- [ ] All images have alt text
- [ ] Headings in logical order (h1, h2, h3...)
- [ ] All form inputs have labels
- [ ] Color contrast meets 4.5:1 (text) and 3:1 (UI)
- [ ] All functionality available via keyboard
- [ ] Focus indicators visible
- [ ] Skip to main content link present
- [ ] Page titles descriptive
- [ ] Error messages clear and helpful
- [ ] ARIA used correctly (not overused)
- [ ] Lang attribute on html element
- [ ] Responsive at 200% zoom
- [ ] No content flashing more than 3x per second
- [ ] Touch targets at least 44x44px (mobile)
- [ ] Links have descriptive text
- [ ] Tables have proper headers
- [ ] Lists use proper markup (ul, ol, dl)
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Tested with screen reader
- [ ] Tested with keyboard only
- [ ] Automated tests passing

## Resources

### Official Documentation
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

### Learning
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [WebAIM Articles](https://webaim.org/articles/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
