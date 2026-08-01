#!/usr/bin/env node
// /supergoal TEACH lesson gate -- the executable exit check that a generated lesson is an
// INTERACTIVE teaching unit, not a reading-only document. reference/teach.md already says
// "Reading-only HTML is not a lesson" and ships a scaffold (templates/teach/assets/), but nothing
// enforced it, so real lessons drifted into beautiful static articles (inline <style>, one long
// <article> scroll, a promised "이해 점검" that never renders). This gate removes that failure mode.
//
// It deterministically rejects a lesson that is:
//   - off-scaffold      : does not link the shared assets/lesson.css + quiz.js + lesson-book.js
//   - a long scroll     : has no .book page shell (.pages-track + .pager + >=2 data-title sections)
//   - reading-only      : ships no hydrated .sg-quiz with a data-correct option (nothing to *do*)
//
// The agent cannot fudge these -- the markup either wires the scaffold and a working quiz, or it
// does not. NEVER edit this script to make a failing lesson pass; fix the lesson instead.
//
// Usage: teach-lesson-gate.mjs <lesson.html | lessons-dir> [more...]
//   Each argument is a lesson HTML file or a directory (scanned shallowly for *.html).
//   Exit 0 = every lesson clears every check.
//   Exit 1 = at least one lesson is reading-only / off-scaffold.
//   Exit 2 = usage error / no lessons found.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function usage(message) {
  if (message) process.stderr.write(`teach-lesson-gate: ${message}\n`);
  process.stderr.write("usage: teach-lesson-gate.mjs <lesson.html | lessons-dir> [more...]\n");
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage("missing lesson path");

// Collect .html files from the given files and directories (directories scanned shallowly,
// matching the flat teach/<topic>/lessons/ layout).
const files = [];
for (const arg of args) {
  if (!existsSync(arg)) usage(`path not found: ${arg}`);
  const stat = statSync(arg);
  if (stat.isDirectory()) {
    for (const name of readdirSync(arg)) {
      if (name.toLowerCase().endsWith(".html")) files.push(join(arg, name));
    }
  } else if (arg.toLowerCase().endsWith(".html")) {
    files.push(arg);
  } else {
    usage(`not an .html file or directory: ${arg}`);
  }
}
if (files.length === 0) usage("no .html lessons found in the given path(s)");

console.log("== /supergoal TEACH lesson gate ==");
console.log(`lessons: ${files.length}`);

const count = (html, re) => (html.match(re) || []).length;

let failed = 0;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const problems = [];

  // 1. a real, localized HTML document
  if (!/<html[\s>]/i.test(html) || !/<\/html>/i.test(html)) {
    problems.push("not a complete HTML document (<html> ... </html>)");
  }
  if (!/<html[^>]*\blang\s*=/i.test(html)) {
    problems.push("missing <html lang=...> (a11y / i18n)");
  }

  // 2. built from the shared scaffold, not hand-rolled (the "looks like one course" rule)
  if (!/<link\b[^>]*\blesson\.css\b[^>]*>/i.test(html)) {
    problems.push(
      "does not link the shared assets/lesson.css -- build from templates/teach/assets, do not inline a one-off stylesheet",
    );
  }
  if (!/<script\b[^>]*\blesson-book\.js\b[^>]*>/i.test(html)) {
    problems.push("does not load assets/lesson-book.js (book-layout engine)");
  }
  if (!/<script\b[^>]*\bquiz\.js\b[^>]*>/i.test(html)) {
    problems.push("does not load assets/quiz.js (interactive quiz engine)");
  }

  // 3. a paged book shell, not one long scroll
  if (!/<main\b[^>]*class\s*=\s*["'][^"']*\bbook\b/i.test(html)) {
    problems.push('no <main class="book"> shell -- a lesson is a paged book, not a long <article> scroll');
  }
  if (!/\bpages-track\b/.test(html)) {
    problems.push("no .pages-track page container found");
  }
  if (!/class\s*=\s*["'][^"']*\bpager\b/i.test(html)) {
    problems.push("no .pager (prev/next navigation) found");
  }
  const pages = count(html, /<section\b[^>]*\bdata-title\s*=/gi);
  if (pages < 2) {
    problems.push(`only ${pages} <section data-title> page(s); a book lesson needs >= 2 pages`);
  }

  // 4. at least one hydrated, answerable quiz -- the "user must DO something" requirement
  const quizzes = count(html, /class\s*=\s*["'][^"']*\bsg-quiz\b/gi);
  const correct = count(html, /\bdata-correct\b/gi);
  const promisesCheck = /이해\s*점검|이해\s*확인|미니\s*퀴즈|\bquiz\b/i.test(html);
  if (quizzes === 0) {
    problems.push(
      promisesCheck
        ? "promises a check/quiz in prose but ships no .sg-quiz -- reading-only HTML is not a lesson"
        : "no interactive .sg-quiz block -- reading-only HTML is not a lesson",
    );
  } else {
    if (!/\bsg-options\b/.test(html)) {
      problems.push(".sg-quiz present but has no .sg-options list");
    }
    if (correct === 0) {
      problems.push(".sg-quiz present but no option marked data-correct -- the quiz cannot be answered");
    }
  }

  if (problems.length === 0) {
    console.log(`  PASS  ${file}`);
  } else {
    failed++;
    console.log(`  FAIL  ${file}`);
    for (const problem of problems) console.log(`        - ${problem}`);
  }
}

console.log(`  checked ${files.length} lesson(s), ${failed} failed`);
if (failed > 0) {
  console.error(
    `TEACH-LESSON-GATE FAIL: ${failed} lesson(s) are reading-only or off-scaffold -- rebuild from templates/teach/assets; never weaken this gate`,
  );
  process.exit(1);
}
console.log("== TEACH LESSON GATE PASS ==");
