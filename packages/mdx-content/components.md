## accordion

for example :
<Accordion title="Click to expand">
    This is a simple accordion component that can be toggled by clicking the header. The content can include any valid React nodes, including text, components, and markdown.
</Accordion>

with icon (lucide icon name string only) :
<Accordion title="Code Block" icon="Code">
    ```javascript:main.js showLineNumbers {3-4}
    function isRocketAboutToCrash() {
        // Check if the rocket is stable
        if (!isStable()) {
            NoCrash(); // Prevent the crash
        }
    }
    ```
</Accordion>

## accordion group

for example :
<Accordions>
  <Accordion title="Basic Usage">
      This accordion includes a [Lucide Icon](https://lucide.dev/icons/) because the `icon` prop is provided.
  </Accordion>

  <Accordion title="With icon props" icon="MousePointerClick">
      This accordion includes a Lucide icon because the `icon` prop is provided.
  </Accordion>

  <Accordion title="With Code Block">
      You can put other components inside Accordions.
  ```jsx:helloword.jsx
  class HelloWorld {
  public static void main(String[] args) {
          System.out.println("Hello, World!");
          }
  }
  ```
  </Accordion>
</Accordions>

deprecated alias: `AccordionGroup` (removed on v3)

## button

for example :
<Button
  text="Learn More"
  href="https://learn.example.com"
  icon="MoveUpRight"
  size="md"
  target="_blank"
  variant="primary"
/>

## card

for example :
<Card title="Card with Link and icon" icon="Link" href="/docs/components/card-group">
  This is how you use a card with an icon and a link. Clicking on this card
  brings you to the Card Group page.
</Card>

## card group

for example :
<Cards cols={2}>
  <Card title="Heading 1" icon="Heading1">
    This is an example of card content with columns.
  </Card>
  <Card title="Heading 2" icon="Heading2">
    This is an example of card content with columns.
  </Card>
  <Card title="Grid Card" icon="Grid" horizontal>
      This is a horizontal card layout.
  </Card>
  <Card title="Horizontal Card" icon="Layout" horizontal>
      This is a horizontal card layout.
  </Card>
</Cards>

deprecated alias: `CardGroup` (removed on v3)


## code block

for example :
```javascript:main.js showLineNumbers {3-4}
function isRocketAboutToCrash() {
    // Check if the rocket is stable
    if (!isStable()) {
        NoCrash(); // Prevent the crash
    }
}
```

## file tree

for example :
<Files>
  <Folder name="src">
    <File name="App.tsx" />
    <File name="index.tsx" />
    <Folder name="components">
      <File name="Button.tsx" />
      <File name="Card.tsx" />
    </Folder>
    <Folder name="pages">
      <File name="Home.tsx" />
      <File name="About.tsx" />
    </Folder>
  </Folder>
</Files>

## image

for example :
![Alt text for the image](https://via.placeholder.com/150)

## keyboard

for example :
{/* Windows style (default) */}
<Kbd show="ctrl" /> + <Kbd show="v" />

{/* Mac style */}
<Kbd show="cmd" type="mac" /> + <Kbd show="v" type="mac" />

## link

for example :
[Visit OpenAI](https://www.openai.com)

## note

for example :
<Note type="note" title="Note">
  This is a general note to convey information to the user.
</Note>
<Note type="danger" title="Danger">
  This is a danger alert to notify the user of a critical issue.
</Note>
<Note type="warning" title="Warning">
  This is a warning alert for issues that require attention.
</Note>
<Note type="success" title="Success">
  This is a success message to inform the user of successful actions.
</Note>

## release

for example :
<Release version="1.10.1" date="2025-05-24" title="Accessibility Improvements and Bug Fixes">
  <Changes type="added">
    - New feature to improve accessibility
    - Keyboard navigation support for dialog components
  </Changes>
  <Changes type="fixed">
    - Bug fix for mobile menu
    - Fixed loading issues on documentation pages
  </Changes>
</Release>

## stepper

for example :
<Steps>
  <Step title="Step 1: Clone the DocuBook Repository">
    ```bash
    git clone https://github.com/DocuBook/docubook.git
    ```
  </Step>
  <Step title="Step 2: Access the Project Directory">
    ```bash
    cd docubook
    ```
  </Step>
  <Step title="Step 3: Install Required Dependencies">
    ```bash
    pnpm install
    ```
  </Step>
</Steps>

deprecated aliases: `Stepper`, `StepperItem` (removed on v3)

## tabs

default active tab will use the first `Tab` item.

for example :
<Tabs className="pt-5 pb-1">
  <Tab title="Java">
    ```java:HelloWorld.java
    // HelloWorld.java
    public class HelloWorld {
        public static void main(String[] args) {
            System.out.println("Hello, World!");
        }
    }
    ```
  </Tab>
  <Tab title="TypeScript">
    ```typescript:helloWorld.ts
    // helloWorld.ts
    function helloWorld(): void {
        console.log("Hello, World!");
    }
    helloWorld();
    ```
  </Tab>
</Tabs>

deprecated legacy API: `TabsList`, `TabsTrigger`, `TabsContent` (removed on v3)

## tooltips

for example :
What do you know about <Tooltip text="DocuBook" tip="npx @docubook/create@latest" /> ? Create interactive nested documentations using MDX.

## tables

for example :
|   Property    |         Description          |   Type   | Default |
| ------------- | ---------------------------- | -------- | ------- |
| `title`       | The title of the table       | `string` | -       |
| `description` | The description of the table | `string` | -       |

| Left | Center | Right |
| :--- | :---: | ---: |
| Left-aligned text | Center-aligned text | Right-aligned text |
| Left-aligned text | Center-aligned text | Right-aligned text |

## youtube

for example :
<Youtube videoId="OPM2t54T-Vo" />

