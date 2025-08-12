import { type ComponentProps } from "react";
import Copy from "./CopyMdx";
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
  SiCss3,
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
import { FaJava, FaCode } from "react-icons/fa";
import { TbJson } from "react-icons/tb";

type PreProps = ComponentProps<"pre"> & {
  raw?: string;
  "data-title"?: string;
};

// Component to display an icon based on the programming language
const LanguageIcon = ({ lang }: { lang: string }) => {
  const iconProps = { className: "w-4 h-4" };
  const languageToIconMap: Record<string, JSX.Element> = {
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
    css: <SiCss3 {...iconProps} />,
    scss: <SiSass {...iconProps} />,
    sass: <SiSass {...iconProps} />,
  };
  return languageToIconMap[lang] || <FaCode {...iconProps} />;
};

// Function to extract the language from className
function getLanguage(className: string = ""): string {
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "default";
}

export default function Pre({ children, raw, ...rest }: PreProps) {
  const { "data-title": title, className, ...restProps } = rest;
  const language = getLanguage(className);
  const hasTitle = !!title;

  return (
    <div className="code-block-container">
      <div className="code-block-actions">
        {raw && <Copy content={raw} />}
      </div>
      {hasTitle && (
        <div className="code-block-header">
          <div className="flex items-center gap-2">
            <LanguageIcon lang={language} />
            <span>{title}</span>
          </div>
        </div>
      )}
      <div className="code-block-body">
        <pre className={className} {...restProps}>
          {children}
        </pre>
      </div>
    </div>
  );
}