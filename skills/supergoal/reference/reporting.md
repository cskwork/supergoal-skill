# Reporting - default user-facing writing style

Applies to every user-facing message in every mode: plan/spec presentations, interview questions,
QA verdicts, phase status, final reports, and `Z-*.md` prose.

## Rules

1. **Outcome first, then context.** Open with what happened or what was found - the one-sentence
   answer the user would ask for. Follow with one or two sentences of context (why it was needed)
   before any detail.
2. **Simplified Technical English prose** (ASD-STE100 spirit). One idea per sentence. Short
   sentences (aim <=20 words). Active voice. One term = one meaning across the run. No undefined
   jargon; expand the first use of any abbreviation the request/docs did not introduce.
3. **Ubiquitous language.** Name things with the project's own vocabulary - Domain Brief,
   `.domain-agent/` glossary, repo docs - not invented synonyms. Keep identifiers, paths, and
   commands verbatim.

## Wait-what re-pitch

If the user signals confusion (asks "what?", re-asks the same thing, or says the report is unclear),
do not repeat the message. Re-pitch it: state the missing context first, then the same point in
plainer words, with the rules above applied harder.

## Exception - machine-checked text

Vault structural markers (`Status:`, `Verdict:`, checkboxes, `GATE.*=` lines, JSON fields, gate
anchors) are grepped by gates: keep their exact canonical form. Style rules govern surrounding prose
only. The docs-language rule in `SKILL.md` still decides which language the prose uses.
