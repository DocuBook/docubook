## [1.8.5] - 2025-05-10

> Add sponsor card on single docs page

### Added

- Expandables Leftbar
- sponsor badges or ads
- boolean show/hide `edit on github`
- with the same code run anywhere (bun or nodejs)
- add fronmatter (metadata) to playground editor

### Improved

- adjusment docu.json
- adjustment navbar, footer and components

### Fixed

- bun compability rename .js to common js
- cli manage packageManager on package.json
- inconsistent design moved to better UI/UX
- error handle render footer.social

### Removed

- remove confused and verbose cli on installer

## [1.8.0] - 2025-03-01

> Now looks more modern and clean which is a big change in layout and design

### Added

- Social footer
- Toggle group
- Site description {meta.description} in footer
- Site title {meta.title} in footer

### Improved

- Header design changes
- Footer design changes
- New functions in theme provider
- Object changes in docu.json

### Fixed

- Updates to path structure components
- Groups to organize components

## [1.7.0] - 2025-02-23

> Remove the old function in the search dialog and replace it with a new and more optimal feature

### Added

- Up and down navigation : search dialog.tsx
- Enter (return) to select : search dialog.tsx
- Escape to close the dialog : search dialog.tsx

### Improved

- Maintenance for anchor components
- Anchor.tsx adjustments for all elements that use it

### Removed

- Remove suboptimal search features

## [1.6.0] - 2025-02-21

> New Feature Card Groups with arrays for more Flexible Content

### Added

- Card Groups Components
- Props : href to url link
- Props : horizontal boolean

### Improved

- Card props styling
- Compability for Cards components
- {children} support for card content

### Removed

- remove unused props cards components

## [1.5.0] - 2025-02-18

> Minor Update - improved features and responsiveness on all devices

### Added

- New dialog footer on searchbox above @media 768px
- Icon X for close dialog on searcbox as esc on medium screen

### Improved

- Responsive Leftbar components on large screen
- Menu Trigger on medium screen
- Responsive Navbar components on medium screen
- Better UX for searchbox dialog
- tooltips components can be written together with regular paragraphs

### Fixed

- Responsive issue
- Compatibility for Bun
- Changes postcss.config.js to .cjs for Bun
- all CLI installer and updater not working
- adjustments for package managers npm, pnpm, bun, yarn

## [1.4.2] - 2025-02-16

> Complex Content for Accordion Component props {children}

### Added

- New Props with {children} in accordion
- Compatibility for markdown in accordion
- Nested components inside an accordion
- New icon on note components
- add CLI npx @docubook/create@latest
- add CLI npx @docubook/update@latest

### Improved

- Better UI design for accordion
- Styling Note components on markdown
- Change accordion output on playground
- Change accordion output on snippet

### Removed

- Remove depcreated props on accordion
- Remove CLI npx update_docu
- Remove CLI npx create_docu

## [1.4.0] - 2025-02-11

> Floating Button Version with Dynamic Tag {version} on Changelog page

### Added

- New components / changelog floating-version.tsx
- Button popover to open version-toc below @media 1024px
- Dynamic tag by section ID #version
- Dynamic url tag #version
- Dynamic version indicator on floating version when scrolling section by ID

### Improved

- change icon version history
- responsive version-toc
- improvement components to changelog page

## [1.3.8] - 2025-02-08

> Responsive Table of Content

### Added

- Components terminal MagicUI
- Components card Shadcn
- New mob-toc for a better experience on mobile devices
- New Components scroll to top button
- Scroll to top :blog-post
- Scroll to top :docs-post

### Improved

- lib/markdown for generated dynamic toc on markdown
- Responsive Table of Content below @media 1024px
- Improve docs page

## [1.3.6] - 2025-02-01

> Appears more modern editor for Docu Play

![version 1.3.6 - Playground](https://docubook.pro/images/new-editor.png)

### Added

- Line Number for editor
- editor.css

### Improved

- Better Design for Editor
- Similar to Github Editor
- Moved Handler Element (copy, download, reset and fullscreen) on Header

## [1.3.5] - 2025-01-30

> it's Easy to Write Markdown with Playground

![version 1.3.5 - Playground](https://docubook.pro/images/img-playground.png)

### Added

- New Playground Page
- New Playground Layout
- Toolbar for Markdown Components
- Fullscreen Mode to Focus Editing Your Content
- Copy to Clipboard Your Content
- Download Your Content as index.mdx
- Reset Your Content without refresh the Browser
- Only Large Screen for Better Experience

## [1.3.1] - 2025-01-20

> Snippet Feature to Easily Write Markdown and Call DocuBook Components

![version 1.3.1 - Snippet Features](https://docubook.pro/images/snippet.png)

### Added

- New Feature Snippet for Markdown Components
- Support Snippet for Visual Studio Code

### Removed

- remove props icon and props description for accordion components

## [1.3.0] - 2024-12-31

> Release Note Feature to Make it Easier to Write Changelogs

### Added

- New Release Note Feature
- New Layout for Changelog page
- New Changelog page
- Add Release Note Component
- Easily write release notes directly from the CHANGELOG.md file
- TOC for versioning
- Write with the markdown tag
- Add lib / changelog.ts

### Improved

- Improvement Responsive feature image for Version Entry
- Improvement Layout for changelog page
- Improvement Padding on mobile devices
- Only use containers of md size
- Improvement syntax.css for ul>li classes

### Fixed

- Fix og:image not showing on Page.tsx
- Fix text-indent on class li

### Removed

- Remove excessive padding
- Remove Logo on Footer

## [1.2.0] - 2024-12-22

> New Accordion Component : Support content plain text, html and all markdown component

### Added

- add New Accordion

### Improved

- Props Improvement
- Support Dynamic Content for Accordion

## [1.1.0] - 2024-12-15

> Minor Update : Easily manage set up with docu.json

### Added

- add docu.json file
- add openGraph (title, description, image)
- add Dynamic metadata
- Generate metadata as openGraph
- openGraph support for .mdx

### Improved

- routes-config from json
- Frontmatter improvement
- Edit the content of footer.tsx simply via the docu.json file
- Edit the content of navbar.tsx simply via the docu.json file

## [1.0.7] - 2024-12-14

> Easily updates your DocuBook Version with CLI npx update_docu

### Added

- CLI npx update_docu (update features into docubook existing directory)
- Playground (easily to written content)
- New Button component
- Navbar external link conditions
- CLI npx create_docu

### Improved

- Searchbar Improvement
- Navigation Improvement
- Edit on Github Improvement

### Removed
- Remove CLI npx create-docu (on this version not usage dash `-`)

## [1.0.6] - 2024-11-24

> New Components, Fix and Improvement

### Added

- New Card component
- New Tooltips component

### Fixed

- change root folder

### Improved

- logo on navbar & footer
- easily change logo

## [1.0.5] - 2024-11-16

> Add New Features and Improvement for this version

### Added

- New Youtube component
- edit this page - easily manage directory content via the github repo
- support installation via cli commant npx create-docu

### Improved

- keyboard shortcut command + k or ctrl + k to open search dialog

## [1.0.0] - 2024-11-10

> Initial release of DocuBook to create interactive nested docs with MDX

### Added

- Initial release of DocuBook
- Basic documentation structure
- Markdown support with MDX
- Responsive design
- Search functionality
- Dark mode support
