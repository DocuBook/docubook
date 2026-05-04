# Navigation & Chrome Components

## Table of Contents
- [Accordion](#accordion)
- [Breadcrumbs](#breadcrumbs)
- [Collapse](#collapse)
- [Dropdown](#dropdown)
- [Kbd](#kbd)
- [Link](#link)
- [Mask](#mask)
- [Menu](#menu)
- [Mockup Browser](#mockup-browser)
- [Mockup Code](#mockup-code)
- [Mockup Phone](#mockup-phone)
- [Mockup Window](#mockup-window)
- [Pagination](#pagination)
- [Theme Controller](#theme-controller)
- [Tooltip](#tooltip)

---

## Accordion

Shows/hides content with only one item open at a time.

**Classes:** `collapse` | part: `collapse-title`, `collapse-content` | modifier: `collapse-arrow`, `collapse-plus`, `collapse-open`, `collapse-close`

```html
<div class="collapse collapse-arrow bg-base-100">
  <input type="radio" name="accordion-1" checked="checked" />
  <div class="collapse-title font-semibold">Item 1</div>
  <div class="collapse-content"><p>Content for item 1.</p></div>
</div>
<div class="collapse collapse-arrow bg-base-100">
  <input type="radio" name="accordion-1" />
  <div class="collapse-title font-semibold">Item 2</div>
  <div class="collapse-content"><p>Content for item 2.</p></div>
</div>
```

All radio inputs with the same `name` work as a group — only one open at a time. Use different names for separate accordion sets on the same page.

---

## Breadcrumbs

Navigation trail.

**Classes:** `breadcrumbs`

```html
<div class="breadcrumbs text-sm">
  <ul>
    <li><a>Home</a></li>
    <li><a>Documents</a></li>
    <li>Current Page</li>
  </ul>
</div>
```

Can contain icons inside links. Scrolls if content exceeds `max-width`.

---

## Collapse

Shows/hides content (standalone, not grouped like accordion).

**Classes:** `collapse` | part: `collapse-title`, `collapse-content` | modifier: `collapse-arrow`, `collapse-plus`, `collapse-open`, `collapse-close`

```html
<!-- Using tabindex -->
<div tabindex="0" class="collapse collapse-plus bg-base-100">
  <div class="collapse-title font-medium">Click to expand</div>
  <div class="collapse-content"><p>Hidden content here.</p></div>
</div>

<!-- Using checkbox -->
<div class="collapse collapse-arrow bg-base-100">
  <input type="checkbox" />
  <div class="collapse-title font-medium">Toggle me</div>
  <div class="collapse-content"><p>Expandable content.</p></div>
</div>

<!-- Using details/summary -->
<details class="collapse collapse-arrow bg-base-100">
  <summary class="collapse-title font-medium">Details</summary>
  <div class="collapse-content"><p>Content here.</p></div>
</details>
```

---

## Dropdown

Opens menu/content on click.

**Classes:** `dropdown` | part: `dropdown-content` | placement: `dropdown-start`, `dropdown-center`, `dropdown-end`, `dropdown-top`, `dropdown-bottom`, `dropdown-left`, `dropdown-right` | modifier: `dropdown-hover`, `dropdown-open`, `dropdown-close`

### Using details/summary (recommended)
```html
<details class="dropdown">
  <summary class="btn m-1">Click me</summary>
  <ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</details>
```

### Using popover API
```html
<button popovertarget="my-pop" style="anchor-name:--my-pop">Open</button>
<ul class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm" popover id="my-pop" style="position-anchor:--my-pop">
  <li><a>Item 1</a></li>
  <li><a>Item 2</a></li>
</ul>
```

### Using CSS focus
```html
<div class="dropdown">
  <div tabindex="0" role="button" class="btn m-1">Click</div>
  <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>
```

Content can be any HTML element, not just `<ul>`. Use unique `id`/`anchor` for popover.

---

## Kbd

Displays keyboard shortcuts.

**Classes:** `kbd` | size: `kbd-xs`..`kbd-xl`

```html
<kbd class="kbd kbd-sm">Ctrl</kbd> + <kbd class="kbd kbd-sm">C</kbd>
```

---

## Link

Adds underline style to links.

**Classes:** `link` | style: `link-hover` | color: `link-neutral`, `link-primary`, `link-secondary`, `link-accent`, `link-success`, `link-info`, `link-warning`, `link-error`

```html
<a class="link link-primary">Visible link</a>
<a class="link link-hover">Underline on hover only</a>
```

---

## Mask

Crops element to common shapes.

**Classes:** `mask` | style: `mask-squircle`, `mask-heart`, `mask-hexagon`, `mask-hexagon-2`, `mask-decagon`, `mask-pentagon`, `mask-diamond`, `mask-square`, `mask-circle`, `mask-star`, `mask-star-2`, `mask-triangle`, `mask-triangle-2`, `mask-triangle-3`, `mask-triangle-4` | modifier: `mask-half-1`, `mask-half-2`

```html
<img class="mask mask-squircle w-24" src="https://picsum.photos/200/200" />
<img class="mask mask-hexagon w-24" src="https://picsum.photos/200/200" />
<img class="mask mask-heart w-24" src="https://picsum.photos/200/200" />
```

Works on any element. Set size with `w-*`/`h-*`.

---

## Menu

Vertical or horizontal link list.

**Classes:** `menu` | part: `menu-title`, `menu-dropdown`, `menu-dropdown-toggle` | modifier: `menu-disabled`, `menu-active`, `menu-focus`, `menu-dropdown-show` | size: `menu-xs`..`menu-xl` | direction: `menu-vertical`, `menu-horizontal`

```html
<!-- Vertical menu with title and submenu -->
<ul class="menu bg-base-200 rounded-box w-56">
  <li class="menu-title">Category</li>
  <li><a>Item 1</a></li>
  <li><a class="menu-active">Active Item</a></li>
  <li>
    <details>
      <summary>Submenu</summary>
      <ul>
        <li><a>Sub item 1</a></li>
        <li><a>Sub item 2</a></li>
      </ul>
    </details>
  </li>
</ul>

<!-- Horizontal menu -->
<ul class="menu menu-horizontal bg-base-200 rounded-box">
  <li><a>Link 1</a></li>
  <li><a>Link 2</a></li>
</ul>
```

Use `lg:menu-horizontal` for responsive. Use `<details>` for collapsible submenus.

---

## Mockup Browser

Browser window frame.

**Classes:** `mockup-browser` | part: `mockup-browser-toolbar`

```html
<div class="mockup-browser bg-base-300 border border-base-300">
  <div class="mockup-browser-toolbar">
    <div class="input">https://daisyui.com</div>
  </div>
  <div class="bg-base-200 p-8">Content here</div>
</div>
```

---

## Mockup Code

Code editor frame.

**Classes:** `mockup-code`

```html
<div class="mockup-code">
  <pre data-prefix="$"><code>npm i daisyui</code></pre>
  <pre data-prefix=">" class="text-warning"><code>installing...</code></pre>
  <pre data-prefix=">" class="text-success"><code>Done!</code></pre>
</div>
```

Use `data-prefix` for line prefixes. Add color classes for highlighting.

---

## Mockup Phone

iPhone-style frame.

**Classes:** `mockup-phone` | part: `mockup-phone-camera`, `mockup-phone-display`

```html
<div class="mockup-phone">
  <div class="mockup-phone-camera"></div>
  <div class="mockup-phone-display">
    <div class="flex items-center justify-center h-full bg-base-200">
      <p>App content</p>
    </div>
  </div>
</div>
```

---

## Mockup Window

OS window frame.

**Classes:** `mockup-window`

```html
<div class="mockup-window bg-base-300 border border-base-300">
  <div class="bg-base-200 p-8">Window content</div>
</div>
```

---

## Pagination

Button group for page navigation (uses join component).

**Classes:** `join`, `join-item`

```html
<div class="join">
  <button class="join-item btn">«</button>
  <button class="join-item btn">1</button>
  <button class="join-item btn btn-active">2</button>
  <button class="join-item btn">3</button>
  <button class="join-item btn">»</button>
</div>
```

---

## Theme Controller

Controls page theme via checkbox/radio input value.

**Classes:** `theme-controller`

```html
<!-- Toggle between two themes -->
<input type="checkbox" value="dark" class="toggle theme-controller" />

<!-- Select from multiple themes -->
<select class="select theme-controller" data-choose-theme>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="cupcake">Cupcake</option>
</select>

<!-- Radio buttons for theme -->
<input type="radio" name="theme" class="btn theme-controller" aria-label="Light" value="light" />
<input type="radio" name="theme" class="btn theme-controller" aria-label="Dark" value="dark" />
```

The `value` must be a valid daisyUI theme name.

---

## Tooltip

Shows a text popup on hover.

**Classes:** `tooltip` | placement: `tooltip-top`, `tooltip-bottom`, `tooltip-left`, `tooltip-right` | color: `tooltip-primary`, `tooltip-secondary`, `tooltip-accent`, `tooltip-neutral`, `tooltip-info`, `tooltip-success`, `tooltip-warning`, `tooltip-error` | modifier: `tooltip-open`

```html
<div class="tooltip" data-tip="Hello">
  <button class="btn">Hover me</button>
</div>

<div class="tooltip tooltip-bottom tooltip-primary" data-tip="Bottom tooltip">
  <button class="btn btn-primary">Bottom</button>
</div>
```

Use `data-tip` attribute for tooltip text. Default placement is top.
