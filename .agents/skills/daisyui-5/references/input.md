# Input Components

## Table of Contents
- [Button](#button)
- [Calendar](#calendar)
- [Checkbox](#checkbox)
- [Fieldset](#fieldset)
- [File Input](#file-input)
- [Filter](#filter)
- [Input](#input)
- [Label](#label)
- [Radio](#radio)
- [Range](#range)
- [Rating](#rating)
- [Select](#select)
- [Textarea](#textarea)
- [Toggle](#toggle)
- [Validator](#validator)

---

## Button

**Classes:** `btn` | color: `btn-neutral`, `btn-primary`, `btn-secondary`, `btn-accent`, `btn-info`, `btn-success`, `btn-warning`, `btn-error` | style: `btn-outline`, `btn-dash`, `btn-soft`, `btn-ghost`, `btn-link` | behavior: `btn-active`, `btn-disabled` | size: `btn-xs`..`btn-xl` | modifier: `btn-wide`, `btn-block`, `btn-square`, `btn-circle`

```html
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline btn-secondary">Outline</button>
<button class="btn btn-soft btn-error btn-sm">Small Error</button>
<button class="btn btn-circle btn-lg">+</button>
<button class="btn btn-block">Full Width</button>
<a class="btn btn-link">Link Style</a>
```

Works on `<button>`, `<a>`, `<input>`. Can include icons before/after text. For disabled via class: set `tabindex="-1" role="button" aria-disabled="true"`.

---

## Calendar

Styles for third-party calendar libraries.

**Classes:** `cally` (Cally web component), `pika-single` (Pikaday input), `react-day-picker` (React Day Picker)

```html
<!-- Cally web component -->
<calendar-date class="cally"><!-- content --></calendar-date>

<!-- Pikaday -->
<input type="text" class="input pika-single" />

<!-- React Day Picker -->
<DayPicker className="react-day-picker" />
```

Supported libraries: Cally, Pikaday, React Day Picker.

---

## Checkbox

**Classes:** `checkbox` | color: `checkbox-primary`, `checkbox-secondary`, `checkbox-accent`, `checkbox-neutral`, `checkbox-success`, `checkbox-warning`, `checkbox-info`, `checkbox-error` | size: `checkbox-xs`..`checkbox-xl`

```html
<label class="flex items-center gap-2">
  <input type="checkbox" class="checkbox checkbox-primary" />
  <span>Remember me</span>
</label>
```

---

## Fieldset

Container for grouping form elements with a legend and description.

**Classes:** `fieldset` | part: `fieldset-legend`, `label`

```html
<fieldset class="fieldset">
  <legend class="fieldset-legend">Account Details</legend>
  <input type="text" class="input" placeholder="Username" />
  <p class="label">Choose a unique username</p>
  <input type="email" class="input" placeholder="Email" />
  <p class="label">We'll never share your email</p>
</fieldset>
```

---

## File Input

**Classes:** `file-input` | style: `file-input-ghost` | color: `file-input-neutral`, `file-input-primary`, `file-input-secondary`, `file-input-accent`, `file-input-info`, `file-input-success`, `file-input-warning`, `file-input-error` | size: `file-input-xs`..`file-input-xl`

```html
<input type="file" class="file-input file-input-primary file-input-md" />
```

---

## Filter

Group of radio buttons where selecting one hides the others and shows a reset button.

**Classes:** `filter` | part: `filter-reset`

```html
<!-- Using HTML form (preferred) -->
<form class="filter">
  <input class="btn btn-square" type="reset" value="×" />
  <input class="btn" type="radio" name="category" aria-label="All" />
  <input class="btn" type="radio" name="category" aria-label="Design" />
  <input class="btn" type="radio" name="category" aria-label="Code" />
</form>

<!-- Without form -->
<div class="filter">
  <input class="btn filter-reset" type="radio" name="status" aria-label="×" />
  <input class="btn" type="radio" name="status" aria-label="Active" />
  <input class="btn" type="radio" name="status" aria-label="Archived" />
</div>
```

Use unique `name` per filter group. Prefer `<form>` tag.

---

## Input

**Classes:** `input` | style: `input-ghost` | color: `input-neutral`, `input-primary`, `input-secondary`, `input-accent`, `input-info`, `input-success`, `input-warning`, `input-error` | size: `input-xs`..`input-xl`

```html
<input type="text" placeholder="Type here" class="input input-primary" />
<input type="email" placeholder="Email" class="input input-md" />

<!-- Input with icon -->
<label class="input">
  <svg><!-- icon --></svg>
  <input type="text" placeholder="Search" />
</label>
```

Use `input` class on parent when it contains multiple elements (icon + input).

---

## Label

Provides name/title for input fields.

**Classes:** `label`, `floating-label`

```html
<!-- Regular label inside input wrapper -->
<label class="input">
  <span class="label">Email</span>
  <input type="email" placeholder="user@example.com" />
</label>

<!-- Floating label -->
<label class="floating-label">
  <input type="text" placeholder="Name" class="input" />
  <span>Name</span>
</label>
```

For floating labels, the `<span>` floats above the input when focused.

---

## Radio

**Classes:** `radio` | color: `radio-neutral`, `radio-primary`, `radio-secondary`, `radio-accent`, `radio-success`, `radio-warning`, `radio-info`, `radio-error` | size: `radio-xs`..`radio-xl`

```html
<label class="flex items-center gap-2">
  <input type="radio" name="plan" class="radio radio-primary" checked />
  <span>Free</span>
</label>
<label class="flex items-center gap-2">
  <input type="radio" name="plan" class="radio radio-primary" />
  <span>Pro</span>
</label>
```

Use unique `name` per radio group to avoid conflicts.

---

## Range

Slider for selecting a value.

**Classes:** `range` | color: `range-neutral`, `range-primary`, `range-secondary`, `range-accent`, `range-success`, `range-warning`, `range-info`, `range-error` | size: `range-xs`..`range-xl`

```html
<input type="range" min="0" max="100" value="40" class="range range-primary range-sm" />
```

`min` and `max` are required.

---

## Rating

Star rating using radio buttons.

**Classes:** `rating` | modifier: `rating-half`, `rating-hidden` | size: `rating-xs`..`rating-xl`

```html
<div class="rating rating-lg">
  <input type="radio" name="rating-1" class="rating-hidden" />
  <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" checked />
  <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
  <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" />
</div>
```

Use unique `name` per rating. First radio with `rating-hidden` allows clearing.

---

## Select

Dropdown selection.

**Classes:** `select` | style: `select-ghost` | color: `select-neutral`, `select-primary`, `select-secondary`, `select-accent`, `select-info`, `select-success`, `select-warning`, `select-error` | size: `select-xs`..`select-xl`

```html
<select class="select select-primary select-md">
  <option disabled selected>Pick one</option>
  <option>Option A</option>
  <option>Option B</option>
</select>
```

---

## Textarea

Multi-line text input.

**Classes:** `textarea` | style: `textarea-ghost` | color: `textarea-neutral`, `textarea-primary`, `textarea-secondary`, `textarea-accent`, `textarea-info`, `textarea-success`, `textarea-warning`, `textarea-error` | size: `textarea-xs`..`textarea-xl`

```html
<textarea class="textarea textarea-primary" placeholder="Write your bio..."></textarea>
```

---

## Toggle

Switch-style checkbox.

**Classes:** `toggle` | color: `toggle-primary`, `toggle-secondary`, `toggle-accent`, `toggle-neutral`, `toggle-success`, `toggle-warning`, `toggle-info`, `toggle-error` | size: `toggle-xs`..`toggle-xl`

```html
<label class="flex items-center gap-2">
  <input type="checkbox" class="toggle toggle-primary" />
  <span>Dark mode</span>
</label>
```

---

## Validator

Changes form element color to error/success based on validation.

**Classes:** `validator` | part: `validator-hint`

```html
<input type="email" class="input validator" required placeholder="Email" />
<p class="validator-hint">Please enter a valid email</p>

<input type="text" class="input validator" required minlength="3" placeholder="Username" />
<p class="validator-hint">Must be at least 3 characters</p>
```

Works with `input`, `select`, `textarea`.
