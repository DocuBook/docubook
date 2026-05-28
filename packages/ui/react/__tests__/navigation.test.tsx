import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar, Logo, NavMenu, NavMenuLink } from "../src/base/navbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
} from "../src/base/breadcrumbs";
import { getPaginationRange, PaginationFull } from "../src/base/pagination";

describe("Navbar", () => {
  it("renders nav element", () => {
    render(<Navbar>content</Navbar>);
    expect(screen.getByRole("navigation")).toHaveClass("navbar");
  });

  it("applies className", () => {
    render(<Navbar className="custom">x</Navbar>);
    expect(screen.getByRole("navigation").className).toContain("custom");
  });
});

describe("Logo", () => {
  it("renders text logo", () => {
    render(<Logo text="DocuBook" />);
    expect(screen.getByText("DocuBook")).toBeDefined();
  });

  it("renders image logo", () => {
    render(<Logo src="/logo.png" alt="Logo" />);
    expect(screen.getByAltText("Logo")).toBeDefined();
  });
});

describe("NavMenu", () => {
  it("renders menu items", () => {
    const items = [
      { title: "Home", href: "/" },
      { title: "Docs", href: "/docs" },
    ];
    render(<NavMenu items={items} />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Docs")).toBeDefined();
  });

  it("marks active item", () => {
    const items = [{ title: "Docs", href: "/docs" }];
    render(<NavMenu items={items} activePath="/docs" />);
    expect(screen.getByText("Docs").className).toContain("active");
  });
});

describe("NavMenuLink", () => {
  it("renders link", () => {
    render(<NavMenuLink item={{ title: "Home", href: "/" }} />);
    expect(screen.getByText("Home")).toBeDefined();
  });

  it("marks active link", () => {
    render(<NavMenuLink item={{ title: "Home", href: "/" }} isActive />);
    expect(screen.getByText("Home").className).toContain("active");
  });
});

describe("Breadcrumbs", () => {
  it("renders breadcrumb structure", () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span>Home</span>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    expect(container.querySelector(".breadcrumbs")).not.toBeNull();
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Current")).toBeDefined();
  });
});

describe("getPaginationRange", () => {
  it("returns single page for small total", () => {
    const range = getPaginationRange({ totalCount: 5, pageSize: 10, currentPage: 1 });
    expect(range).toEqual([1]);
  });

  it("returns full range for few pages", () => {
    const range = getPaginationRange({ totalCount: 30, pageSize: 10, currentPage: 1 });
    expect(range).toEqual([1, 2, 3]);
  });

  it("includes ellipsis for many pages", () => {
    const range = getPaginationRange({ totalCount: 100, pageSize: 10, currentPage: 5 });
    expect(range).toContain("ellipsis");
  });

  it("shows correct range at start", () => {
    const range = getPaginationRange({ totalCount: 100, pageSize: 10, currentPage: 1 });
    expect(range[0]).toBe(1);
    expect(range).toContain("ellipsis");
  });
});

describe("PaginationFull", () => {
  it("renders pagination buttons", () => {
    render(<PaginationFull current={1} total={50} pageSize={10} onPageChange={() => {}} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("«")).toBeDefined();
    expect(screen.getByText("»")).toBeDefined();
  });

  it("marks current page as active", () => {
    render(<PaginationFull current={2} total={50} pageSize={10} onPageChange={() => {}} />);
    expect(screen.getByText("2").className).toContain("btn-active");
  });
});
