type InsertAtCursor = (textArea: HTMLTextAreaElement, text: string) => void;

// toolbar handler
export const handleMetadataClick = (insertAtCursor: InsertAtCursor) => {
    const textArea = document.querySelector("textarea");
    if (textArea) {
        const metadata = `---
title: Post Title
description: Your Post Description
date: ${new Date().toISOString().split("T")[0]}
image: example-img.png
---\n\n`;

        insertAtCursor(textArea, metadata);
    }
};

export const handleParagraphClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "this is regular text, **bold text**, *italic text*\n");
  }
};

export const handleHeading2Click = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "## Heading 2\n");
  }
};

export const handleHeading3Click = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "### Heading 3\n");
  }
};

export const handleBulletListClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "- List One\n- List Two\n- Other List\n");
  }
};

export const handleNumberedListClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "1. Number One\n2. Number Two\n3. Number Three\n");
  }
};

export const handleLinkClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "[Visit OpenAI](https://www.openai.com)\n");
  }
};

export const handleImageClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "![Alt text for the image](https://via.placeholder.com/150)\n");
  }
};

export const handleBlockquoteClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(textArea, "> The overriding design goal for Markdown's formatting syntax is to make it as readable as possible.\n");
  }
};

export const handleCodeBlockClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(
      textArea,
      "```javascript:main.js showLineNumbers {3-4}\nfunction isRocketAboutToCrash() {\n    // Check if the rocket is stable\n    if (!isStable()) {\n        NoCrash(); // Prevent the crash\n    }\n}\n```\n"
    );
  }
};

export const handleTableClick = (insertAtCursor: InsertAtCursor) => {
  const textArea = document.querySelector("textarea");
  if (textArea) {
    insertAtCursor(
      textArea,
      `| **Feature**                     | **Description**                                       |
| ------------------------------- | ----------------------------------------------------- |
| MDX Support                     | Write interactive documentation with MDX.             |
| Nested Pages                    | Organize content in a nested, hierarchical structure. |
| Blog Section                    | Include a dedicated blog section.                     |
| Pagination                      | Split content across multiple pages.                  |

`
    );
  }
};

export const handleNoteClick = (insertAtCursor: InsertAtCursor, type: string) => {
    return () => {
      const textArea = document.querySelector("textarea");
      if (textArea) {
        const noteTemplate = `<Note type="${type}" title="${type.charAt(0).toUpperCase() + type.slice(1)}">\n  This is a ${type} message.\n</Note>\n`;
        insertAtCursor(textArea, noteTemplate);
      }
    };
  };

  export const handleComponentClick = (insertAtCursor: InsertAtCursor, component: string) => {
    return () => {
      const textArea = document.querySelector("textarea");
      if (!textArea) return;

      const templates: { [key: string]: string } = {
        stepper: `<Stepper>
  <StepperItem title="Step 1">
    Content for step 1
  </StepperItem>
  <StepperItem title="Step 2">
    Content for step 2
  </StepperItem>
</Stepper>\n`,
        card: `<Card title="Click on me" icon="Link" href="/docs/getting-started/components/button">
    This is how you use a card with an icon and a link. Clicking on this card brings you to the Card Group page.
</Card>\n`,
        button: `<Button
  text="Click Me"
  href="#"
  icon="ArrowRight"
  size="md"
  variation="primary"
/>\n`,
        accordion: `<Accordion title="Markdown">
  this is an example of plain text content from the accordion component and below is markdown ;
    1. number one
    2. number two
    3. number three
</Accordion>\n`,
        youtube: `<Youtube videoId="your-video-id" />\n`,
        tooltip: `What do you know about <Tooltip text="DocuBook" tip="npx @docubook/create@latest" /> ? Create interactive nested documentations using MDX.\n`,
        tabs: `<Tabs defaultValue="tab1" className="pt-5 pb-1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
    <TabsContent value="tab1">
      Content for tab 1
    </TabsContent>
    <TabsContent value="tab2">
      Content for tab 2
    </TabsContent>
</Tabs>\n`
      };

      insertAtCursor(textArea, templates[component]);
    };
  };

// slash command handler
export const MARK_COMPONENTS = [
    { label: "Metadata", value: `---
  title: Post Title
  description: Your Post Description
  date: ${new Date().toISOString().split("T")[0]}
  image: example-img.png
  ---\n\n` },

    { label: "Heading 2", value: "## Heading 2\n" },
    { label: "Heading 3", value: "### Heading 3\n" },

    { label: "Paragraph", value: "this is regular text, **bold text**, *italic text*\n" },

    { label: "Bullet List", value: "- List One\n- List Two\n- Other List\n" },
    { label: "Numbered List", value: "1. Number One\n2. Number Two\n3. Number Three\n" },

    { label: "Blockquote", value: "> The overriding design goal for Markdown's formatting syntax is to make it as readable as possible.\n" },

    { label: "Code Block", value: "```javascript:main.js showLineNumbers {3-4}\nfunction isRocketAboutToCrash() {\n    // Check if the rocket is stable\n    if (!isStable()) {\n        NoCrash(); // Prevent the crash\n    }\n}\n```\n" },

    { label: "Table", value: `| **Feature**                     | **Description**                                       |
  | ------------------------------- | ----------------------------------------------------- |
  | MDX Support                     | Write interactive documentation with MDX.             |
  | Nested Pages                    | Organize content in a nested, hierarchical structure. |
  | Blog Section                    | Include a dedicated blog section.                     |
  | Pagination                      | Split content across multiple pages.                  |

  ` },

    { label: "Link", value: "[Visit OpenAI](https://www.openai.com)\n" },
    { label: "Image", value: "![Alt text for the image](https://via.placeholder.com/150)\n" },

    // ⭐ Komponen Interaktif DocuBook ⭐
    { label: "Stepper", value: `<Stepper>
      <StepperItem title="Step 1">
        Content for step 1
      </StepperItem>
      <StepperItem title="Step 2">
        Content for step 2
      </StepperItem>
  </Stepper>\n` },

    { label: "Button", value: `<Button
      text="Click Me"
      href="#"
      icon="ArrowRight"
      size="md"
      variation="primary"
  />\n` },

    { label: "Accordion", value: `<Accordion title="Markdown">
        This is an example of plain text content inside the accordion component.
        1. Number One
        2. Number Two
        3. Number Three
  </Accordion>\n` },

    { label: "Youtube", value: `<Youtube videoId="your-video-id" />\n` },

    { label: "Tooltip", value: `What do you know about <Tooltip text="DocuBook" tip="npx @docubook/create@latest" /> ?\n` },

    { label: "Tabs", value: `<Tabs defaultValue="tab1" className="pt-5 pb-1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        Content for tab 1
      </TabsContent>
      <TabsContent value="tab2">
        Content for tab 2
      </TabsContent>
  </Tabs>\n` },

    { label: "Note", value: `<Note type="note" title="Note">
    This is a note message.
  </Note>\n` },

    { label: "Danger", value: `<Note type="danger" title="Danger">
    This is a danger message.
  </Note>\n` },

    { label: "Warning", value: `<Note type="warning" title="Warning">
    This is a warning message.
  </Note>\n` },

  { label: "Success", value: `<Note type="success" title="Success">
    This is a success message.
  </Note>\n` }

];
