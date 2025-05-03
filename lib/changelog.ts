import { promises as fs } from "fs";
import path from "path";

interface ChangelogEntry {
  version: string;
  date: string;
  description?: string;
  image?: string;
  changes: {
    Added?: string[];
    Improved?: string[];
    Fixed?: string[];
    Deprecated?: string[];
    Removed?: string[];
  };
}

export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const filePath = path.join(process.cwd(), "CHANGELOG.md");
  const content = await fs.readFile(filePath, "utf-8");
  
  const entries: ChangelogEntry[] = [];
  let currentEntry: Partial<ChangelogEntry> = {};
  let currentSection: keyof ChangelogEntry["changes"] | null = null;

  const lines = content.split("\n");

  for (const line of lines) {
    // Version and date
    const versionMatch = line.match(/## \[(.+)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch) {
      if (Object.keys(currentEntry).length > 0) {
        entries.push(currentEntry as ChangelogEntry);
      }
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2].split("-").reverse().join("-"),
        changes: {}
      };
      continue;
    }

    // Description
    if (line.startsWith("> ")) {
      currentEntry.description = line.slice(2);
      continue;
    }

    // Image
    const imageMatch = line.match(/!\[.*\]\((.*)\)/);
    if (imageMatch) {
      currentEntry.image = imageMatch[1];
      continue;
    }

    // Change type
    const sectionMatch = line.match(/### (Added|Improved|Fixed|Deprecated|Removed)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1] as keyof ChangelogEntry["changes"];
      currentEntry.changes = currentEntry.changes || {};
      currentEntry.changes[currentSection] = [];
      continue;
    }

    // Change item
    if (line.startsWith("- ") && currentSection && currentEntry.changes) {
      currentEntry.changes[currentSection]?.push(line.slice(2));
    }
  }

  if (Object.keys(currentEntry).length > 0) {
    entries.push(currentEntry as ChangelogEntry);
  }

  return entries;
}