import React from "react";
import { loadDocuConfig } from "../node/paths";
import Menu from "./Menu";

const docuConfig = loadDocuConfig();

interface DocsLayoutProps {
  children?: React.ReactNode;
  repoUrl?: string;
  pathname?: string;
}

export function DocsLayout({ children, repoUrl, pathname = "/docs" }: DocsLayoutProps) {
  return React.createElement(
    "div",
    { className: "docs-layout flex flex-col min-h-screen w-full" },
    React.createElement(
      "div",
      { className: "flex flex-1 items-start w-full" },
      React.createElement(
        "aside",
        {
          id: "sidebar-island",
          className:
            "sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col lg:flex border-r border-base-200 bg-base-100",
          "data-tocs": "[]",
          "data-title": "",
          "data-repo": repoUrl || "",
        },
        // SSR sidebar content — Menu rendered server-side
        React.createElement(
          "div",
          { className: "flex h-full flex-col overflow-y-auto px-4" },
          React.createElement(Menu, { pathname, routes: docuConfig.routes || [] })
        )
      ),
      React.createElement(
        "main",
        { className: "flex-1 min-w-0 min-h-screen flex flex-col" },
        React.createElement(
          "div",
          { className: "hidden lg:flex items-center justify-end gap-6 h-14 px-8" },
          React.createElement(
            "nav",
            { className: "flex items-center gap-6 text-sm font-medium text-base-content/80" },
            ...(docuConfig.navbar?.menu || []).map((item: { title: string; href: string }) => {
              const isExternal = /^https?:\/\//.test(item.href);
              const isDocsActive = item.href === "/docs";
              return React.createElement(
                "a",
                {
                  key: item.title,
                  href: item.href,
                  className: `flex items-center gap-1 hover:text-base-content transition-colors${isDocsActive ? " text-primary font-semibold" : ""}`,
                  ...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                },
                item.title,
                isExternal
                  ? React.createElement(
                      "svg",
                      {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "14",
                        height: "14",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                      },
                      React.createElement("path", { d: "M7 7h10v10" }),
                      React.createElement("path", { d: "M7 17 17 7" })
                    )
                  : null
              );
            })
          )
        ),
        React.createElement("div", { className: "flex-1 w-full" }, children)
      )
    )
  );
}
