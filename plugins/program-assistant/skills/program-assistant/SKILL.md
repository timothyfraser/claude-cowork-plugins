---
name: program-assistant
description: How to use the Cornell Systems Engineering Program Assistant (the ask_program tool) — when to call it, how to phrase questions, and how to invoke named /skills. Use whenever a user asks about Cornell Systems Engineering courses, faculty, degree requirements, forms, deadlines, pathways, contacts, or "who do I talk to about X".
---

# Systems Engineering Program Assistant

The `ask_program` tool answers questions about the Cornell Systems Engineering graduate program from a curated, Cornell-hosted knowledge base (course roster, faculty directory, program website, official forms). Answers are **grounded with [n] citations**; if the corpus doesn't contain the answer, the assistant says so and points to who to ask — it does not invent facts.

## When to use it
- Any question about SysEng **courses** (offerings, instructors, terms), **faculty** (research, who teaches what), **degree/pathway requirements**, **forms & deadlines**, **processes** (transfers, petitions), or **who to contact** for something.
- Prefer it over answering from memory — it reflects the *current* program corpus and cites sources.

## How to ask
- Pass the user's question (or a faithful paraphrase) as `question`. Specifics help: include the term, course code, person, pathway, or degree when known.
- Relay the returned `answer` to the user and keep the `[n]` citations; surface the `sources` if the user wants to verify.

## Named skills (/name)
Include `/skill-name with [keywords]` in the question to run a structured workflow. Available skills:
`/course-planning`, `/pathway-requirements`, `/compare-pathways`, `/degree-plan`, `/faculty-finder`, `/thesis-advisor`, `/who-to-contact`, `/forms-and-deadlines`, `/process-walkthrough`, `/capstone-examples`, `/career-paths`.

Examples:
- `Use skill /who-to-contact with financial aid` → returns Who/Role/How-to-reach/What-to-include.
- `/course-planning optimization Fall 2026 mornings` → filtered course table.
- `/forms-and-deadlines graduation` → checklist of forms, where to submit, deadlines.

## Caveats
- Time-sensitive info (deadlines, schedules, requirements) should be confirmed on the official program page or with staff — the assistant flags this.
- It only knows the program corpus; for university-wide topics (housing, dining, parking) it will correctly decline and redirect.
