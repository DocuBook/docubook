# Feedback & Overlay Components

## Table of Contents
- [Alert](#alert)
- [Loading](#loading)
- [Modal](#modal)
- [Progress](#progress)
- [Radial Progress](#radial-progress)
- [Skeleton](#skeleton)
- [Status](#status)
- [Steps](#steps)
- [Swap](#swap)
- [Tab](#tab)
- [Toast](#toast)

---

## Alert

Informs users about important events.

**Classes:** `alert` | style: `alert-outline`, `alert-dash`, `alert-soft` | color: `alert-info`, `alert-success`, `alert-warning`, `alert-error` | direction: `alert-vertical`, `alert-horizontal`

```html
<div role="alert" class="alert alert-info sm:alert-horizontal">
  <svg><!-- info icon --></svg>
  <span>New update available.</span>
</div>

<div role="alert" class="alert alert-soft alert-error">
  <span>Something went wrong!</span>
</div>
```

Add `sm:alert-horizontal` for responsive layouts.

---

## Loading

Animated loading indicators.

**Classes:** `loading` | style: `loading-spinner`, `loading-dots`, `loading-ring`, `loading-ball`, `loading-bars`, `loading-infinity` | size: `loading-xs`..`loading-xl`

```html
<span class="loading loading-spinner loading-lg"></span>
<span class="loading loading-dots loading-md text-primary"></span>
<span class="loading loading-bars loading-sm text-secondary"></span>
```

---

## Modal

Dialog box triggered by button click.

**Classes:** `modal` | part: `modal-box`, `modal-action`, `modal-backdrop`, `modal-toggle` | modifier: `modal-open` | placement: `modal-top`, `modal-middle`, `modal-bottom`, `modal-start`, `modal-end`

### Using HTML dialog (recommended)
```html
<button class="btn" onclick="my_modal.showModal()">Open Modal</button>
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Hello!</h3>
    <p class="py-4">Modal content here.</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

### Using checkbox
```html
<label for="my-modal" class="btn">Open</label>
<input type="checkbox" id="my-modal" class="modal-toggle" />
<div class="modal">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Title</h3>
    <p class="py-4">Content</p>
  </div>
  <label class="modal-backdrop" for="my-modal">Close</label>
</div>
```

Use unique IDs for each modal. Use `<form method="dialog">` for close buttons with dialog element.

---

## Progress

Linear progress bar.

**Classes:** `progress` | color: `progress-neutral`, `progress-primary`, `progress-secondary`, `progress-accent`, `progress-info`, `progress-success`, `progress-warning`, `progress-error`

```html
<progress class="progress progress-primary w-56" value="70" max="100"></progress>
```

`value` and `max` are required.

---

## Radial Progress

Circular progress indicator.

**Classes:** `radial-progress`

```html
<div class="radial-progress text-primary" style="--value:70;" aria-valuenow="70" role="progressbar">70%</div>
```

`--value` must be 0-100. Use `--size` (default 5rem) and `--thickness` for customization. Add `aria-valuenow` for accessibility.

---

## Skeleton

Loading placeholder.

**Classes:** `skeleton` | modifier: `skeleton-text`

```html
<div class="flex flex-col gap-4 w-52">
  <div class="skeleton h-32 w-full"></div>
  <div class="skeleton skeleton-text h-4 w-28"></div>
  <div class="skeleton skeleton-text h-4 w-full"></div>
  <div class="skeleton skeleton-text h-4 w-full"></div>
</div>
```

Set dimensions with `h-*` and `w-*`.

---

## Status

Small status indicator dot.

**Classes:** `status` | color: `status-neutral`, `status-primary`, `status-secondary`, `status-accent`, `status-info`, `status-success`, `status-warning`, `status-error` | size: `status-xs`..`status-xl`

```html
<span class="status status-success"></span>
<span class="status status-error status-lg"></span>
```

---

## Steps

Shows progress through a multi-step process.

**Classes:** `steps` | part: `step`, `step-icon` | color: `step-neutral`, `step-primary`, `step-secondary`, `step-accent`, `step-info`, `step-success`, `step-warning`, `step-error` | direction: `steps-vertical`, `steps-horizontal`

```html
<ul class="steps">
  <li class="step step-primary">Register</li>
  <li class="step step-primary">Choose plan</li>
  <li class="step">Purchase</li>
  <li class="step">Receive</li>
</ul>
```

Color class marks step as completed/active. Use `data-content="value"` on `<li>` for custom step indicators.

---

## Swap

Toggles visibility between two elements.

**Classes:** `swap` | part: `swap-on`, `swap-off`, `swap-indeterminate` | modifier: `swap-active` | style: `swap-rotate`, `swap-flip`

```html
<!-- Checkbox-controlled -->
<label class="swap swap-rotate text-4xl">
  <input type="checkbox" />
  <div class="swap-on">🌙</div>
  <div class="swap-off">☀️</div>
</label>

<!-- JS-controlled -->
<div class="swap swap-flip">
  <div class="swap-on">ON</div>
  <div class="swap-off">OFF</div>
</div>
```

Toggle state via hidden checkbox or by adding/removing `swap-active` class with JS.

---

## Tab

Tabbed navigation/content.

**Classes:** `tabs` | part: `tab`, `tab-content` | style: `tabs-box`, `tabs-border`, `tabs-lift` | modifier: `tab-active`, `tab-disabled` | placement: `tabs-top`, `tabs-bottom`

### Button tabs (navigation only)
```html
<div role="tablist" class="tabs tabs-border">
  <button role="tab" class="tab">Tab 1</button>
  <button role="tab" class="tab tab-active">Tab 2</button>
  <button role="tab" class="tab">Tab 3</button>
</div>
```

### Radio tabs with content
```html
<div role="tablist" class="tabs tabs-lift">
  <input type="radio" name="my_tabs" role="tab" class="tab" aria-label="Tab 1" />
  <div role="tabpanel" class="tab-content p-6">Tab 1 content</div>
  <input type="radio" name="my_tabs" role="tab" class="tab" aria-label="Tab 2" checked />
  <div role="tabpanel" class="tab-content p-6">Tab 2 content</div>
</div>
```

Radio inputs required for tab content switching.

---

## Toast

Fixed-position notification wrapper.

**Classes:** `toast` | placement: `toast-start`, `toast-center`, `toast-end`, `toast-top`, `toast-middle`, `toast-bottom`

```html
<div class="toast toast-end">
  <div class="alert alert-info"><span>New message arrived.</span></div>
</div>

<div class="toast toast-top toast-center">
  <div class="alert alert-success"><span>Saved!</span></div>
</div>
```
