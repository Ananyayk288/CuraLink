import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function scanDirectoryForForbiddenKeyword(
  dirPath: string,
  forbiddenRegex: RegExp,
  ignoreDirs: string[] = ["node_modules", ".next", ".git", "dist", "build"]
): string[] {
  const matches: string[] = [];

  function traverse(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name)) {
          traverse(path.join(current, entry.name));
        }
      } else if (entry.isFile()) {
        // Skip this test file itself to avoid false positive on test regexes
        if (entry.name === "zero-substitution-sweep.test.ts") {
          continue;
        }
        const ext = path.extname(entry.name);
        if ([".ts", ".tsx", ".js", ".jsx", ".sql", ".json", ".md", ".webmanifest"].includes(ext)) {
          const content = fs.readFileSync(path.join(current, entry.name), "utf-8");
          if (forbiddenRegex.test(content)) {
            matches.push(path.join(current, entry.name));
          }
        }
      }
    }
  }

  traverse(dirPath);
  return matches;
}

describe("System Integrity & Deletion Sweep Tests", () => {
  it("should find zero occurrences of 'substitut' across src/ directory", () => {
    const srcDir = path.resolve(__dirname, "../../src");
    const matches = scanDirectoryForForbiddenKeyword(srcDir, /substitut/i);
    expect(matches).toEqual([]);
  });

  it("should find zero occurrences of 'substitut' across supabase/ migrations", () => {
    const supabaseDir = path.resolve(__dirname, "../../supabase");
    const matches = scanDirectoryForForbiddenKeyword(supabaseDir, /substitut/i);
    expect(matches).toEqual([]);
  });

  it("should find zero occurrences of 'substitut' across tests/ directory", () => {
    const testsDir = path.resolve(__dirname, "../../tests");
    const matches = scanDirectoryForForbiddenKeyword(testsDir, /substitut/i);
    expect(matches).toEqual([]);
  });

  it("should find zero occurrences of old app name across codebase and docs", () => {
    const projectRoot = path.resolve(__dirname, "../..");
    const forbidden = new RegExp(["arogya", "vani"].join(""), "i");
    const matches = scanDirectoryForForbiddenKeyword(projectRoot, forbidden);
    expect(matches).toEqual([]);
  });

  it("should find zero occurrences of 'Physical Dispense Verification' or 'I verified physical stock' in src/", () => {
    const srcDir = path.resolve(__dirname, "../../src");
    const matches1 = scanDirectoryForForbiddenKeyword(srcDir, /Physical Dispense Verification/i);
    const matches2 = scanDirectoryForForbiddenKeyword(srcDir, /I verified physical stock/i);
    expect(matches1).toEqual([]);
    expect(matches2).toEqual([]);
  });

  it("should find zero occurrences of 'Voice Script Preview' in src/", () => {
    const srcDir = path.resolve(__dirname, "../../src");
    const matches = scanDirectoryForForbiddenKeyword(srcDir, /Voice Script Preview/i);
    expect(matches).toEqual([]);
  });
});
