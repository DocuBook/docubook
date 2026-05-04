/**
 * @file daisy-meta.ts
 * @description Central DaisyUI design system metadata and configuration.
 *
 * LLM AGENT INSTRUCTIONS:
 * This file serves as the source of truth for the DaisyUI implementation within the application.
 * If you are tasked with adding new styling options or DaisyUI features, ensure you update
 * the corresponding arrays and types here.
 *
 * 1. Maintain `as const` on all arrays to ensure strong literal typing across the app.
 * 2. When adding new values to an array (e.g. a new custom color or a newly supported DaisyUI size),
 *    just add the string literal to the array. The associated TypeScript `type` will automatically update.
 */

/**
 * Standard semantic color names used by DaisyUI.
 * Add custom colors here if extended in tailwind.config.ts / daisyui config.
 */
export const DAISY_COLORS = [
    "primary",
    "secondary",
    "accent",
    "info",
    "success",
    "warning",
    "error",
    "neutral",
] as const;
export type DaisyColor = (typeof DAISY_COLORS)[number];

/**
 * Common positional placements relative to a component (e.g., tooltips, dropdowns, drawing).
 * Used when a component can be attached to various sides in space.
 */
export const DAISY_PLACEMENTS = [
    "top",
    "bottom",
    "left",
    "right",
    "start",
    "end",
    "middle",
] as const;
export type DaisyPlacement = (typeof DAISY_PLACEMENTS)[number];

/**
 * Common flex/grid alignment values.
 */
export const DAISY_ALIGNMENT = ["start", "center", "end"] as const;
export type DaisyAlignment = (typeof DAISY_ALIGNMENT)[number];

/**
 * Structural orientations for linear components like dividers or menus.
 */
export const DAISY_ORIENTATION = ["horizontal", "vertical"] as const;
export type DaisyOrientation = (typeof DAISY_ORIENTATION)[number];

/**
 * Standard sizing scale for DaisyUI components from extra-small (xs) to extra-large (xl).
 */
export const DAISY_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
export type DaisySize = (typeof DAISY_SIZES)[number];

/**
 * Visual variant styles for components (e.g., button outlines vs ghost styles).
 * Add any new custom variants defined in your theme here.
 */
export const DAISY_VARIANTS = [
    "dash",
    "outline",
    "ghost",
    "link",
    "soft",
] as const;
export type DaisyVariant = (typeof DAISY_VARIANTS)[number];

/**
 * Border-radius shaping modifiers.
 */
export const DAISY_SHAPES = ["square", "circle"] as const;
export type DaisyShape = (typeof DAISY_SHAPES)[number];

/**
 * Interactive state modifiers. Note that 'hover' or 'focus' are usually pseudo-classes,
 * but 'active' and 'disabled' can often be explicitly applied as standard classes in DaisyUI.
 */
export const DAISY_ACTIVITY = ["active", "disabled"] as const;
export type DaisyActivity = (typeof DAISY_ACTIVITY)[number];

/**
 * Defines the optional structural modifiers supported by any given DaisyUI component.
 * Used primarily by the `COMPONENT_CAPABILITIES` registry below.
 */
export type ComponentCapability = {
    colors?: boolean;
    sizes?: boolean;
    variants?: DaisyVariant[] | boolean;
    shapes?: boolean;
    activity?: boolean;
    placement?: DaisyPlacement[];
    alignment?: DaisyAlignment[];
    orientation?: boolean;
};

/**
 * COMPONENT_CAPABILITIES
 *
 * LLM AGENT INSTRUCTIONS:
 * This object defines the supported modifiers (colors, sizes, variants, etc.) for each DaisyUI component.
 * When continuing the implementation and adding a new DaisyUI component, you MUST register its capabilities here.
 *
 * Guidelines for adding a new component:
 * 1. Reference the official DaisyUI documentation for the given component.
 * 2. Boolean flags (`true`): Set to `true` if the component broadly supports standard modifiers:
 *    - `colors: true` -> Supports standard colors (primary, secondary, error, success, etc.)
 *    - `sizes: true`  -> Supports standard sizes (xs, sm, md, lg, xl)
 *    - `shapes: true` -> Supports shapes (circle, square)
 *    - `activity: true` -> Supports active/disabled states
 * 3. Arrays / Specific values: If a component only supports specific variants or placements, provide an explicit array:
 *    - e.g., `variants: ["ghost", "outline"]` or `placement: ["top", "bottom"]`
 * 4. If a component lacks a modifier altogether (e.g. `collapse` rarely uses sizes), omit it.
 *
 * This metadata is critical. It powers safelisting generators and dynamic class builders across the application.
 */
export const COMPONENT_CAPABILITIES: Partial<
    Record<string, ComponentCapability>
> = {
    // Buttons: highly versatile, support all standard Daisy modifiers
    btn: {
        colors: true,
        sizes: true,
        variants: true,
        shapes: true,
        activity: true,
    },
    // Badges: support colors and sizes, but "link" variant usually isn't applicable
    badge: {
        colors: true,
        sizes: true,
        variants: DAISY_VARIANTS.filter((v) => v !== "link"),
    },
    // Cards: primarily adjust via sizes
    card: {
        sizes: true,
    },
    // Tabs: defined by sizes and its placement in its container
    tabs: {
        sizes: true,
        placement: ["top", "bottom"],
    },
    // Text Inputs: standard inputs support colors, sizes, and the "ghost" style
    input: {
        colors: true,
        sizes: true,
        variants: ["ghost"],
    },
    // Range Sliders: standard colors and sizes apply
    range: {
        colors: true,
        sizes: true,
    },
    // Select dropdown inputs: standard colors and sizes
    select: {
        colors: true,
        sizes: true,
    },
    // Textareas: standard colors, sizes, and the "ghost" style
    textarea: {
        colors: true,
        sizes: true,
        variants: ["ghost"],
    },
    // Radio buttons and Checkboxes: core form toggles that support colors and sizes
    radio: {
        colors: true,
        sizes: true,
    },
    checkbox: {
        colors: true,
        sizes: true,
    },
    // Collapse: structure-driven. Core functionality is its open/close state.
    // Standard style modifiers like colors or sizes usually don't apply to the base class.
    collapse: {},
    // Dropdown wrappers: requires placement relative to trigger, and internal alignment
    dropdown: {
        placement: ["top", "bottom", "left", "right"],
        alignment: ["start", "center", "end"],
    },
    // Menus: can be sized, track active items, and layout horizontally or vertically
    menu: {
        sizes: true,
        activity: true,
        orientation: true,
    },
    // Modals: capabilities center on screen placement
    modal: {
        placement: ["top", "middle", "bottom", "start", "end"],
    },
};

/**
 * Derived list of all component keys registered in the system.
 */
export const DAISY_COMPONENTS = Object.keys(COMPONENT_CAPABILITIES) as string[];

/**
 * The unified default metadata object.
 * Used by dynamic generators, safelisting scripts, and UI builders to iterate
 * over the entire authorized design space.
 */
export const DAISY_META = {
    components: DAISY_COMPONENTS,
    colors: DAISY_COLORS,
    sizes: DAISY_SIZES,
    variants: DAISY_VARIANTS,
    shapes: DAISY_SHAPES,
    activity: DAISY_ACTIVITY,
    capabilities: COMPONENT_CAPABILITIES,
} as const;
