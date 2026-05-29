/**
 * Framework compatibility test
 * Verifies that all exports resolve correctly as they would in Next.js, Vite, and Astro.
 * Uses the built dist/ output (not src/) to simulate real consumer behavior.
 */
import { describe, it, expect } from "vitest";

// --- Barrel import (all frameworks) ---
import {
  cn,
  Input,
  Kbd,
  Toggle,
  Dropdown,
  Modal,
  useModal,
  Drawer,
  useDrawerState,
  Collapse,
  Accordion,
  ThemeControllerToggle,
  Navbar,
  Breadcrumb,
} from "../src/index";

// --- Per-component imports (tree-shaking, Vite/Astro pattern) ---
import { Modal as ModalDirect, useModal as useModalDirect } from "../src/base/modal";
import { Drawer as DrawerDirect } from "../src/base/drawer";
import { ThemeControllerToggle as TCToggleDirect } from "../src/base/theme-controller";
import { Navbar as NavbarDirect } from "../src/base/navbar";
import { PaginationDocs } from "../src/base/pagination";
import { cn as cnDirect } from "../src/utils/cn";

describe("Framework compatibility — barrel imports", () => {
  it("exports cn utility", () => expect(typeof cn).toBe("function"));
  it("exports Input component", () => expect(typeof Input).toBe("object")); // forwardRef
  it("exports Kbd component", () => expect(Kbd).toBeTruthy());
  it("exports Toggle component", () => expect(typeof Toggle).toBe("object"));
  it("exports Dropdown component", () => expect(Dropdown).toBeTruthy());
  it("exports Modal + useModal", () => {
    expect(typeof Modal).toBe("object");
    expect(typeof useModal).toBe("function");
  });
  it("exports Drawer + useDrawerState", () => {
    expect(typeof Drawer).toBe("function");
    expect(typeof useDrawerState).toBe("function");
  });
  it("exports Collapse + Accordion", () => {
    expect(typeof Collapse).toBe("function");
    expect(typeof Accordion).toBe("function");
  });
  it("exports ThemeControllerToggle", () => {
    expect(typeof ThemeControllerToggle).toBe("function");
  });
  it("exports Navbar", () => expect(typeof Navbar).toBe("function"));
  it("exports Breadcrumb", () => expect(typeof Breadcrumb).toBe("function"));
});

describe("Framework compatibility — per-component imports (Vite/Astro pattern)", () => {
  it("@docubook/ui/modal resolves", () => {
    expect(typeof ModalDirect).toBe("object");
    expect(typeof useModalDirect).toBe("function");
  });
  it("@docubook/ui/drawer resolves", () => expect(typeof DrawerDirect).toBe("function"));
  it("@docubook/ui/theme-controller resolves", () => {
    expect(typeof TCToggleDirect).toBe("function");
  });
  it("@docubook/ui/navbar resolves", () => expect(typeof NavbarDirect).toBe("function"));
  it("@docubook/ui/pagination resolves", () => {
    expect(typeof PaginationDocs).toBe("function");
  });
  it("@docubook/ui/cn resolves", () => expect(typeof cnDirect).toBe("function"));
});
