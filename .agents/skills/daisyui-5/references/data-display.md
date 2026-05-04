# Data Display Components

## Table of Contents
- [Avatar](#avatar)
- [Badge](#badge)
- [Card](#card)
- [Carousel](#carousel)
- [Chat](#chat)
- [Countdown](#countdown)
- [Diff](#diff)
- [Hover 3D](#hover-3d)
- [Hover Gallery](#hover-gallery)
- [List](#list)
- [Stat](#stat)
- [Table](#table)
- [Text Rotate](#text-rotate)
- [Timeline](#timeline)

---

## Avatar

Shows a thumbnail representation of a user.

**Classes:** `avatar`, `avatar-group` | modifier: `avatar-online`, `avatar-offline`, `avatar-placeholder`

```html
<div class="avatar avatar-online">
  <div class="w-12 rounded-full">
    <img src="https://picsum.photos/200/200" />
  </div>
</div>

<!-- Avatar group -->
<div class="avatar-group -space-x-6">
  <div class="avatar"><div class="w-12"><img src="https://picsum.photos/200/200" /></div></div>
  <div class="avatar"><div class="w-12"><img src="https://picsum.photos/200/200" /></div></div>
  <div class="avatar avatar-placeholder"><div class="bg-neutral text-neutral-content w-12"><span>+5</span></div></div>
</div>
```

Use mask classes: `mask-squircle`, `mask-hexagon`, `mask-triangle`. Set size with `w-*`/`h-*`.

---

## Badge

Informs users of status or counts.

**Classes:** `badge` | style: `badge-outline`, `badge-dash`, `badge-soft`, `badge-ghost` | color: `badge-neutral`, `badge-primary`, `badge-secondary`, `badge-accent`, `badge-info`, `badge-success`, `badge-warning`, `badge-error` | size: `badge-xs`..`badge-xl`

```html
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-outline badge-success badge-lg">Success</span>
<span class="badge badge-soft badge-error badge-sm">Error</span>
```

Can be used inside text or buttons. Remove text for an empty badge dot.

---

## Card

Groups and displays content in a container.

**Classes:** `card` | part: `card-title`, `card-body`, `card-actions` | style: `card-border`, `card-dash` | modifier: `card-side`, `image-full` | size: `card-xs`..`card-xl`

```html
<div class="card bg-base-100 shadow-sm w-96">
  <figure><img src="https://picsum.photos/400/200" alt="Cover" /></figure>
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card description goes here.</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Buy Now</button>
    </div>
  </div>
</div>

<!-- Horizontal responsive card -->
<div class="card sm:card-horizontal bg-base-100 shadow-sm">
  <figure><img src="https://picsum.photos/200/200" alt="Cover" /></figure>
  <div class="card-body">
    <h2 class="card-title">Side Card</h2>
    <p>Content here.</p>
  </div>
</div>
```

Use `sm:card-horizontal` for responsive side layout. Image after `card-body` places it at the bottom.

---

## Carousel

Scrollable area for images or content.

**Classes:** `carousel` | part: `carousel-item` | modifier: `carousel-start`, `carousel-center`, `carousel-end` | direction: `carousel-horizontal`, `carousel-vertical`

```html
<div class="carousel carousel-center rounded-box">
  <div class="carousel-item"><img src="https://picsum.photos/400/300" /></div>
  <div class="carousel-item"><img src="https://picsum.photos/400/300" /></div>
  <div class="carousel-item"><img src="https://picsum.photos/400/300" /></div>
</div>
```

Add `w-full` to each item for full-width slides.

---

## Chat

Chat bubbles for conversations.

**Classes:** `chat` | part: `chat-image`, `chat-header`, `chat-footer`, `chat-bubble` | placement: `chat-start`, `chat-end` | color: `chat-bubble-neutral`, `chat-bubble-primary`, `chat-bubble-secondary`, `chat-bubble-accent`, `chat-bubble-info`, `chat-bubble-success`, `chat-bubble-warning`, `chat-bubble-error`

```html
<div class="chat chat-start">
  <div class="chat-image avatar">
    <div class="w-10 rounded-full"><img src="https://picsum.photos/100/100" /></div>
  </div>
  <div class="chat-header">Alice <time class="text-xs opacity-50">12:45</time></div>
  <div class="chat-bubble">Hello!</div>
  <div class="chat-footer opacity-50">Delivered</div>
</div>
<div class="chat chat-end">
  <div class="chat-bubble chat-bubble-primary">Hi there!</div>
</div>
```

Placement (`chat-start` or `chat-end`) is required.

---

## Countdown

Animated number transitions (0-999).

**Classes:** `countdown`

```html
<span class="countdown font-mono text-6xl">
  <span style="--value:12;"></span>h
  <span style="--value:34;"></span>m
  <span style="--value:56;"></span>s
</span>
```

Update `--value` and text via JS. Add `aria-live="polite"` for accessibility.

---

## Diff

Side-by-side comparison with draggable divider.

**Classes:** `diff` | part: `diff-item-1`, `diff-item-2`, `diff-resizer`

```html
<figure class="diff aspect-16/9">
  <div class="diff-item-1"><img src="https://picsum.photos/600/400" /></div>
  <div class="diff-item-2"><img src="https://picsum.photos/600/400" /></div>
  <div class="diff-resizer"></div>
</figure>
```

---

## Hover 3D

Wrapper that adds interactive 3D tilt on hover.

**Classes:** `hover-3d`

```html
<div class="hover-3d my-12 mx-2">
  <figure class="max-w-100 rounded-2xl">
    <img src="https://picsum.photos/400/250" alt="3D card" />
  </figure>
  <div></div><div></div><div></div><div></div>
  <div></div><div></div><div></div><div></div>
</div>
```

**Rules:**
- Must have exactly 9 children: content + 8 empty divs for hover zones
- Content must be non-interactive (no buttons, links, inputs)
- Can be `<div>` or `<a>` for linking

---

## Hover Gallery

Shows multiple images on horizontal hover. Good for product cards.

**Classes:** `hover-gallery`

```html
<figure class="hover-gallery max-w-60">
  <img src="https://picsum.photos/300/300?1" />
  <img src="https://picsum.photos/300/300?2" />
  <img src="https://picsum.photos/300/300?3" />
</figure>
```

Up to 10 images. Needs `max-w-*`. Images must be same dimensions.

---

## List

Vertical layout for data rows.

**Classes:** `list`, `list-row` | modifier: `list-col-wrap`, `list-col-grow`

```html
<ul class="list bg-base-100 rounded-box shadow-md">
  <li class="list-row">
    <div><img class="size-10 rounded-box" src="https://picsum.photos/100/100" /></div>
    <div>
      <div>Title</div>
      <div class="text-xs uppercase font-semibold opacity-60">Subtitle</div>
    </div>
    <button class="btn btn-square btn-ghost">...</button>
  </li>
</ul>
```

Second child fills remaining space by default. Use `list-col-grow` to change which child grows.

---

## Stat

Displays numbers and data in blocks.

**Classes:** `stats` | part: `stat`, `stat-title`, `stat-value`, `stat-desc`, `stat-figure`, `stat-actions` | direction: `stats-horizontal`, `stats-vertical`

```html
<div class="stats shadow">
  <div class="stat">
    <div class="stat-figure text-primary"><svg><!-- icon --></svg></div>
    <div class="stat-title">Total Revenue</div>
    <div class="stat-value text-primary">$25.6K</div>
    <div class="stat-desc">21% more than last month</div>
  </div>
  <div class="stat">
    <div class="stat-title">Users</div>
    <div class="stat-value">4,200</div>
    <div class="stat-desc text-secondary">↗ 40 (2%)</div>
  </div>
</div>
```

Horizontal by default. Use `stats-vertical` for vertical layout.

---

## Table

Data in tabular format.

**Classes:** `table` | modifier: `table-zebra`, `table-pin-rows`, `table-pin-cols` | size: `table-xs`..`table-xl`

```html
<div class="overflow-x-auto">
  <table class="table table-zebra">
    <thead>
      <tr><th>#</th><th>Name</th><th>Email</th></tr>
    </thead>
    <tbody>
      <tr><th>1</th><td>Alice</td><td>alice@example.com</td></tr>
      <tr><th>2</th><td>Bob</td><td>bob@example.com</td></tr>
    </tbody>
  </table>
</div>
```

Always wrap in `overflow-x-auto` for horizontal scroll on small screens.

---

## Text Rotate

Animated text rotation showing 2-6 lines in a loop (10s default).

**Classes:** `text-rotate`

```html
<!-- Standalone rotating words -->
<span class="text-rotate text-4xl font-bold">
  <span class="justify-items-center">
    <span>DESIGN</span>
    <span>DEVELOP</span>
    <span>DEPLOY</span>
  </span>
</span>

<!-- Inline rotating words with colors -->
<span>
  We build for
  <span class="text-rotate">
    <span>
      <span class="bg-teal-400 text-teal-800 px-2">Designers</span>
      <span class="bg-red-400 text-red-800 px-2">Developers</span>
      <span class="bg-blue-400 text-blue-800 px-2">Managers</span>
    </span>
  </span>
</span>
```

Custom duration: `duration-12000` (ms). Custom line height: `leading-[2]`. Pauses on hover.

---

## Timeline

Chronological list of events.

**Classes:** `timeline` | part: `timeline-start`, `timeline-middle`, `timeline-end` | modifier: `timeline-snap-icon`, `timeline-box`, `timeline-compact` | direction: `timeline-vertical`, `timeline-horizontal`

```html
<ul class="timeline timeline-vertical">
  <li>
    <div class="timeline-start">2023</div>
    <div class="timeline-middle"><svg><!-- icon --></svg></div>
    <div class="timeline-end timeline-box">First event</div>
    <hr class="bg-primary" />
  </li>
  <li>
    <hr class="bg-primary" />
    <div class="timeline-start">2024</div>
    <div class="timeline-middle"><svg><!-- icon --></svg></div>
    <div class="timeline-end timeline-box">Second event</div>
  </li>
</ul>
```

Use `timeline-compact` to force all items on one side. Use `data-content` on `<li>` for step indicators.
