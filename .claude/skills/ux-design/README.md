# UX Design Skill

A comprehensive Claude Code skill for UI/UX design, wireframing, HTML mockup generation, accessibility audits, and AI-driven frontend development.

## Quick Start

This skill activates automatically when you need UI/UX design expertise. Simply ask:

- "Create a UI/UX specification for my dashboard"
- "Generate wireframes for the user profile page"
- "Build an HTML mockup of the product card component"
- "Create a v0 prompt for the checkout flow"
- "Audit the navigation for accessibility issues"

## Core Capabilities

### 1. UI/UX Specification Creation
Create comprehensive design specifications using interactive templates:
- User personas and usability goals
- Information architecture with Mermaid diagrams
- User flows and task analysis
- Visual design (colors, typography, spacing)
- Component libraries and usage guidelines
- Accessibility requirements (WCAG 2.1)

**Output**: `docs/design/front-end-spec.md`

### 2. Wireframing (Casey's Domain)
Design information architecture and structural layouts:
- Content hierarchies and navigation structures
- User flow mapping with decision points
- Low-fidelity wireframes (text, ASCII, Mermaid)
- Responsive breakpoint planning
- Accessibility considerations

**Output**: `docs/design/wireframes/`

### 3. HTML Mockup Generation (Riley's Domain) ⭐
Build high-fidelity, interactive prototypes:

**Mockup Types:**
- **Static Mockups**: HTML/CSS only, no JavaScript
- **Interactive Mockups**: Full JavaScript functionality with state management
- **Component Mockups**: Reusable UI components with props and variants
- **Page Mockups**: Complete page layouts with all components integrated

**Features:**
- Semantic HTML5 with ARIA labels
- Pixel-perfect CSS (Flexbox, Grid, Custom Properties)
- Interactive JavaScript (forms, animations, state)
- Responsive design (mobile, tablet, desktop)
- Accessibility built-in (keyboard, screen reader)
- Developer handoff documentation

**Output**: `docs/design/mockups/`
```
mockups/
├── components/           # Individual components
│   └── product-card/
│       ├── index.html
│       ├── styles.css
│       ├── script.js
│       ├── assets/
│       └── README.md    # Developer handoff
├── pages/               # Full page mockups
├── html/                # Standalone HTML files
├── css/                 # Stylesheets
├── js/                  # JavaScript files
└── assets/              # Images, icons, fonts
```

### 4. AI Prompt Generation
Create structured prompts for AI tools (v0, Lovable.ai, Cursor):
- 4-part framework (Goal, Instructions, Examples, Scope)
- Mobile-first responsive design instructions
- Complete API contracts and data structures
- Component-by-component generation strategy
- Explicit constraints and boundaries

**Output**: Copy-ready prompts in markdown format

### 5. Design System Documentation
Document comprehensive design systems:
- Foundation (colors, typography, spacing, elevation, motion)
- Component library (variants, states, usage guidelines)
- Code examples and implementation notes
- Accessibility compliance documentation

**Output**: `docs/design/design-system.md`

### 6. Accessibility Audits
WCAG 2.1 compliance evaluation:
- Level A, AA, AAA requirements
- Four principles (Perceivable, Operable, Understandable, Robust)
- Detailed violation reports with remediation steps
- Testing procedures (automated and manual)
- Screen reader and keyboard navigation validation

**Output**: `docs/design/accessibility-audit.md`

## Directory Structure

All design deliverables use standardized locations:

```
[project-root]/
└── docs/
    └── design/
        ├── front-end-spec.md              # UI/UX specification
        ├── design-system.md               # Design system docs
        ├── accessibility-audit.md         # Accessibility reports
        ├── wireframes/                    # Wireframes
        │   ├── information-architecture/
        │   ├── user-flows/
        │   ├── layouts/
        │   └── navigation/
        └── mockups/                       # HTML mockups ⭐
            ├── components/                # Component mockups
            │   └── [component-name]/
            │       ├── index.html
            │       ├── styles.css
            │       ├── script.js
            │       ├── assets/
            │       └── README.md
            ├── pages/                     # Page mockups
            ├── html/                      # HTML files
            ├── css/                       # Stylesheets
            ├── js/                        # JavaScript
            ├── assets/                    # Media assets
            └── README.md
```

## Sally Persona

**Sally** - User Experience Designer & Accessibility Champion 🎨

**Characteristics:**
- Empathetic & user-focused
- Educational & mentoring
- Accessible & inclusive (WCAG champion)
- Creative & innovative
- Detail-oriented
- Collaborative
- Data-informed

**Sub-Personas:**
- **Casey** - Wireframe Expert specializing in information architecture
- **Riley** - HTML Mockup Expert specializing in pixel-perfect implementation

## Bundled Resources

### References (Load as needed)
- **design-principles.md** (14KB) - UX psychology, Gestalt principles, cognitive load
- **accessibility-guidelines.md** (18KB) - Complete WCAG 2.1 implementation guide
- **ai-prompt-framework.md** (21KB) - 4-part prompting methodology
- **component-patterns.md** (12KB) - UI pattern library

### Assets
- **spec-template.yaml** (15KB) - UI/UX specification template
- **prompt-template.md** (7KB) - AI prompt template

## Example Usage

### Create UI/UX Specification
```
User: "Create a UI/UX specification for a task management dashboard"

Sally: I'll help you create a comprehensive UI/UX specification.
Let me guide you through the template...

[Interactive elicitation for each section]
[Generates complete specification with diagrams]

Saved to: docs/design/front-end-spec.md
```

### Generate HTML Mockup
```
User: "Build an interactive HTML mockup of the product card component"

Riley: I'll create a high-fidelity HTML mockup of the product card.

[Builds semantic HTML structure]
[Applies pixel-perfect CSS]
[Adds JavaScript interactivity]
[Tests accessibility]
[Generates developer handoff docs]

Saved to: docs/design/mockups/components/product-card/
```

### Create AI Prompt
```
User: "Create a v0 prompt for the checkout flow"

Sally: I'll generate a structured prompt for v0...

[Analyzes design specs]
[Applies 4-part framework]
[Includes mobile-first responsive instructions]
[Defines scope and constraints]

[Outputs copy-ready prompt]
```

### Accessibility Audit
```
User: "Audit the navigation for accessibility"

Sally: Running comprehensive WCAG 2.1 accessibility audit...

[Evaluates against Level AA standards]
[Documents violations with severity]
[Provides remediation steps with code examples]
[Creates testing procedures]

Saved to: docs/design/accessibility-audit.md
```

## Core Principles

1. **User-Centric Above All** - Every design serves user needs
2. **Functionality Over Form** - Structure before styling
3. **Accessibility is Non-Negotiable** - WCAG AA minimum
4. **Mobile-First Always** - Start from smallest screen
5. **Pixel-Perfect Implementation** - Mockups match specs exactly
6. **Educate Through Design** - Teach UX principles throughout
7. **Performance-First** - Fast, lightweight interfaces
8. **Evidence-Based** - Ground decisions in research

## Quality Standards

All outputs meet:
- ✅ WCAG 2.1 AA compliance (AAA preferred)
- ✅ Mobile-first, responsive design
- ✅ Semantic HTML with ARIA
- ✅ Cross-browser compatible
- ✅ Keyboard accessible
- ✅ Screen reader compatible
- ✅ Performance optimized
- ✅ Developer-ready documentation

## When to Use

Use this skill when users need:
- UI/UX design expertise or interface creation
- Wireframing or information architecture
- **HTML prototypes or interactive mockups** ⭐
- AI frontend prompts for v0/Lovable.ai
- Design system documentation
- Accessibility audits or WCAG compliance
- Design critique or usability feedback
- User research planning

## Technology Focus

- Modern HTML5 semantic markup
- CSS3 (Flexbox, Grid, Custom Properties, Animations)
- Vanilla JavaScript (ES6+) or framework integration
- Responsive design (mobile-first)
- Accessibility (WCAG 2.1, ARIA)
- Performance optimization
- Progressive enhancement

## Skill Version

**Version**: 1.0
**Created**: 2025-01-28
**Last Updated**: 2025-01-28

---

**Note**: This skill encompasses all capabilities from the ux-expert agent, ux commands, and supporting .fyiai documents into a single, comprehensive, reusable skill package.
