import type { MdxComponentMap } from "@docubook/mdx-content";
import Outlet from "@/lib/mdx/Outlet";
// import your custom MDX components here and add them to the `customMdxComponents` object below to make them available in your MDX files. For example:
// import { MyCustomComponent } from "@/lib/mdx/MyCustomComponent";

export const customMdxComponents: MdxComponentMap = {
    Outlet,
    // MyCustomComponent, --- IGNORE ---
};

// you must also add MyCustomComponent.tsx to lib/mdx/MyCustomComponent.tsx and export it from there, and then export it from this file as well to make it available for import in mdx-components.ts.
