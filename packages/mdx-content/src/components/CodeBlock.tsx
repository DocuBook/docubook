import type { ComponentProps, ReactNode } from "react";
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
import { FaJava, FaCode, FaFileAlt } from "react-icons/fa";
import { TbJson } from "react-icons/tb";
import { CopyButton } from "./CopyButton";

type CodeBlockProps = ComponentProps<"pre"> & {
    raw?: string;
    "data-title"?: string;
};

function getLanguage(className: string = "") {
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : "text";
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
        text: <FaFileAlt {...iconProps} />,
        plaintext: <FaFileAlt {...iconProps} />,
    };

    return map[normalized] || <FaCode {...iconProps} />;
}

export function CodeBlock({ children, raw, ...rest }: CodeBlockProps) {
    const { className, "data-title": title, ...props } = rest;
    const language = getLanguage(className);

    return (
        <div style={{ border: "1px solid hsl(var(--border, 210 14% 94%))", borderRadius: 12, overflow: "hidden", margin: "1rem 0" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.6rem",
                    borderBottom: "1px solid hsl(var(--border, 210 14% 94%))",
                    background: "hsl(var(--muted, 210 12% 96%))",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "hsl(var(--muted-foreground, 215 20% 65%))" }}>
                    {getLanguageIcon(language)}
                    <span>{title || language}</span>
                </div>
                {raw ? <CopyButton content={raw} /> : null}
            </div>
            <pre {...props} className={className} style={{ margin: 0, padding: "0.9rem", overflowX: "auto" }}>
                {children}
            </pre>
        </div>
    );
}
