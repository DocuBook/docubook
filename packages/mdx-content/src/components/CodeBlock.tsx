import { isValidElement, type ComponentProps, type ReactNode } from "react";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiPython,
  SiGo,
  SiPhp,
  SiRuby,
  SiSwift,
  SiKotlin,
  SiHtml5,
  SiCss,
  SiSass,
  SiPostgresql,
  SiGraphql,
  SiYaml,
  SiToml,
  SiDocker,
  SiNginx,
  SiGit,
  SiGnubash,
  SiMarkdown,
} from "react-icons/si";
import { FaJava, FaCode, FaRegFileAlt } from "react-icons/fa";
import { TbJson } from "react-icons/tb";
import { CopyButton } from "./CopyButton";
import { ExpandableCode } from "./ExpandableCode";

type CodeBlockProps = ComponentProps<"pre"> & {
  raw?: string;
  "data-title"?: string;
  "data-language"?: string;
  "data-expandable"?: string;
  "data-expandable-lines"?: string;
};

function getLanguage(className: string = "") {
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "text";
}

function resolveLanguage(
  preClassName: string | undefined,
  dataLanguage: string | undefined,
  children: ReactNode
) {
  if (typeof dataLanguage === "string" && dataLanguage.trim().length > 0) {
    return dataLanguage.trim().toLowerCase();
  }

  const languageFromPre = getLanguage(preClassName ?? "");
  if (languageFromPre !== "text") return languageFromPre;

  if (isValidElement(children)) {
    const childProps = children.props as { className?: string };
    if (typeof childProps.className === "string") {
      const languageFromCode = getLanguage(childProps.className);
      if (languageFromCode !== "text") return languageFromCode;
    }
  }

  return "text";
}

function getLanguageIcon(language: string) {
  const normalized = language.toLowerCase();
  const iconProps = { size: 14 };

  const map: Record<string, ReactNode> = {
    gitignore: <SiGit {...iconProps} />,
    docker: <SiDocker {...iconProps} />,
    dockerfile: <SiDocker {...iconProps} />,
    nginx: <SiNginx {...iconProps} />,
    sql: <SiPostgresql {...iconProps} />,
    graphql: <SiGraphql {...iconProps} />,
    yaml: <SiYaml {...iconProps} />,
    yml: <SiYaml {...iconProps} />,
    toml: <SiToml {...iconProps} />,
    json: <TbJson {...iconProps} />,
    md: <SiMarkdown {...iconProps} />,
    markdown: <SiMarkdown {...iconProps} />,
    bash: <SiGnubash {...iconProps} />,
    sh: <SiGnubash {...iconProps} />,
    shell: <SiGnubash {...iconProps} />,
    swift: <SiSwift {...iconProps} />,
    kotlin: <SiKotlin {...iconProps} />,
    kt: <SiKotlin {...iconProps} />,
    kts: <SiKotlin {...iconProps} />,
    rb: <SiRuby {...iconProps} />,
    ruby: <SiRuby {...iconProps} />,
    php: <SiPhp {...iconProps} />,
    go: <SiGo {...iconProps} />,
    py: <SiPython {...iconProps} />,
    python: <SiPython {...iconProps} />,
    java: <FaJava {...iconProps} />,
    tsx: <SiReact {...iconProps} />,
    typescript: <SiTypescript {...iconProps} />,
    ts: <SiTypescript {...iconProps} />,
    jsx: <SiReact {...iconProps} />,
    js: <SiJavascript {...iconProps} />,
    javascript: <SiJavascript {...iconProps} />,
    html: <SiHtml5 {...iconProps} />,
    css: <SiCss {...iconProps} />,
    scss: <SiSass {...iconProps} />,
    sass: <SiSass {...iconProps} />,
    text: <FaRegFileAlt {...iconProps} />,
    plaintext: <FaRegFileAlt {...iconProps} />,
  };

  return map[normalized] || <FaCode {...iconProps} />;
}

function countCodeLines(raw: string) {
  let normalized = raw.replace(/\r\n/g, "\n");
  if (normalized.startsWith("\n")) normalized = normalized.slice(1);
  if (normalized.endsWith("\n")) normalized = normalized.slice(0, -1);

  if (normalized.length === 0) return 0;
  return normalized.split("\n").length;
}

export function CodeBlock({ children, raw, ...rest }: CodeBlockProps) {
  const {
    className,
    "data-title": title,
    "data-language": dataLanguage,
    "data-expandable": isExpandable,
    "data-expandable-lines": totalLinesStr,
    ...props
  } = rest;

  const language = resolveLanguage(
    typeof className === "string" ? className : undefined,
    dataLanguage,
    children
  );
  const totalLinesFromMeta = parseInt(totalLinesStr as string, 10) || 0;
  const totalLinesFromRaw = raw ? countCodeLines(raw) : 0;
  const totalLines = totalLinesFromRaw || totalLinesFromMeta;
  const hasExpandableClass =
    typeof className === "string" && className.split(" ").includes("mdx-expandable-code");
  const shouldExpand = isExpandable === "true" || hasExpandableClass;
  const preProps = {
    ...props,
    "data-expandable": isExpandable,
    "data-expandable-lines": totalLinesStr,
  };

  return (
    <div
      className="code-block-container not-prose"
      style={{
        position: "relative",
        margin: "1.5rem 0",
        border: "1px solid hsl(var(--border, 210 20% 85%))",
        overflow: "hidden",
        fontSize: "0.875rem",
        borderRadius: "0.75rem",
      }}
    >
      <div
        className="code-block-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          background: "hsl(var(--muted, 210 20% 92%))",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid hsl(var(--border, 210 20% 85%))",
          color: "hsl(var(--muted-foreground, 220 15% 50%))",
          fontFamily: "monospace",
          fontSize: "0.8rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.78rem",
            color: "hsl(var(--muted-foreground, 220 15% 50%))",
          }}
        >
          {getLanguageIcon(language)}
          <span>{title || language}</span>
        </div>
        {raw ? (
          <div
            className="code-block-actions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                color: "hsl(var(--muted-foreground, 220 15% 50%))",
                transition: "color 0.2s ease-in-out",
              }}
            >
              <CopyButton content={raw} />
            </div>
          </div>
        ) : null}
      </div>
      <div
        className="code-block-body"
        style={
          {
            overflowY: "visible",
            backgroundColor: "hsl(var(--background, 210 40% 98%))",
            willChange: "transform",
            borderBottom: "none",
          } as React.CSSProperties
        }
      >
        <ExpandableCode
          isExpandable={shouldExpand}
          totalLines={totalLines}
          preContent={children}
          preProps={preProps}
          className={className}
        />
      </div>
    </div>
  );
}
