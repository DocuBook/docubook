import type { SerializeOptions, SerializeResult } from "./serialize.js";

/** Shape returned by `serialize()` — ready to pass to `<MDXRemote>`. */
export type MDXRemoteSerializeResult = SerializeResult;

/** Options for `compileMDX` (RSC path). */
export type CompileMDXOptions<Frontmatter = Record<string, unknown>> = {
  source: string;
  options?: SerializeOptions;
  components?: Record<string, React.ComponentType<any>>;
};

/** Result returned by `compileMDX`. */
export type CompileMDXResult<Frontmatter = Record<string, unknown>> = {
  content: React.ReactElement;
  frontmatter: Frontmatter;
};
