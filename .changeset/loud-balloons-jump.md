---
'@docubook/flame': patch
---

GitHubLink: respect repo.edit flag to hide GitHub icon when edit is disabled

`GitHubLink` component previously only checked whether a `repoUrl` prop was provided. When `repo.edit` was set to `false` in `docu.json`, the "Edit this page" link correctly disappeared, but the GitHub icon in the sidebar remained visible because `GitHubLink` was unaware of the edit flag.

Now `GitHubLink` also checks `docuConfig.repo?.edit`, so both the edit link and GitHub icon are consistently hidden when editing is disabled.
