import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { parseMarkdown, type Inline } from "../../lib/miniMarkdown";

// Server-renders the finished page so audits and no-JS visitors see the result, then replays it once
// per page load: types the Markdown into the editor and renders the parsed result beside it as it grows,
// starting when the demo has scrolled halfway up the viewport.
const CHAR_MS = 22;
const LINE_MS = 140;

// Same shape as @docubook/markdown's Callout (left bar, 16% tint). The body is the colour mixed toward ink
// rather than toward transparent so the 11px demo text stays above 4.5:1 on the tint.
const CALLOUT: Record<string, { color: string; label: string }> = {
  info: { color: "var(--color-accent-ink)", label: "Info" },
  tip: { color: "hsl(137 50% 35%)", label: "Tip" },
  warning: { color: "hsl(36 100% 56%)", label: "Warning" },
  danger: { color: "hsl(0 85% 60%)", label: "Danger" },
  success: { color: "hsl(160 84% 30%)", label: "Success" },
};

function Callout({ name, title, children }: { name: string; title: string; children: ReactNode }) {
  const { color, label } = CALLOUT[name] ?? CALLOUT.info;
  return (
    <aside
      role="note"
      className="rounded-[10px] border border-transparent px-3 py-1.5 text-[11px] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
      style={{
        borderLeft: `4px solid ${color}`,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
    >
      <div className="mb-1 flex items-center gap-1.5 font-bold" style={{ color }}>
        {name === "info" && (
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )}
        {title || label}
      </div>
      <div
        className="leading-relaxed"
        style={{ color: `color-mix(in srgb, ${color} 75%, var(--color-ink))` }}
      >
        {children}
      </div>
    </aside>
  );
}

const lineTone = (line: string) =>
  line === "---"
    ? "text-[#8b8f7a]"
    : line.startsWith("## ")
      ? "text-ok"
      : line.startsWith(":::")
        ? "text-accent"
        : "";

function Inlines({ inlines }: { inlines: Inline[] }) {
  return inlines.map((n, i) =>
    n.type === "strong" ? (
      <strong key={i} className="text-ink font-semibold">
        {n.text}
      </strong>
    ) : n.type === "link" ? (
      <a key={i} href={n.href} className="underline" onClick={(e) => e.preventDefault()}>
        {n.text}
      </a>
    ) : (
      <span key={i}>{n.text}</span>
    )
  );
}

export default function MarkdownPlayground({ source }: { source: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(source);
  const done = typed.length >= source.length;

  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setTyped(source.slice(0, i));
      if (i >= source.length) {
        el.style.minHeight = "";
        return;
      }
      timer = setTimeout(
        tick,
        source[i - 1] === "\n" ? LINE_MS : CHAR_MS * (0.6 + Math.random() * 0.8)
      );
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Hold the finished height while the text regrows so the page below does not jump.
        el.style.minHeight = `${el.offsetHeight}px`;
        setTyped("");
        timer = setTimeout(tick, 400);
      },
      { rootMargin: "0px 0px -50% 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [source]);

  const doc = useMemo(() => parseMarkdown(typed), [typed]);
  const lines = typed.split("\n");

  return (
    <div ref={root} className="grid lg:grid-cols-[55%_45%]">
      <div className="border-dark-rule flex flex-col border-b lg:border-r lg:border-b-0">
        <div className="bg-dark-card flex h-[43px] items-center justify-between px-[23px] font-mono text-xs">
          <span className="flex items-center gap-5">
            <span className="flex gap-1.5" aria-hidden="true">
              {["bg-[#ff5f57]", "bg-[#febc2e]", "bg-[#28c840]"].map((bg) => (
                <i key={bg} className={`${bg} size-[7px] rounded-full`} />
              ))}
            </span>
            <span className="text-dark-code">index.md</span>
          </span>
          <span className="text-dark-muted font-medium uppercase">Markdown</span>
        </div>
        <ol
          className="flex min-h-[444px] flex-col py-[19px] pr-4 pl-[18px] font-mono text-[13px] leading-[25px]"
          aria-label="Markdown source"
        >
          {lines.map((line, i) => (
            <li
              key={i}
              className="flex min-h-[25px] gap-5 [overflow-wrap:anywhere] whitespace-pre-wrap"
            >
              <span className="text-dark-muted w-5 shrink-0 text-right text-xs">{i + 1}</span>
              <span className={lineTone(line)}>
                {line}
                {i === lines.length - 1 && (
                  <span
                    className={`bg-accent ml-px inline-block h-[15px] w-[7px] translate-y-0.5 ${done ? "animate-pulse" : ""}`}
                    aria-hidden="true"
                  />
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="text-ink flex flex-col bg-[#fffefa]">
        <div className="text-muted flex h-[43px] items-center justify-between bg-[#eaece4] px-5 font-mono text-[11px]">
          <span>your-docs / index.html</span>
          <span className={done ? "text-ok-ink" : ""}>{done ? "✓ built" : "compiling…"}</span>
        </div>
        <article
          className="flex min-h-[471px] flex-col gap-3 px-8 pt-7 pb-6 lg:px-12"
          aria-live="polite"
        >
          {doc.frontmatter.title && (
            <h2 className="text-[22px] font-bold">{doc.frontmatter.title}</h2>
          )}
          {doc.frontmatter.description && (
            <p className="text-muted text-[11px]">{doc.frontmatter.description}</p>
          )}
          {doc.blocks.map((b, i) =>
            b.type === "heading" ? (
              <h3 key={i} className="mt-2 text-[15px] font-bold">
                {b.text}
              </h3>
            ) : b.type === "paragraph" ? (
              <p key={i} className="text-muted text-[11px] leading-relaxed">
                <Inlines inlines={b.inlines} />
              </p>
            ) : (
              <Callout key={i} name={b.name} title={b.title}>
                <Inlines inlines={b.inlines} />
              </Callout>
            )
          )}
        </article>
      </div>
    </div>
  );
}
