# NetRunner UI Design Guide

## 1. Introduction

This UI design guide provides comprehensive guidance for creating a consistent, intuitive, and visually appealing user interface for the NetRunner intelligence platform. The NetRunner interface should convey professionalism, technical sophistication, and clarity while maintaining high usability standards.

## 2. Design Principles

### 2.1 Core Principles

1. **Clarity** - Information should be presented clearly and concisely, using appropriate typography and visual hierarchy.
2. **Efficiency** - Users should be able to accomplish tasks with minimal steps and cognitive load.
3. **Consistency** - UI elements should behave predictably and look visually consistent.
4. **Feedback** - The system should provide clear feedback for all user actions.
5. **Flexibility** - The interface should accommodate different user workflows and experience levels.

### 2.2 Visual Language

1. **Professional** - Convey trustworthiness and technical sophistication.
2. **Focused** - Minimize distractions and emphasize important content.
3. **Structured** - Organize information in logical hierarchies.
4. **Scalable** - Design should work across different screen sizes and content volumes.

## 3. Color System

### 3.1 Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | `#1976d2` | `25, 118, 210` | Primary actions, key UI elements |
| Secondary | `#673ab7` | `103, 58, 183` | Secondary actions, accents |
| Error | `#d32f2f` | `211, 47, 47` | Error states, critical warnings |
| Warning | `#ff9800` | `255, 152, 0` | Warning states, caution indicators |
| Success | `#4caf50` | `76, 175, 80` | Success states, confirmation |
| Info | `#2196f3` | `33, 150, 243` | Information states, helpful tips |

### 3.2 Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background | `#f5f5f5` | `245, 245, 245` | Page background |
| Surface | `#ffffff` | `255, 255, 255` | Card and component backgrounds |
| Border | `#e0e0e0` | `224, 224, 224` | Borders, dividers |
| Text Primary | `#212121` | `33, 33, 33` | Primary text |
| Text Secondary | `#757575` | `117, 117, 117` | Secondary text |
| Text Disabled | `#9e9e9e` | `158, 158, 158` | Disabled text |

### 3.3 Semantic Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Intel - Identity | `#9c27b0` | `156, 39, 176` | Identity intelligence |
| Intel - Network | `#2196f3` | `33, 150, 243` | Network intelligence |
| Intel - Financial | `#4caf50` | `76, 175, 80` | Financial intelligence |
| Intel - Geospatial | `#ff9800` | `255, 152, 0` | Geospatial intelligence |
| Intel - Social | `#e91e63` | `233, 30, 99` | Social intelligence |
| Intel - Infrastructure | `#795548` | `121, 85, 72` | Infrastructure intelligence |
| Intel - Vulnerability | `#f44336` | `244, 67, 54` | Vulnerability intelligence |
| Intel - Darkweb | `#212121` | `33, 33, 33` | Darkweb intelligence |
| Intel - Threat | `#d32f2f` | `211, 47, 47` | Threat intelligence |
| Intel - Temporal | `#607d8b` | `96, 125, 139` | Temporal intelligence |

### 3.4 Dark Mode Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Background Dark | `#121212` | `18, 18, 18` | Page background (dark) |
| Surface Dark | `#1e1e1e` | `30, 30, 30` | Card and component backgrounds (dark) |
| Border Dark | `#333333` | `51, 51, 51` | Borders, dividers (dark) |
| Text Primary Dark | `#ffffff` | `255, 255, 255` | Primary text (dark) |
| Text Secondary Dark | `#b0b0b0` | `176, 176, 176` | Secondary text (dark) |
| Text Disabled Dark | `#6c6c6c` | `108, 108, 108` | Disabled text (dark) |

## 4. Typography

### 4.1 Font Family

- Primary Font: **Roboto**
- Fallback: **Arial**, **Helvetica**, **sans-serif**
- Monospace: **Roboto Mono**, **Consolas**, **monospace** (for code or terminal output)

### 4.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| H1 | 34px | 500 | 1.2 | Page titles |
| H2 | 24px | 500 | 1.2 | Section headings |
| H3 | 20px | 500 | 1.2 | Subsection headings |
| H4 | 18px | 500 | 1.2 | Card titles |
| H5 | 16px | 500 | 1.2 | Minor headings |
| H6 | 14px | 500 | 1.2 | Small headings |
| Body1 | 16px | 400 | 1.5 | Primary body text |
| Body2 | 14px | 400 | 1.5 | Secondary body text |
| Button | 14px | 500 | 1.75 | Button text |
| Caption | 12px | 400 | 1.5 | Small text, captions |
| Overline | 10px | 400 | 1.5 | Labels, metadata |

### 4.3 Typography Guidelines

- Maintain appropriate contrast ratios (WCAG AA compliance minimum)
- Use consistent text alignment (generally left-aligned)
- Limit line length to improve readability (50-75 characters per line)
- Use proper text hierarchy to guide users through content
- Avoid using too many different font sizes and weights

## 5. Component Design

### 5.1 Common Components

#### 5.1.1 Buttons

**Primary Button**
- Background: Primary color
- Text: White
- Hover: Darken primary color by 10%
- Active: Darken primary color by 15%
- Disabled: Gray background, lighter text

**Secondary Button**
- Background: Transparent
- Border: Primary color
- Text: Primary color
- Hover: Light primary color background
- Active: Slightly darker background
- Disabled: Gray border and text

**Text Button**
- Background: Transparent
- Text: Primary color
- Hover: Light primary color background
- Active: Slightly darker background
- Disabled: Gray text

#### 5.1.2 Input Fields

**Text Field**
- Border: Light gray (1px)
- Focus: Primary color border
- Error: Error color border
- Label: Above the field
- Helper Text: Below the field
- Padding: 12px

**Select Field**
- Match text field styling
- Dropdown icon: Subtle chevron

**Checkbox/Radio**
- Selected: Primary color
- Unselected: Gray
- Label: Right of the control

#### 5.1.3 Cards

**Standard Card**
- Background: Surface color
- Border: None
- Shadow: Subtle elevation (2dp)
- Border Radius: 4px
- Padding: 16px
- Title: H4 typography

**Interactive Card**
- Standard card styling
- Hover: Slightly elevated shadow (4dp)
- Active: More elevated shadow (8dp)
- Selected: Primary color indicator (left border or top)

### 5.2 Dashboard Components

#### 5.2.1 NetRunner Dashboard

**Top Bar**
- Background: Surface color
- Shadow: Subtle shadow to separate from content
- Height: 64px
- Logo: Left-aligned
- Navigation: Centered
- User Controls: Right-aligned

**Mode Tabs**
- Background: Transparent
- Selected: Primary color indicator
- Unselected: Gray text
- Hover: Lighter gray background
- Width: Equal or proportional to text

**Search Bar**
- Width: Full width of content area
- Height: 48px
- Border Radius: 4px
- Icon: Search icon on left
- Button: Primary button on right

**Results Area**
- Background: Surface color
- Padding: 16px
- Scrollable: Vertical scrolling when needed

#### 5.2.2 Power Tools Panel

**Tool Categories**
- Display: Horizontal tabs
- Selected: Primary color indicator
- Icons: Category-specific icons

**Tool Cards**
- Layout: Grid or list view (toggleable)
- Size: Equal width, variable height
- Image: Tool icon or logo
- Title: Tool name
- Description: Brief description
- Tags: Tool capabilities
- Selection: Checkbox or highlight

**Tool Details**
- Expanded view on selection
- Sections for configuration
- Input fields for parameters
- Action buttons at bottom

#### 5.2.3 Bot Control Panel

**Bot List**
- Layout: Grid or list view (toggleable)
- Bot Card: Similar to tool card
- Status Indicator: Color-coded (active, idle, error)

**Bot Configuration**
- Task configuration form
- Tool selection interface
- Schedule configuration
- Priority selector
- Target configuration

**Bot Monitoring**
- Progress indicators
- Status updates
- Result previews
- Action buttons (pause, stop, etc.)

#### 5.2.4 Intel Report Builder

**Report Template**
- Section headers
- Content blocks
- Edit controls
- Formatting tools

**Entity Management**
- Entity type selector
- Entity property fields
- Relationship mapper
- Confidence indicator

**Evidence Panel**
- Source listing
- Attachment controls
- Verification indicators
- Reliability scoring

**Report Actions**
- Save draft button
- Preview button
- Submit button
- Export options

#### 5.2.5 Intel Marketplace Panel

**Listing Grid**
- Filterable by category
- Sortable by various criteria
- Card-based layout
- Preview information

**Listing Details**
- Full report preview
- Pricing information
- Seller details
- Purchase controls

**Transaction History**
- List view
- Status indicators
- Action buttons

**Portfolio View**
- Owned reports
- Published listings
- Performance metrics

#### 5.2.6 Monitoring Dashboard

**Monitor Configuration**
- Form-based setup
- Source selection
- Frequency controls
- Alert configuration

**Active Monitors**
- Status indicators
- Last checked timestamp
- Result preview
- Action buttons

**Alert Panel**
- Severity indicators
- Timestamp
- Description
- Action buttons

## 6. Layout Guidelines

### 6.1 Grid System

- Base on a 12-column grid
- Gutter width: 16px
- Margin width: 24px
- Breakpoints:
  - xs: 0px
  - sm: 600px
  - md: 960px
  - lg: 1280px
  - xl: 1920px

### 6.2 Spacing System

- Based on 8px units
- Common spacings:
  - 4px (0.5x): Minimum spacing
  - 8px (1x): Tight spacing
  - 16px (2x): Standard spacing
  - 24px (3x): Medium spacing
  - 32px (4x): Large spacing
  - 48px (6x): Extra large spacing
  - 64px (8x): Maximum spacing

### 6.3 Container Widths

- Full width: 100%
- Wide container: 1200px max
- Standard container: 960px max
- Narrow container: 768px max

### 6.4 Responsive Guidelines

- Mobile-first approach
- Stack elements vertically on smaller screens
- Hide secondary information on smaller screens
- Use responsive typography (smaller on mobile)
- Ensure touch targets are at least 48x48px
- Adjust padding and margins on smaller screens

## 7. Iconography

### 7.1 Icon System

- Primary icons: Lucide React icons
- Icon sizes:
  - Small: 16px
  - Medium: 24px
  - Large: 32px
  - Extra Large: 48px

### 7.2 Icon Usage Guidelines

- Use icons consistently across the application
- Pair icons with text labels when possible
- Use color sparingly within icons
- Ensure icons are recognizable and intuitive
- Maintain visual weight consistency
- Use appropriate icon for the context

### 7.3 Custom Icon Requirements

- Follow the visual style of the main icon set
- Use consistent stroke width
- Maintain a consistent visual weight
- Keep details minimal and focused

## 8. Animation and Transitions

### 8.1 Timing

- Extra Fast: 100ms
- Fast: 200ms
- Standard: 300ms
- Slow: 500ms
- Extra Slow: 800ms

### 8.2 Easing

- Standard: cubic-bezier(0.4, 0.0, 0.2, 1)
- Deceleration: cubic-bezier(0.0, 0.0, 0.2, 1)
- Acceleration: cubic-bezier(0.4, 0.0, 1, 1)
- Sharp: cubic-bezier(0.4, 0.0, 0.6, 1)

### 8.3 Animation Guidelines

- Use subtle animations that don't distract
- Ensure animations have purpose (feedback, direction, etc.)
- Keep durations short for frequently used elements
- Use consistent timing and easing
- Provide reduced motion options for accessibility

## 9. Data Visualization

### 9.1 Charts and Graphs

- Use appropriate chart types for data relationships
- Apply consistent color coding
- Include proper axes and legends
- Ensure sufficient contrast
- Use patterns in addition to colors for accessibility

### 9.2 Data Tables

- Use zebra striping for readability
- Align text appropriately (left for text, right for numbers)
- Use consistent padding
- Include sorting and filtering controls
- Highlight selected or important rows

### 9.3 Maps and Geospatial

- Use consistent map styling
- Provide appropriate zoom controls
- Use clear markers and indicators
- Include legend for complex visualizations
- Ensure information is accessible beyond visual representation

## 10. State Indicators

### 10.1 Loading States

- Use progress indicators for operations >1 second
- Spinner for indeterminate loading
- Progress bar for determinate loading
- Skeleton screens for content loading
- Loading overlay for full-page operations

### 10.2 Empty States

- Provide helpful illustrations
- Include clear messaging
- Offer action buttons when appropriate
- Maintain consistent visual style

### 10.3 Error States

- Clear error messaging
- Suggested actions when possible
- Appropriate error icons
- Accessible error notifications

### 10.4 Success States

- Brief confirmation messages
- Success icons
- Next step suggestions
- Timed auto-dismissal for minor confirmations

## 11. Accessibility Guidelines

### 11.1 Color and Contrast

- Maintain WCAG AA minimum contrast (4.5:1 for normal text)
- Don't rely solely on color to convey information
- Provide sufficient contrast between adjacent colors
- Test designs in grayscale

### 11.2 Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use logical tab order
- Provide visible focus states
- Support keyboard shortcuts for power users

### 11.3 Screen Readers

- Use semantic HTML elements
- Provide alternative text for images
- Include ARIA labels where appropriate
- Test with screen readers

### 11.4 Motion and Animation

- Provide reduced motion options
- Avoid flashing content
- Keep animations subtle and purposeful
- Allow users to pause automatic movements

## 12. Implementation Notes

### 12.1 Material UI Integration

- Leverage Material UI components as foundation
- Customize theme to match NetRunner design system
- Extend components when needed, don't override excessively
- Use consistent component props

### 12.2 CSS Approach

- Use styled components for custom styling
- Follow consistent naming conventions
- Organize styles logically
- Keep specificity manageable

### 12.3 Design Tokens

- Implement design tokens for colors, spacing, etc.
- Use theme provider for consistent theming
- Support both light and dark mode
- Create a central theme file

## 13. Design Deliverables

### 13.1 Component Library

- Storybook documentation
- Component variations
- Props documentation
- Usage examples

### 13.2 Design Assets

- Icon library
- Color palette files
- Typography reference
- Layout templates

### 13.3 Documentation

- Design system documentation
- Implementation guidelines
- Accessibility checklist
- Design pattern library

## 14. Quality Assurance

### 14.1 Design QA Checklist

- Consistent use of color system
- Typography following guidelines
- Proper spacing and alignment
- Component consistency
- Responsive behavior
- Accessibility compliance

### 14.2 Implementation QA Checklist

- Visual match to design specifications
- Proper component usage
- Responsive implementation
- Animation and transition timing
- Cross-browser compatibility
- Accessibility implementation

## 15. Future Considerations

### 15.1 Design System Evolution

- Regular review and updates
- Feedback incorporation process
- Version control for design system
- Deprecation process for outdated patterns

### 15.2 Emerging Patterns

- Plan for new visualization techniques
- Account for emerging device types
- Consider AI interface conventions
- Prepare for augmented reality extensions
