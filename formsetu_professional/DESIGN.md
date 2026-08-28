---
name: FormSetu Professional
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#444653'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#92f5a4'
  on-secondary-container: '#007233'
  tertiary: '#5a2500'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d3600'
  on-tertiary-container: '#ffa673'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#95f8a7'
  secondary-fixed-dim: '#79db8d'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap: 16px
  inline-gap: 12px
  section-margin: 32px
---

## Brand & Style

The design system is engineered for high-stakes professional environments, specifically recruitment and formal application processing. It prioritizes **credibility, efficiency, and clarity** over aesthetic flair. The visual language follows a **Corporate / Modern** direction, utilizing a structured "Container-based" architecture to organize complex data sets into digestible segments.

The emotional goal is to reduce applicant anxiety through order. The interface uses a systematic approach to whitespace and information density, ensuring that users feel they are interacting with a secure, institutional-grade portal. Decorative elements are eliminated in favor of functional indicators and clear hierarchical markers.

## Colors

The palette is anchored by **Recruitment Blue**, a color associated with stability and trust. 

- **Primary (#1e40af):** Used for critical actions, active states, and navigation highlights.
- **Success (#15803d):** Reserved for completed sections, valid inputs, and submission confirmations.
- **Warning/Review (#b45309):** Specifically for "Under Review" statuses or non-blocking alerts.
- **Neutral Surface (#f8fafc):** The primary canvas color, providing a soft background that reduces eye strain compared to pure white.
- **Text (#0f172a):** High-contrast Slate-900 for maximum legibility of fine print and labels.

## Typography

This design system utilizes **Inter** for its exceptional legibility in UI contexts, particularly for small-scale labels and data tables. 

- **Hierarchy:** Use `display` only for page titles. `headline-md` serves as the primary section header within forms.
- **Labels:** `label-bold` is used for field titles to ensure they stand out against input data.
- **Data Density:** For multi-column forms, `body-md` is the standard for user input and help text to maintain a compact footprint.
- **Weight:** Use Semi-Bold (600) sparingly to highlight key information or required field indicators.

## Layout & Spacing

The layout employs a **fixed-width centered grid** for desktop (max-width 1024px) to keep line lengths readable for form entry. 

- **Grid:** A 12-column system with 24px gutters. Forms typically span 8 columns for core content, with 4 columns reserved for progress trackers or contextual help.
- **Density:** Spacing is compact. Vertical gaps between related input fields should be 16px (`stack-gap`), while unrelated sections should be separated by 32px (`section-margin`).
- **Responsive:** On mobile, margins reduce to 16px and all multi-column form layouts reflow to a single vertical stack.

## Elevation & Depth

This system avoids heavy shadows to maintain a professional, "flat" appearance. 

- **Tonal Layers:** Depth is primarily communicated through color shifts. The main page background is `#f8fafc`, while form containers are pure white (`#ffffff`).
- **Borders:** Surfaces are defined by 1px solid borders in `#e2e8f0`.
- **Shadows:** Use a single "Micro-Shadow" for active cards: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`. 
- **Focus States:** Active input fields should use a 2px outer glow using the primary color at 20% opacity.

## Shapes

The shape language is conservative and disciplined. 

- **Base Radius:** A standard 8px (`rounded-lg` in this system) is applied to all main cards and modal containers. 
- **Interactive Elements:** Buttons and Input fields use a 4px (`rounded`) radius to maintain a precise, professional look.
- **Small Elements:** Tooltips and tags use a 2px radius.
- **Avoidance:** Do not use circular/pill shapes for buttons; keep them rectangular with subtle rounding to reinforce the formal tone.

## Components

- **Buttons:** 
    - **Primary:** Solid `#1e40af` with white text. High-contrast, used for "Save & Continue".
    - **Secondary:** White background with `#e2e8f0` border and `#0f172a` text.
- **Input Fields:** 1px border. Background is white. Labels must always be visible above the field (no floating labels that disappear). Mandatory fields are marked with a red asterisk `*` placed immediately after the label text.
- **Section Headers:** Accompanied by a 1px horizontal divider that spans the container width to clearly demarcate form phases.
- **Progress Stepper:** A vertical or horizontal track using the primary color for "Completed", a ring for "Current", and a light gray for "Upcoming".
- **Status Chips:** Small, low-saturation backgrounds with high-saturation text (e.g., Success Green background at 10% opacity with 100% opacity text).
- **Cards:** White background, 1px border, 8px corner radius. Used to group related questions (e.g., "Employment History").