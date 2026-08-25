#!/usr/bin/env node
/**
 * =============================================================================
 * SECURITY AUDIT: reproducible repository validation
 * =============================================================================
 * PURPOSE
 * - Validate JavaScript syntax for every tracked JS-family file.
 * - Detect non-ASCII content under G10 ASCII Strict.
 * - Detect high-risk data-exposure patterns for manual review.
 * - Never modify repository files.
 * =============================================================================
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const IGNORED = new Set(["node_modules", ".git", ".wix", "dist", "build"]);

const REVIEW_PATTERNS = Object.freeze([
    { name: "cms-suppressAuth", regex: /suppressAuth\s*:\s*true/g },
    { name: "direct-items-exposure", regex: /successResponse\(\s*items\s*,/g },
    { name: "raw-error-message-public", regex: /String\(err\?\.message\s*\|\|/g },
    { name: "raw-currentMember-id-log", regex: /memberId:\s*member\._id/g },
]);

function getFiles(dir, result = []) {
    if (!fs.existsSync(dir)) return result;
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (!IGNORED.has(entry)) getFiles(full, result);
            continue;
        }
        if (EXTENSIONS.has(path.extname(entry))) result.push(full);
    }
    return result;
}

function syntaxOk(file) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    return {
        ok: result.status === 0,
        error: (result.stderr || result.stdout || "").trim(),
    };
}

function auditFile(file) {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, "utf8");
    const syntax = syntaxOk(file);
    const nonAscii = /[^\x00-\x7F]/.exec(content);
    const findings = [];

    for (const pattern of REVIEW_PATTERNS) {
        if (pattern.regex.test(content)) findings.push(pattern.name);
        pattern.regex.lastIndex = 0;
    }

    return {
        file: rel,
        syntax: syntax.ok,
        syntaxError: syntax.ok ? null : syntax.error,
        ascii: !nonAscii,
        asciiIndex: nonAscii ? nonAscii.index : -1,
        reviewFindings: findings,
    };
}

const files = getFiles(rootDir);
const results = files.map(auditFile);
const syntaxErrors = results.filter((r) => !r.syntax);
const asciiErrors = results.filter((r) => !r.ascii);
const reviewHits = results.filter((r) => r.reviewFindings.length);

const report = {
    generatedBy: "scripts/securityAudit.mjs",
    scannedFiles: results.length,
    syntaxErrors: syntaxErrors.length,
    asciiErrors: asciiErrors.length,
    filesNeedingSecurityReview: reviewHits.length,
    syntaxFailures: syntaxErrors,
    asciiFailures: asciiErrors,
    reviewFindings: reviewHits,
};

console.log(JSON.stringify(report, null, 2));

if (syntaxErrors.length > 0 || asciiErrors.length > 0) process.exitCode = 1;
