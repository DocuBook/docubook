---
"@docubook/markdown": patch
---

Drop the unused `@docubook/core` peer dependency. The package never imports it, so installing `@docubook/markdown` no longer pulls in core's MDX pipeline, and a major release of core no longer forces a major release of markdown. Use any MDX renderer, including `MDXRemote` from `@docubook/core`.
