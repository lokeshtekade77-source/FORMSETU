---
name: Civic Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built on the principles of **Modern Minimalism** with a focus on civic accessibility. It prioritizes a calm, human-centric interface that strips away the bureaucratic complexity typically associated with government services. 

The visual personality is defined by:
- **Calm Authority:** Using generous whitespace and a restrained palette to reduce cognitive load during complex tasks.
- **Human Connection:** Softening the "institutional" feel through rounded geometries and approachable typography.
- **Precision:** Ensuring every status indicator and form control feels deliberate and high-quality, reinforcing trust through technical excellence.

The system avoids the "heavy" aesthetic of traditional portals, opting instead for a lightweight, app-like experience that feels fast and responsive.

## Colors

This design system utilizes a sober, high-fidelity palette designed for long-form reading and data entry.

- **Primary (Trust Blue):** A vibrant but professional blue used for primary actions, active states, and brand presence. It is distinct from "government navy" to feel more like a modern utility.
- **Secondary (Success Green):** A soft, natural green dedicated to progress indicators, completion states, and positive feedback.
- **Tertiary (Warning Amber):** Reserved for cautionary states and pending items requiring attention.
- **Neutral (Slate Grays):** A sophisticated range of cool grays used to establish hierarchy without the harshness of pure black. 
- **Surface:** A pure white base (`#FFFFFF`) paired with a very subtle off-white (`#F8FAFC`) for background layering to define content areas without heavy borders.

## Typography

The typography strategy leverages two highly legible, modern typefaces to differentiate between structural information and reading content.

- **Geist (Headlines & Labels):** Used for UI chrome, headings, and data labels. Its geometric precision conveys a sense of modern engineering and clarity.
- **Inter (Body):** Used for all long-form text, descriptions, and user input. It is chosen for its exceptional readability at small sizes and high x-height, ensuring accessibility for all users.

**Scale Rules:**
- Use `display-lg` only for welcome screens or major landing sections.
- `label-sm` should be used sparingly for metadata or overlines, always with the defined uppercase transformation to ensure it doesn't get lost.
- All body text defaults to `body-md` for optimal balance between information density and legibility.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. Content is housed in a centered container with a maximum width to prevent line lengths from becoming unreadable on ultra-wide displays.

- **Grid:** A 12-column grid on desktop, transitioning to 4 columns on mobile.
- **Rhythm:** An 8px linear scale is used for all spatial relationships.
- **Negative Space:** This design system mandates "Active Whitespace." Sections should be separated by `stack-lg` to allow the eye to rest and to clearly demarcate different parts of a civic form.
- **Touch Targets:** All interactive elements must maintain a minimum 44px hit area, even if the visual representation is smaller.

## Elevation & Depth

To maintain a "Calm" and "Clean" aesthetic, this design system avoids heavy shadows and multiple stacked layers. Depth is communicated primarily through **Tonal Layering** and **Low-Contrast Outlines**.

- **Surface Tiers:**
    - **Level 0 (Background):** `#F8FAFC` — The canvas.
    - **Level 1 (Cards/Sheets):** `#FFFFFF` — The primary workspace.
- **Outlines:** Instead of heavy shadows, use a 1px border of `#E2E8F0` for cards.
- **Shadows:** Use a single "Soft Lift" shadow for floating elements (like dropdowns or active cards). 
    - *Specification:* `0px 4px 12px rgba(15, 23, 42, 0.05)`.
- **Active State:** When a form field is focused, use a 2px primary color ring with a 2px white offset to provide clear visual feedback without cluttering the UI.

## Shapes

The shape language is consistently "Rounded" to evoke a friendly, human character. 

- **Components:** Buttons, input fields, and small chips use the base `0.5rem` (8px) radius.
- **Containers:** Main content cards and modular sections use `rounded-lg` (1rem / 16px) to create a soft, approachable frame for data.
- **Status Pills:** Success/Error indicators use the "Full" radius (pill-shaped) to distinguish them from interactive buttons.
- **Consistency:** Avoid mixing sharp corners with rounded ones; all containers must follow the same radius logic to maintain a cohesive professional feel.

## Components

### Buttons
- **Primary:** Solid `primary-color`, white text, no gradient.
- **Secondary:** Ghost style (primary-color border and text) or subtle gray background.
- **States:** Hover should darken the background by 5-10%; active/click should slightly scale down (98%).

### Form Controls
- **Inputs:** 1px border (`#CBD5E1`), 12px horizontal padding. On focus, the border changes to `primary-color` with a subtle outer glow.
- **Checkboxes/Radios:** Use the `primary-color` for the selected state. Ensure the "hit area" extends to the label text.

### Status Indicators
- **Success (✓):** Secondary color icon + light green background tint.
- **Attention (⚠):** Tertiary color icon + light amber background tint.
- **Incomplete (○):** Mid-gray outline, no fill.
- Indicators should always pair an icon with a text label to ensure accessibility for color-blind users.

### Cards
- White background, 1px border (`#E2E8F0`), and `16px` corner radius.
- Use a `24px` internal padding for a "airy" feel that makes complex forms feel less cramped.

### Progress Steppers
- A thin horizontal line or vertical sidebar using the `primary-color` for completed steps and a muted neutral for upcoming steps. Use `label-sm` for step titles.