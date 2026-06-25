# TEACH interactive lesson scaffold

Shipped starter so every TEACH lesson is interactive and looks like one course,
instead of being hand-rolled per workspace. `reference/teach.md` is the authority;
this is the reusable material it copies in.

## What gets copied where

On the **first lesson** in a topic workspace, copy `assets/` into
`teach/<topic>/assets/`:

| File | Role | Reused by |
|---|---|---|
| `assets/lesson.css` | Shared stylesheet: design tokens, light/dark, a11y focus, quiz styles, and the **book layout** (left TOC + horizontal page-turn). Tufte-influenced Expressive baseline. | Every lesson |
| `assets/lesson-book.js` | Zero-dependency book engine. Turns each `<section>` into a page flipped via prev/next, arrow keys, swipe, or TOC click; builds the left TOC + pager. | Every lesson |
| `assets/quiz.js` | Zero-dependency quiz widget. Hydrates `.sg-quiz` blocks; instant feedback; randomizes option order so the correct slot never leaks. | Every lesson |
| `assets/lesson-template.html` | Lesson skeleton: `main.book` shell wiring css + book engine + quiz + a simulator mount point. Duplicate it to `teach/<topic>/lessons/NNNN-slug.html` and fill in. | Each new lesson |

Topic-specific interactive parts (a visualizer/simulator) are written as
`teach/<topic>/assets/<topic>-viz.js` and mounted in the lesson's `#viz` node.
Reuse the shared files; never inline-duplicate a future lesson would share.

## Book layout (left TOC + horizontal page-turn)

Lessons read like a book, not a long scroll: a left table of contents jumps to any
section, and the reader flips left/right between pages. Author it by wrapping each
page in a `<section>` inside `.pages-track`:

```html
<main class="book">
  <aside class="toc"></aside>
  <div class="pages"><div class="pages-track">
    <section id="intro" data-title="시작"><div class="page-inner"> … </div></section>
    <section id="terms" data-title="핵심 용어"><div class="page-inner"> … </div></section>
  </div></div>
  <nav class="pager"></nav>
</main>
<script src="../assets/quiz.js"></script>
<script src="../assets/lesson-book.js"></script>
```

- Each `<section>` needs an `id` (hash deep-link) and `data-title` (TOC label;
  falls back to its first heading). Wrap content in `.page-inner` for a readable
  measure. `lesson-book.js` builds the TOC + pager from the sections.
- One idea per page; keep pages inside working memory. Each concept earns a page
  that develops it fully — definition, why, how, worked example, common trap — not
  a one-line restatement of the glossary table. The terms table is an index; the
  teaching happens on the concept pages. Narrow scope into more lessons before
  thinning a concept's explanation.
- The interactive element (simulator/quiz) earns its own page so the reader
  *does*, not just reads.
- Navigation is keyboard-operable (←/→, Home/End) and arrow keys are ignored while
  typing in a simulator input. Honors `prefers-reduced-motion` (no slide).

## Standards each lesson must meet

- `reference/ui-ux.md` Expressive baseline (the default for all user-facing UI).
- `reference/engagement.md` micro-interaction feedback: every interactive element
  gives immediate hover/active/correct/incorrect feedback tied to a real action.
- WCAG 2.2: visible focus, keyboard-operable, min 44px targets, reduced-motion
  fallback. All present in `lesson.css`/`quiz.js` — keep them when you adapt.

## Quiz markup contract

```html
<div class="sg-quiz" data-explain="why the correct answer is right">
  <p class="sg-q">Question?</p>
  <ul class="sg-options">
    <li data-correct>Correct option</li>
    <li data-hint="nudge shown on miss">Distractor</li>
    <li>Distractor</li>
  </ul>
</div>
```

Keep every option the same length in words where possible (quiz hygiene); the
widget shuffles order on load, so do not encode the answer by position.
