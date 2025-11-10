# AI Frontend Prompt Generation Framework

## Overview

This framework provides a structured approach to creating high-quality prompts for AI-driven frontend development tools (Vercel v0, Lovable.ai, Cursor, GitHub Copilot, etc.). Following this framework ensures generated code is accurate, functional, and production-ready.

## Core Prompting Principles

### 1. Be Explicit and Detailed
The AI cannot read your mind. Provide comprehensive context and specific requirements.

**Bad:**
```
Create a form
```

**Good:**
```
Create a user registration form with the following fields:
- Full Name (text input, required, 2-50 characters)
- Email (email input, required, validated format)
- Password (password input, required, minimum 8 characters, must include 1 uppercase, 1 lowercase, 1 number)
- Confirm Password (password input, must match password field)
- Terms acceptance (checkbox, required)

Include real-time validation with error messages below each field.
Submit button should be disabled until all fields are valid.
```

### 2. Iterate, Don't Expect Perfection
Build complex UIs component by component, not all at once.

**Strategy:**
1. **Foundation**: Layout shell, navigation, basic structure
2. **Core Components**: One component at a time (form, card, modal)
3. **Interactions**: Add JavaScript functionality incrementally
4. **Polish**: Animations, transitions, edge cases last

### 3. Provide Context First
Start every prompt with necessary background information.

**Context Elements:**
- Tech stack (React, Vue, Next.js, TypeScript, Tailwind, etc.)
- Existing code patterns and conventions
- Design system and component library
- API structure and data models
- User flows and business logic

### 4. Mobile-First Approach
Always describe mobile layout first, then progressive enhancement.

**Structure:**
1. Mobile (320px-767px): Base experience
2. Tablet (768px-1023px): Enhanced layouts
3. Desktop (1024px+): Full featured

## The 4-Part Framework

Every effective AI prompt follows this structure:

### Part 1: High-Level Goal

**Purpose:** Orient the AI on the primary objective

**Format:** 1-2 sentences stating what to build

**Examples:**
```
Create a responsive user registration form with client-side validation and API integration.

Build an interactive product card component with image gallery, size selector, and add-to-cart functionality.

Generate a dashboard layout with sidebar navigation, header, and content area that supports light/dark themes.
```

**Guidelines:**
- Be specific about what, not how
- Mention key features but don't explain implementation
- Set clear scope ("form" not "entire application")

### Part 2: Detailed Step-by-Step Instructions

**Purpose:** Provide granular, sequential actions

**Format:** Numbered list of specific steps

**Example:**
```
1. Create a new file named `RegistrationForm.tsx` in the `components/auth/` directory

2. Import required dependencies:
   - React and useState, useForm hooks
   - Zod for validation schema
   - API client from '@/lib/api'
   - Button and Input components from '@/components/ui'

3. Define the form schema using Zod:
   - name: string, min 2 chars, max 50 chars
   - email: valid email format
   - password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
   - confirmPassword: must match password field
   - terms: boolean, must be true

4. Create the RegistrationForm component using React Hook Form:
   - Initialize form with useForm and zodResolver
   - Set up form state and error handling
   - Create submit handler that calls `/api/auth/register` endpoint

5. Implement the form UI with Tailwind CSS:
   - Full name input with label and error message slot
   - Email input with label and error message slot
   - Password input with show/hide toggle and strength indicator
   - Confirm password input with label
   - Terms checkbox with link to terms page
   - Submit button (disabled when form invalid or submitting)

6. Add real-time validation:
   - Show errors on blur for each field
   - Display validation status icons (✓ for valid, ✗ for invalid)
   - Update submit button state based on form validity

7. Handle form submission:
   - Show loading state on button during API call
   - On success: redirect to dashboard
   - On error: display error message above form
   - Clear form after successful submission

8. Add responsive styles:
   - Mobile: Single column, full width inputs
   - Tablet: Same layout with adjusted padding
   - Desktop: Centered form with max-width 500px
```

**Guidelines:**
- Start with file creation and imports
- Define data structures and schemas
- Build component structure
- Implement UI and styling
- Add interactions and functionality
- Handle states (loading, error, success)
- Include responsive behavior

### Part 3: Code Examples & Constraints

**Purpose:** Provide concrete examples and explicit boundaries

**Format:** Code snippets, API contracts, data structures, and "do NOT" instructions

**Example:**
```
API Endpoint:
```typescript
POST /api/auth/register
Content-Type: application/json

// Request body
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Success response (201)
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}

// Error response (400)
{
  "error": "Email already exists"
}
```

**Existing Button Component Usage:**
```typescript
import { Button } from '@/components/ui/button'

<Button variant="primary" size="md" loading={isLoading}>
  Submit
</Button>
```

**Do NOT:**
- Do NOT create a separate confirmation email step (handled by backend)
- Do NOT include social login buttons (not in MVP scope)
- Do NOT add password recovery link (separate feature)
- Do NOT modify the existing API client or auth utilities
- Do NOT use inline styles - use Tailwind utility classes only

**Design System Colors:**
```typescript
// Use these exact Tailwind classes
primary: 'bg-blue-600 hover:bg-blue-700'
secondary: 'bg-gray-200 hover:bg-gray-300'
error: 'text-red-600 bg-red-50'
success: 'text-green-600 bg-green-50'
```
```

**Guidelines:**
- Show exact API contracts with request/response examples
- Provide data structure examples
- Include existing component usage patterns
- State explicit "do NOT" constraints
- Reference design system values
- Show error handling patterns

### Part 4: Strict Scope Definition

**Purpose:** Define clear boundaries to prevent unintended changes

**Format:** Two lists - what to create/modify and what to leave alone

**Example:**
```
Files to CREATE:
- src/components/auth/RegistrationForm.tsx
- src/components/auth/PasswordStrengthIndicator.tsx (if not exists)

Files to MODIFY:
- src/pages/register.tsx (add RegistrationForm component)

Files to LEAVE UNTOUCHED:
- src/components/ui/* (all existing UI components)
- src/lib/api.ts (API client configuration)
- src/middleware/auth.ts (authentication middleware)
- src/pages/login.tsx (separate login page)
- All other pages and components

Scope Boundaries:
- Only implement registration functionality
- Do not modify navigation or layout components
- Do not change existing routing configuration
- Do not alter global styles or theme configuration
- Do not refactor existing authentication logic
```

**Guidelines:**
- Explicitly list files to create
- Explicitly list files to modify
- Explicitly list files to avoid changing
- Define scope boundaries
- Prevent feature creep

## Mobile-First Prompting

### Mobile Layout (320px - 767px)

**Focus:** Core functionality, touch-optimized, vertical stacking

**Prompt Structure:**
```
For mobile devices (320px-767px):
1. Stack all elements vertically with 16px spacing
2. Use full-width components (w-full)
3. Set minimum touch target size to 44x44px
4. Use larger fonts: text-base (16px) for body, text-lg (18px) for headings
5. Simplify navigation to hamburger menu
6. Show condensed data tables (hide non-essential columns)
7. Position fixed actions at bottom of screen
8. Use single-column forms with labels above inputs
9. Implement swipe gestures for image galleries
10. Show one content card per row
```

### Tablet Layout (768px - 1023px)

**Focus:** Enhanced layouts, better use of space

**Prompt Structure:**
```
For tablet devices (768px-1023px):
1. Use 2-column layouts where appropriate
2. Show side-by-side content cards (2 per row)
3. Expand navigation to show more options
4. Increase spacing to 24px between sections
5. Show more table columns (but not all)
6. Use floating action buttons instead of bottom bar
7. Arrange form fields in 2 columns for related data
8. Show sidebar navigation alongside content
9. Use larger images and media
10. Implement hover states for interactive elements
```

### Desktop Layout (1024px+)

**Focus:** Full feature set, optimal information density

**Prompt Structure:**
```
For desktop devices (1024px+):
1. Use multi-column layouts (3-4 columns for content grids)
2. Show persistent sidebar navigation
3. Display full data tables with all columns
4. Implement hover tooltips and dropdown menus
5. Use 32px spacing between major sections
6. Show detailed information cards (3-4 per row)
7. Arrange complex forms in multi-column layouts
8. Add keyboard shortcuts for common actions
9. Implement drag-and-drop for advanced interactions
10. Show persistent headers with full navigation
```

## Component-by-Component Strategy

### Phase 1: Layout Shell
```
Create the basic page structure with:
1. Header with logo and navigation
2. Main content area
3. Sidebar (if applicable)
4. Footer

Use semantic HTML (header, nav, main, aside, footer)
Implement responsive grid layout
No interactive functionality yet - just structure
```

### Phase 2: Core Components
```
Build one component at a time:
1. Product Card
2. Search Bar
3. Filter Panel
4. Pagination

For each component:
- Create separate file
- Include all states (default, loading, error, empty)
- Implement full responsive behavior
- Test independently before integration
```

### Phase 3: Interactive Features
```
Add JavaScript functionality:
1. Form validation and submission
2. Modal dialogs and overlays
3. Dynamic filtering and search
4. State management

Implement one feature completely before moving to next
Include loading states and error handling
Test all user interactions
```

### Phase 4: Polish & Refinement
```
Final enhancements:
1. Smooth transitions and animations
2. Micro-interactions (hover effects, click feedback)
3. Loading skeletons
4. Toast notifications
5. Empty states and error messages
6. Keyboard navigation improvements
7. Screen reader announcements
```

## Common Prompt Patterns

### Creating a New Component

```
Create a [ComponentName] component that [primary function].

**Requirements:**
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

**Props:**
```typescript
interface [ComponentName]Props {
  prop1: type;
  prop2: type;
  onAction?: (data: DataType) => void;
}
```

**States:**
- Default: [description]
- Loading: [description]
- Error: [description]
- Empty: [description]

**Visual Design:**
- Colors: [specific colors from design system]
- Typography: [specific font sizes and weights]
- Spacing: [specific padding and margins]
- Borders: [specific border styles]

**Responsive Behavior:**
- Mobile: [description]
- Tablet: [description]
- Desktop: [description]

**Accessibility:**
- ARIA labels: [specific labels]
- Keyboard navigation: [specific keys]
- Screen reader announcements: [what to announce]

**File Location:** src/components/[path]/[ComponentName].tsx

**Do NOT:**
- [Specific constraint 1]
- [Specific constraint 2]
```

### Integrating an API

```
Integrate the [API Name] API to [purpose].

**API Details:**
```
Endpoint: [METHOD] /api/[path]
Authentication: Bearer token in Authorization header
Request: [request structure]
Response: [response structure]
Error codes: [error handling]
```

**Implementation Steps:**
1. Create API service function in src/services/[service].ts
2. Add TypeScript types for request/response
3. Implement error handling for [specific errors]
4. Add loading states during API calls
5. Cache responses using [caching strategy]
6. Handle rate limiting (max X requests per minute)

**Error Handling:**
- 400: Show validation errors to user
- 401: Redirect to login
- 403: Show "Access Denied" message
- 404: Show "Not Found" state
- 500: Show generic error message with retry option

**Do NOT:**
- Do NOT expose API keys in client code
- Do NOT skip error handling
- Do NOT make API calls on every keystroke
```

### Adding Animations

```
Add smooth animations for [specific interactions].

**Animations Needed:**
1. [Animation 1]: [trigger] → [effect] → [duration]
2. [Animation 2]: [trigger] → [effect] → [duration]

**Technical Requirements:**
- Use CSS transitions for simple animations
- Use Framer Motion for complex animations
- Respect prefers-reduced-motion setting
- Ensure animations don't block interaction
- Keep durations under 300ms for UI feedback

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Examples:**
- Button click: Scale down to 0.95 over 100ms
- Modal open: Fade in background + slide in modal over 200ms
- Toast notification: Slide in from top over 300ms, auto-dismiss after 3s
```

## Prompt Refinement Techniques

### After Initial Generation

1. **Test the output** - Actually run the generated code
2. **Identify gaps** - What's missing or incorrect?
3. **Provide specific feedback:**

```
The code generated correctly implements the form, but there are issues:

1. Password validation regex doesn't check for special characters
2. Error messages appear before user interacts with fields
3. Submit button remains enabled during API call
4. Success message doesn't include user's name

Please update the code to:
1. Add special character requirement to password regex
2. Only show errors after field blur or form submission attempt
3. Disable submit button and show loading spinner during API call
4. Include personalized success message: "Welcome, {userName}!"
```

### Iterative Refinement

Don't try to perfect in one prompt. Build → Test → Refine:

**Iteration 1:** Basic structure and functionality
**Iteration 2:** Styling and responsive behavior
**Iteration 3:** Edge cases and error handling
**Iteration 4:** Accessibility and polish

## Testing Generated Code

### Checklist

- [ ] Code compiles without errors
- [ ] All TypeScript types are correct
- [ ] Component renders correctly
- [ ] All props work as expected
- [ ] All states (loading, error, success) work
- [ ] Responsive behavior works at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Meets WCAG AA standards
- [ ] Handles edge cases (empty data, errors)
- [ ] Performance is acceptable (no unnecessary re-renders)

### Common Issues and Fixes

**Issue:** Generated code uses deprecated APIs
**Fix:** Specify exact package versions in prompt

**Issue:** Styles don't match design system
**Fix:** Provide exact Tailwind classes or CSS values

**Issue:** Missing error handling
**Fix:** Explicitly request error handling for all failure scenarios

**Issue:** Accessibility issues
**Fix:** Include specific ARIA requirements in prompt

**Issue:** Not responsive
**Fix:** Provide explicit responsive requirements for each breakpoint

## Example: Complete Prompt

```
# Create Product Card Component

## High-Level Goal
Create a responsive product card component for an e-commerce site that displays product information, handles image gallery, size selection, and add-to-cart functionality.

## Detailed Instructions

1. Create new file: src/components/products/ProductCard.tsx

2. Import dependencies:
   - React and useState
   - Next.js Image component
   - Button from '@/components/ui/button'
   - useCart hook from '@/hooks/useCart'
   - Product type from '@/types/product'

3. Define ProductCard component with props:
```typescript
interface ProductCardProps {
  product: Product;
  onQuickView?: () => void;
}
```

4. Implement component structure:
   - Image gallery (main image + 3 thumbnails)
   - Product name and brand
   - Price display (original + discounted if on sale)
   - Size selector (dropdown or buttons)
   - Quantity selector
   - Add to cart button
   - Wishlist button (heart icon)

5. Add interactive features:
   - Click thumbnail to change main image
   - Hover on image for zoom effect
   - Select size (required before adding to cart)
   - Adjust quantity (1-10)
   - Add to cart (call useCart().addItem())
   - Toggle wishlist
   - Quick view modal trigger

6. Implement states:
   - selectedSize: string | null
   - quantity: number (default 1)
   - currentImageIndex: number (default 0)
   - isWishlisted: boolean
   - isAdding: boolean (loading state)

7. Handle add to cart:
   - Validate size is selected
   - Show loading state on button
   - Call addItem with product, size, quantity
   - Show success toast notification
   - Reset quantity to 1

8. Style with Tailwind CSS:
   - Card: white background, rounded-lg, shadow-md
   - Hover: shadow-lg, scale-105 transition
   - Images: object-cover, aspect-square
   - Buttons: according to design system below

9. Responsive layout:
   - Mobile: Full width, images stack vertically
   - Tablet: 2 cards per row, side-by-side layout
   - Desktop: 3-4 cards per row, enhanced hover effects

10. Accessibility:
    - Alt text for all images
    - ARIA labels for icon buttons
    - Keyboard navigation for image gallery
    - Focus indicators on all interactive elements
    - Screen reader announcements for cart actions

## Code Examples & Constraints

Product Type:
```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  inStock: boolean;
  rating: number;
  reviewCount: number;
}
```

UseCart Hook:
```typescript
const { addItem, isAdding } = useCart();

addItem({
  productId: product.id,
  size: selectedSize,
  quantity: quantity
});
```

Design System:
```typescript
// Button variants
<Button variant="primary">Add to Cart</Button>
<Button variant="outline" size="icon"><HeartIcon /></Button>

// Colors
bg-white, bg-gray-50
text-gray-900, text-gray-600
border-gray-200
hover:bg-gray-100

// Sale badge
bg-red-500 text-white text-sm px-2 py-1 rounded
```

Do NOT:
- Do NOT add review section (separate component)
- Do NOT implement image zoom modal (use CSS transform)
- Do NOT add related products (parent component handles)
- Do NOT modify useCart hook or cart state management
- Do NOT create custom image component (use Next.js Image)

## Scope Definition

Files to CREATE:
- src/components/products/ProductCard.tsx

Files to MODIFY:
- None (this is a new standalone component)

Files to LEAVE UNTOUCHED:
- src/hooks/useCart.ts
- src/components/ui/button.tsx
- src/types/product.ts
- All other components

Import Pattern:
- Import Button from '@/components/ui/button'
- Import types from '@/types/product'
- Import hooks from '@/hooks/useCart'
- Use Next.js Image for images
```

## Resources

### AI Tools for Frontend
- **Vercel v0**: React/Next.js component generation
- **Lovable.ai**: Full-stack web app generation
- **Cursor**: AI-powered code editor
- **GitHub Copilot**: In-IDE code completion
- **ChatGPT/Claude**: General purpose code generation

### Best Practices
- Always provide complete context
- Be explicit about requirements
- Include examples and constraints
- Define clear scope boundaries
- Iterate and refine incrementally
- Test generated code thoroughly
- Provide feedback for improvements
- Build component by component
- Start with mobile layout
- Prioritize accessibility

### Common Pitfalls to Avoid
- ❌ Vague requirements ("make it look nice")
- ❌ Missing tech stack details
- ❌ No API contract specifications
- ❌ Undefined scope (may modify wrong files)
- ❌ Forgetting accessibility requirements
- ❌ Not specifying responsive behavior
- ❌ Missing error handling instructions
- ❌ Incomplete state management details
- ❌ No design system references
- ❌ Expecting perfection in one prompt
