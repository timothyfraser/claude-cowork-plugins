---
name: canvas-faculty
description: How to use the SysEng Canvas Faculty Assistant (the ask_canvas tool) to answer questions about the user's OWN Cornell Canvas courses and students — listing courses, rosters, student search, cross-course overlap, grade trajectory, and assignment analytics. Use whenever a Cornell Systems Engineering faculty member asks about their Canvas courses, their students, grades, submissions, or course analytics. FERPA-sensitive — prefer aggregates.
---

# Canvas Faculty Assistant

The `ask_canvas` tool answers questions about **the user's own** Cornell Canvas courses and
students. It runs a Cornell-hosted agent with read-only Canvas tools, scoped to the user's
personal Canvas token, so it only ever sees courses where the user is a teacher/TA/designer.

## When to use it
- The user asks about **their** Canvas: how many courses they teach, who is in a course,
  finding a student, students shared across courses, a student's grade trajectory, or
  per-assignment analytics (means, submission/late rates).
- Prefer it for anything that needs *live* Canvas data for the user's own courses.

## How to ask
- Pass the user's question (or a faithful paraphrase) as `question`. Specifics help —
  include a course ID, term, student name/NetID, or assignment when known.
- Relay the returned `answer`. If the user asked for a count or list, surface it directly.

## FERPA / privacy (important)
- This is student data. **Prefer aggregates** (counts, rates, distributions) over dumping
  full rosters or per-student grades.
- Do **not** copy student names, NetIDs, or grades into files, artifacts, web searches, or
  other tools unless the user explicitly asks for an export.
- The assistant is read-only and scoped to the user; it cannot see other faculty's data
  and cannot modify Canvas.

## Examples
- *"How many courses am I teaching this term?"* → count + a couple of course names.
- *"List students in course 12345."* → roster (relay concisely; avoid re-pasting elsewhere).
- *"Assignment analytics for course 12345"* → per-assignment means / submission / late rates.
- *"Which students are in both course 111 and 222?"* → overlap list.

## Caveats
- If you see a **403** the cohort gate key is wrong/missing; a **401** means the user's
  Canvas token is missing or expired — point them to the plugin settings / ONBOARDING.md.
- Canvas data is live; large rosters may take a few seconds.
