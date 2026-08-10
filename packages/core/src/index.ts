export type { TocItem, MdxCompileResult } from "./types";
export { cn, parseDate, stringToDate, formatDate, formatDate2, toIsoDateOnly } from "./utils";
export {
  parseMdx,
  serialize,
  MDXRemote,
  preProcess,
  postProcess,
  createDefaultRehypePlugins,
  createDefaultRemarkPlugins,
} from "./compile";
export { handleCodeTitles } from "./plugins/handleCodeTitles";
export { handleCodeExpandableRemark, handleCodeExpandable } from "./plugins/handleCodeExpandable";
export { rehypeMermaid } from "./plugins/rehypeMermaid";
export {
  extractFrontmatter,
  extractFrontmatterWithContent,
  extractTocsFromRawMdx,
  sluggify,
} from "./extract";
export type { ParseMdxOptions } from "./compile";
// Runtime MDX compilation (was @docubook/mdx-remote/rsc) — compileMDX for
// build-time/RSC rendering; subpath exports @docubook/core/rsc and
// @docubook/core/serialize mirror the former @docubook/mdx-remote entries.
export { compileMDX } from "./mdx-remote/rsc";
export type { MDXRemoteProps } from "./mdx-remote/index";
export type {
  MDXRemoteSerializeResult,
  SerializeOptions,
  SerializeResult,
} from "./mdx-remote/serialize";
export type { CompileMDXOptions, CompileMDXResult } from "./mdx-remote/types";
export {
  readMdxFileBySlug,
  parseMdxFile,
  compileParsedMdxFile,
  createMdxContentService,
} from "./content";
export type {
  ReadMdxFileResult,
  ParsedMdxFile,
  CompiledMdxFile,
  CreateMdxContentServiceOptions,
} from "./content";
