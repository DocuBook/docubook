# Security Policy

## Supported Versions

Security fixes are released only for the latest published version of each
package. Upgrade to it before reporting, and check whether the issue still
occurs there.

| Package | Supported |
|---|---|
| `@docubook/core`, `@docubook/flame`, `@docubook/markdown`, `@docubook/themes-colors`, `@docubook/ui-react` | latest release |
| `@docubook/plugin-search-algolia`, `@docubook/plugin-og-image` | latest release |
| `ghcr.io/docubook/flame` builder image | `latest` tag |

## Reporting a Vulnerability

Do not open a public issue, discussion, or pull request for a security problem.

Report it privately through GitHub:
[**Report a vulnerability**](https://github.com/DocuBook/docubook/security/advisories/new)
(repository **Security** tab → **Report a vulnerability**).

Include:

- the affected package and version, and the runtime (Bun, Node, or Deno)
- a description of the issue and its impact
- steps to reproduce, or a minimal `docu.json` and content that trigger it
- any known workaround

## What to Expect

- The maintainer acknowledges the report in the advisory thread, usually within
  a few days.
- Confirmed issues are fixed in a new release, and the advisory is published
  with credit to the reporter unless you ask to stay anonymous.
- If the report is declined, the advisory thread explains why.

## Scope

In scope: the packages in this repository, the static output and dev server
that `flame` produces, and the files `flame deploy` generates (CSP and other
headers, `Dockerfile`, `nginx.conf`, GitHub workflows).

Out of scope: vulnerabilities in third-party dependencies that are already
public (Renovate opens updates for those), sites that disable or override
flame's security headers, and third-party flame plugins.
