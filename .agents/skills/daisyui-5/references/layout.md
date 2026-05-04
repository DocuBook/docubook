# Layout Components

## Table of Contents
- [Divider](#divider)
- [Dock](#dock)
- [Drawer](#drawer)
- [FAB](#fab)
- [Footer](#footer)
- [Hero](#hero)
- [Indicator](#indicator)
- [Join](#join)
- [Navbar](#navbar)
- [Stack](#stack)

---

## Divider

Separates content vertically or horizontally.

**Classes:** `divider` | color: `divider-neutral`, `divider-primary`, `divider-secondary`, `divider-accent`, `divider-success`, `divider-warning`, `divider-info`, `divider-error` | direction: `divider-vertical`, `divider-horizontal` | placement: `divider-start`, `divider-end`

```html
<div class="divider">OR</div>
<div class="divider divider-primary divider-horizontal">OR</div>
<div class="divider divider-start">Start</div>
```

Omit text for a blank divider.

---

## Dock

Bottom navigation bar that sticks to bottom of screen.

**Classes:** `dock` | part: `dock-label` | modifier: `dock-active` | size: `dock-xs`..`dock-xl`

```html
<div class="dock">
  <button>
    <svg><!-- icon --></svg>
    <span class="dock-label">Home</span>
  </button>
  <button class="dock-active">
    <svg><!-- icon --></svg>
    <span class="dock-label">Search</span>
  </button>
  <button>
    <svg><!-- icon --></svg>
    <span class="dock-label">Profile</span>
  </button>
</div>
```

Add `<meta name="viewport" content="viewport-fit=cover">` for iOS.

---

## Drawer

Grid layout that shows/hides a sidebar.

**Classes:** `drawer` | part: `drawer-toggle`, `drawer-content`, `drawer-side`, `drawer-overlay` | placement: `drawer-end` | modifier: `drawer-open` | variant: `is-drawer-open:`, `is-drawer-close:`

### Basic responsive drawer
```html
<div class="drawer lg:drawer-open">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content here -->
    <label for="my-drawer" class="btn drawer-button lg:hidden">Open drawer</label>
  </div>
  <div class="drawer-side">
    <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <ul class="menu bg-base-200 min-h-full w-80 p-4">
      <li><button>Sidebar Item 1</button></li>
      <li><button>Sidebar Item 2</button></li>
    </ul>
  </div>
</div>
```

### Collapsible icon sidebar
```html
<div class="drawer lg:drawer-open">
  <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content -->
  </div>
  <div class="drawer-side is-drawer-close:overflow-visible">
    <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
    <div class="is-drawer-close:w-14 is-drawer-open:w-64 bg-base-200 flex flex-col items-start min-h-full">
      <ul class="menu w-full grow">
        <li>
          <button class="is-drawer-close:tooltip is-drawer-close:tooltip-right" data-tip="Home">
            🏠 <span class="is-drawer-close:hidden">Homepage</span>
          </button>
        </li>
      </ul>
      <div class="m-2">
        <label for="my-drawer-4" class="btn btn-ghost btn-circle drawer-button is-drawer-open:rotate-y-180">↔️</label>
      </div>
    </div>
  </div>
</div>
```

**Rules:**
- Use unique `id` for each `drawer-toggle`
- `lg:drawer-open` makes sidebar visible on large screens
- All page content (navbar, footer) must be inside `drawer-content`

---

## FAB

Floating Action Button in bottom corner. Shows speed dial buttons on focus/hover.

**Classes:** `fab` | part: `fab-close`, `fab-main-action` | modifier: `fab-flower`

### Basic FAB
```html
<div class="fab">
  <button class="btn btn-lg btn-circle btn-primary">+</button>
</div>
```

### Speed dial with labels
```html
<div class="fab">
  <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">+</div>
  <div>Edit <button class="btn btn-lg btn-circle">✏️</button></div>
  <div>Share <button class="btn btn-lg btn-circle">📤</button></div>
  <div>Delete <button class="btn btn-lg btn-circle">🗑️</button></div>
</div>
```

### Flower layout with tooltips
```html
<div class="fab fab-flower">
  <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary">+</div>
  <button class="fab-main-action btn btn-circle btn-lg">⭐</button>
  <div class="tooltip tooltip-left" data-tip="Edit">
    <button class="btn btn-lg btn-circle">✏️</button>
  </div>
  <div class="tooltip tooltip-left" data-tip="Share">
    <button class="btn btn-lg btn-circle">📤</button>
  </div>
</div>
```

---

## Footer

Contains logo, copyright, and navigation links.

**Classes:** `footer` | part: `footer-title` | placement: `footer-center` | direction: `footer-horizontal`, `footer-vertical`

```html
<footer class="footer sm:footer-horizontal bg-base-200 p-10">
  <nav>
    <h6 class="footer-title">Services</h6>
    <a class="link link-hover">Branding</a>
    <a class="link link-hover">Design</a>
  </nav>
  <nav>
    <h6 class="footer-title">Company</h6>
    <a class="link link-hover">About us</a>
    <a class="link link-hover">Contact</a>
  </nav>
</footer>
```

Use `sm:footer-horizontal` for responsive layout. Use `base-200` background.

---

## Hero

Large box/image with title and description.

**Classes:** `hero` | part: `hero-content`, `hero-overlay`

```html
<div class="hero min-h-screen" style="background-image: url(https://picsum.photos/1600/900);">
  <div class="hero-overlay"></div>
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Hello</h1>
      <p class="py-6">Description text here.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
```

---

## Indicator

Places an element on the corner of another element.

**Classes:** `indicator` | part: `indicator-item` | placement: `indicator-start`, `indicator-center`, `indicator-end`, `indicator-top`, `indicator-middle`, `indicator-bottom`

```html
<div class="indicator">
  <span class="indicator-item badge badge-primary">99+</span>
  <button class="btn">Inbox</button>
</div>
```

Default placement is `indicator-end indicator-top`. Place all `indicator-item` elements before the main content.

---

## Join

Groups multiple items with shared border radius.

**Classes:** `join`, `join-item` | direction: `join-vertical`, `join-horizontal`

```html
<div class="join">
  <button class="btn join-item">Left</button>
  <button class="btn join-item">Center</button>
  <button class="btn join-item">Right</button>
</div>
```

Use `lg:join-horizontal` for responsive layouts.

---

## Navbar

Top navigation bar.

**Classes:** `navbar` | part: `navbar-start`, `navbar-center`, `navbar-end`

```html
<div class="navbar bg-base-200">
  <div class="navbar-start">
    <a class="btn btn-ghost text-xl">Logo</a>
  </div>
  <div class="navbar-center">
    <ul class="menu menu-horizontal px-1">
      <li><a>Link 1</a></li>
      <li><a>Link 2</a></li>
    </ul>
  </div>
  <div class="navbar-end">
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

Use `base-200` background.

---

## Stack

Visually stacks elements on top of each other.

**Classes:** `stack` | modifier: `stack-top`, `stack-bottom`, `stack-start`, `stack-end`

```html
<div class="stack w-64">
  <div class="card bg-primary text-primary-content"><div class="card-body">Card 1</div></div>
  <div class="card bg-secondary text-secondary-content"><div class="card-body">Card 2</div></div>
  <div class="card bg-accent text-accent-content"><div class="card-body">Card 3</div></div>
</div>
```
