#!/usr/bin/env node
/**
 * Reports whether a package was part of a publish, from the `publishedPackages`
 * output of `changesets/action` (a JSON array of `{ name, version }`).
 *
 * Usage:
 *   PUBLISHED_PACKAGES='[{"name":"@docubook/flame","version":"2.1.2"}]' \
 *     node scripts/published-packages.mjs @docubook/flame
 *
 * Prints one `released=<true|false>` line, suitable for `$GITHUB_OUTPUT`.
 *
 * The caller only runs this when the action reported `published == 'true'`. That
 * flag and `publishedPackages` are derived from the same package list, so the
 * payload cannot legitimately be empty; an empty or malformed payload means the
 * action's output contract changed and is an error here, because reporting
 * `released=false` would stop the product release without a sound.
 */
const [, , name] = process.argv;
const raw = process.env.PUBLISHED_PACKAGES ?? "";

if (!name) {
  console.error("usage: node scripts/published-packages.mjs <package-name>");
  process.exit(2);
}

let packages;
try {
  packages = JSON.parse(raw);
} catch {
  packages = null;
}

if (!Array.isArray(packages) || packages.length === 0) {
  console.error(
    "::error::expected a non-empty publishedPackages JSON array, received " +
      `${JSON.stringify(raw)}; the changesets/action output contract may have changed.`
  );
  process.exit(1);
}

console.log(`released=${packages.some((pkg) => pkg?.name === name)}`);
