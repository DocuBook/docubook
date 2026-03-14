#!/usr/bin/env node

/* global fetch */
import { execSync } from "child_process";
import fs from "fs";

/**
 * Generate release notes from git commits between tags
 * Usage: node scripts/generate-release-notes.mjs [version]
 * Example: node scripts/generate-release-notes.mjs 0.2.9
 */

const version = process.argv[2];

if (!version) {
  console.error("Error: Please provide a version number");
  console.error("Usage: node scripts/generate-release-notes.mjs 0.2.9");
  process.exit(1);
}

const currentTag = `cli-v${version}`;
const pkgName = "@docubook/cli";
const repo = "DocuBook/docubook";

async function generateReleaseNotes() {
  try {
    console.log(`📝 Generating release notes for ${currentTag}...\n`);

    // Get the previous release tag
    let prevTag = "";
    try {
      prevTag = execSync(`git describe --tags --abbrev=0 ${currentTag}^ 2>/dev/null || echo ""`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {
      // First release, no previous tag
    }

    if (!prevTag || !prevTag.startsWith("cli-v")) {
      console.log("⚠️  No previous CLI release found. Using all commits to packages/cli/");
      prevTag = "HEAD~100"; // Fallback to recent commits
    }

    console.log(`📊 Commits between ${prevTag || "start"}...${currentTag}\n`);

    // Get commits
    const cmd = `git log ${prevTag}..${currentTag} --pretty=format:"%H|%s|%an" -- packages/cli/ 2>/dev/null || echo ""`;
    const output = execSync(cmd, { encoding: "utf-8" });

    if (!output.trim()) {
      console.log("ℹ️  No commits found in packages/cli/ for this release");
      process.exit(0);
    }

    const commits = output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, author] = line.split("|");
        return {
          hash: hash.slice(0, 7),
          subject: subject?.trim() || "unknown",
          author: author?.trim() || "unknown",
        };
      });

    console.log(`✅ Found ${commits.length} commits\n`);

    // Categorize commits
    const categories = {
      added: [],
      fixed: [],
      improved: [],
      deprecated: [],
      removed: [],
    };

    commits.forEach(({ hash, subject, author }) => {
      const repoUrl = "https://github.com/DocuBook/docubook/commit";
      const link = `[${hash}](${repoUrl}/${hash}) @${author}`;

      if (subject.startsWith("feat")) {
        categories.added.push(`- ${subject.replace(/^feat(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("fix")) {
        categories.fixed.push(`- ${subject.replace(/^fix(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("perf") || subject.startsWith("refactor")) {
        categories.improved.push(`- ${subject.replace(/^(perf|refactor)(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("deprecate")) {
        categories.deprecated.push(`- ${subject.replace(/^deprecate(\(.*?\))?:\s*/, "")} ${link}`);
      } else if (subject.startsWith("remove")) {
        categories.removed.push(`- ${subject.replace(/^remove(\(.*?\))?:\s*/, "")} ${link}`);
      }
    });

    // Build markdown
    let markdown = "";

    if (categories.added.length > 0) {
      markdown += `### Added\n\n${categories.added.join("\n")}\n\n`;
    }
    if (categories.fixed.length > 0) {
      markdown += `### Fixed\n\n${categories.fixed.join("\n")}\n\n`;
    }
    if (categories.improved.length > 0) {
      markdown += `### Improved\n\n${categories.improved.join("\n")}\n\n`;
    }
    if (categories.deprecated.length > 0) {
      markdown += `### Deprecated\n\n${categories.deprecated.join("\n")}\n\n`;
    }
    if (categories.removed.length > 0) {
      markdown += `### Removed\n\n${categories.removed.join("\n")}\n\n`;
    }

    // Display markdown
    console.log("📋 Generated Release Notes:\n");
    console.log("===========================================================\n");
    console.log(markdown.trim());
    console.log("\n===========================================================\n");

    // Save to file
    const notesFile = `.release-notes-${version}.md`;
    fs.writeFileSync(notesFile, markdown.trim(), "utf-8");
    console.log(`✅ Saved to: ${notesFile}\n`);

    // Publish to GitHub if token provided
    if (process.env.GITHUB_TOKEN) {
      console.log("📤 Publishing to GitHub release...");
      await publishToGitHub(markdown.trim(), version);
    } else {
      console.log(
        "💡 Tip: Set GITHUB_TOKEN to auto-publish to GitHub release page"
      );
      console.log(`   export GITHUB_TOKEN=your_token`);
      console.log(`   node scripts/generate-release-notes.mjs ${version}\n`);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

/**
 * Publish release notes to GitHub using API
 */
async function publishToGitHub(notes, version) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return;

    // Get existing release
    const releaseUrl = `https://api.github.com/repos/${repo}/releases`;
    const listRes = await fetch(releaseUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!listRes.ok) {
      throw new Error(`Failed to fetch releases: ${listRes.status}`);
    }

    const releases = await listRes.json();
    const release = releases.find((r) => r.tag_name === `cli-v${version}`);

    if (!release) {
      console.log(`⚠️  Release ${version} not found on GitHub`);
      return;
    }

    // Update release
    const updateRes = await fetch(`${releaseUrl}/${release.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: notes,
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update release: ${updateRes.status}`);
    }

    console.log(`✅ Published to: https://github.com/${repo}/releases/tag/cli-v${version}\n`);
  } catch (err) {
    console.error(`⚠️  Failed to publish to GitHub: ${err.message}`);
    console.error("   Release notes saved to file. You can update manually.\n");
  }
}

generateReleaseNotes();
