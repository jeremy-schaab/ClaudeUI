# AI Frontend Generation Prompt Template

Use this template to create structured, effective prompts for AI-driven frontend tools like Vercel v0, Lovable.ai, Cursor, or GitHub Copilot.

---

## Project Context

**Tech Stack:**
- Framework: [React / Vue / Next.js / etc.]
- Language: [TypeScript / JavaScript]
- Styling: [Tailwind CSS / CSS Modules / Styled Components / etc.]
- State Management: [Redux / Zustand / Context API / etc.]
- UI Library: [Shadcn/ui / Material-UI / Ant Design / Custom]

**Existing Patterns:**
- Component structure: [Describe how components are organized]
- Naming conventions: [PascalCase, kebab-case, etc.]
- File organization: [Folder structure]
- Import paths: [Absolute vs relative, aliases]

**Design System:**
- Colors: [Primary, secondary, accent colors]
- Typography: [Font families, sizes, weights]
- Spacing: [Spacing scale: 4px, 8px, 16px, etc.]
- Breakpoints: [Mobile, tablet, desktop values]

---

## High-Level Goal

[One to two sentences clearly stating what needs to be built. Be specific about the component/feature but don't explain implementation details.]

Example: "Create a responsive product card component that displays product information, handles image gallery navigation, and includes add-to-cart functionality with size selection."

---

## Detailed Step-by-Step Instructions

1. **File Creation**
   - Create new file: `[path/to/ComponentName.tsx]`
   - Location rationale: [Why this location?]

2. **Dependencies**
   - Import [specific dependencies]
   - Use [specific versions or APIs]

3. **Component Structure**
   - Define component with props: `[PropTypes]`
   - Set up state management: `[useState, useReducer, etc.]`
   - Initialize hooks: `[useEffect, useCallback, etc.]`

4. **UI Implementation**
   - Build [specific UI elements]
   - Apply [styling approach]
   - Structure [layout pattern]

5. **Functionality**
   - Implement [feature 1]
   - Add [feature 2]
   - Handle [edge case]

6. **State Management**
   - Initialize state: `[state variables]`
   - Update on: `[triggers]`
   - Persist using: `[strategy]`

7. **Event Handling**
   - On [event]: [action]
   - Validate [inputs]
   - Handle [errors]

8. **API Integration** (if applicable)
   - Call [endpoint]
   - Handle loading state
   - Process response
   - Handle errors

9. **Responsive Design**
   - **Mobile (320px-767px):**
     - [Specific mobile layout]
     - [Mobile-specific interactions]

   - **Tablet (768px-1023px):**
     - [Tablet layout adaptations]
     - [Enhanced features]

   - **Desktop (1024px+):**
     - [Full desktop layout]
     - [Desktop-only features]

10. **Accessibility**
    - Add ARIA labels: `[specific labels]`
    - Ensure keyboard navigation: `[keys and behavior]`
    - Implement focus management: `[focus order]`
    - Screen reader announcements: `[what to announce]`

---

## Code Examples & Constraints

### API Contract (if applicable)

```typescript
// Endpoint
[METHOD] /api/[path]

// Request
{
  "field1": "type",
  "field2": "type"
}

// Success Response (200/201)
{
  "data": {
    "field1": "value",
    "field2": "value"
  }
}

// Error Response (400/404/500)
{
  "error": "message",
  "details": "additional info"
}
```

### Data Structures

```typescript
// Types/Interfaces
interface [TypeName] {
  field1: string;
  field2: number;
  field3?: boolean; // optional
}

// Props
interface [ComponentName]Props {
  prop1: Type1;
  prop2: Type2;
  onAction?: (data: DataType) => void;
}
```

### Existing Component Usage

```typescript
// Example of using existing components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

<Button variant="primary" size="md" loading={isLoading}>
  Submit
</Button>

<Input
  type="email"
  placeholder="Email address"
  error={errors.email}
/>
```

### Design System Values

```typescript
// Colors (use exact Tailwind classes)
primary: 'bg-blue-600 hover:bg-blue-700'
secondary: 'bg-gray-200 hover:bg-gray-300'
success: 'bg-green-600 text-white'
error: 'bg-red-600 text-white'
warning: 'bg-yellow-500 text-black'

// Typography
heading: 'text-2xl font-bold'
subheading: 'text-lg font-semibold'
body: 'text-base'
caption: 'text-sm text-gray-600'

// Spacing
section-gap: 'space-y-6'
element-gap: 'space-y-4'
tight-gap: 'space-y-2'
padding: 'p-4 md:p-6 lg:p-8'
```

### Do NOT

- ❌ Do NOT [specific constraint 1]
- ❌ Do NOT [specific constraint 2]
- ❌ Do NOT [specific constraint 3]
- ❌ Do NOT modify [existing files]
- ❌ Do NOT use [deprecated patterns]
- ❌ Do NOT skip [critical features]

---

## Scope Definition

### Files to CREATE

- [ ] `[path/to/NewComponent.tsx]` - [Purpose]
- [ ] `[path/to/NewUtils.ts]` - [Purpose]
- [ ] `[path/to/types.ts]` - [Purpose]

### Files to MODIFY

- [ ] `[path/to/ExistingFile.tsx]` - [What to change]
  - Add import: `import { NewComponent } from './NewComponent'`
  - Use component: `<NewComponent prop="value" />`

### Files to LEAVE UNTOUCHED

- ❌ `[path/to/GlobalState.ts]` - State management (don't modify)
- ❌ `[path/to/ApiClient.ts]` - API utilities (don't modify)
- ❌ `[path/to/Theme.ts]` - Theme configuration (don't modify)
- ❌ All other components not explicitly mentioned

### Scope Boundaries

- **In Scope:**
  - [Feature 1]
  - [Feature 2]
  - [Feature 3]

- **Out of Scope:**
  - [Feature not included]
  - [Future enhancement]
  - [Related but separate feature]

---

## Example Usage

After implementation, the component should be used like this:

```typescript
import { [ComponentName] } from '@/components/[path]';

function ParentComponent() {
  const handle[Action] = (data) => {
    // Handle action
  };

  return (
    <[ComponentName]
      prop1="value1"
      prop2={value2}
      on[Action]={handle[Action]}
    />
  );
}
```

---

## Validation Checklist

After code generation, verify:

- [ ] Component renders without errors
- [ ] All props work as expected
- [ ] States update correctly
- [ ] Events trigger properly
- [ ] API calls work (if applicable)
- [ ] Loading states display
- [ ] Error handling works
- [ ] Responsive at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Meets WCAG AA standards
- [ ] Follows project conventions
- [ ] TypeScript types are correct
- [ ] No console errors/warnings

---

## Notes

[Add any additional context, considerations, or special requirements here]

---

## Refinement Instructions (for iteration)

If the generated code needs improvements, provide specific feedback:

1. **What works well:**
   - [Specific aspect that's correct]

2. **What needs fixing:**
   - Issue: [Specific problem]
   - Expected: [What should happen instead]
   - Example: [Code snippet or description]

3. **Additional requirements:**
   - [New requirement not in original prompt]

---

**Template Version:** 1.0
**Last Updated:** [Date]
**Author:** [Your Name/Team]
