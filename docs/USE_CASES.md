# What the Systems AI Bot Can Do — A Guide for Program Staff & Faculty

**Audience:** Cornell Systems Engineering staff and faculty. No coding needed for any of this.
**Questions:** Tim Fraser — tmf77@cornell.edu
**Want it installed?** See the companion [Install Checklist](INSTALL_CHECKLIST.md) — you can hand that document straight to Claude and it will walk you through setup.

The "Systems AI Bot" is really a small family of assistants. Each one does a different job. Here's what each one is, what to ask it, and what it will never do.

---

## 1. Ask questions about the program (the Program Assistant)

**What it is:** A question-answering assistant inside Claude that knows the Systems Engineering program — courses, faculty, pathways, forms, deadlines, contacts — from the program's own official documents and website.

**What makes it trustworthy:**
- Every answer comes **only** from the program's curated knowledge base, with numbered citations like `[1]` so you can see exactly which source it used.
- If the answer isn't in the sources, it **says so and declines** instead of guessing. No made-up answers.
- Everything runs on Cornell servers. Nothing goes to outside AI companies.

**Things to try asking:**
> *"Ask the program assistant: what classes are offered in Fall 2026?"*
> *"Ask the program assistant: who is the director of the program and how do I contact them?"*
> *"Ask the program assistant: what forms does a student need to add a minor?"*

**Power feature — built-in skills.** Include a `/skill-name` in your question to get a purpose-built answer format:

| Skill | Use it for |
|---|---|
| `/who-to-contact` | "Who handles X?" questions |
| `/course-planning` | Helping a student plan a semester |
| `/pathway-requirements` | What a specific pathway requires |
| `/compare-pathways` | Side-by-side pathway comparison |
| `/degree-plan` | Sketching a full degree plan |
| `/faculty-finder` | Finding faculty by research area |
| `/thesis-advisor` | Advisor-matching questions |
| `/forms-and-deadlines` | Which form, which deadline |
| `/process-walkthrough` | Step-by-step "how do I…" processes |
| `/capstone-examples` | Example M.Eng. projects |
| `/career-paths` | What graduates go on to do |

Example: *"Ask the program assistant: use skill /who-to-contact with financial aid."*

**What it won't do:** It doesn't know individual students' records, grades, or anything not in the program's public/official documents. It will decline questions outside its sources.

---

## 2. Email drafts written for you (the Email Responder)

**What it is:** A behind-the-scenes helper that watches your Cornell inbox for **routine program questions** (the kind covered by the program's official info — "what courses are offered," "which form do I need," "who do I contact about X") and quietly writes a **draft reply** for you.

**There is nothing to install.** Once your mailbox is enrolled (ask Tim), it just works.

**How it behaves — the important part:**
- ⏱️ It checks for new unread mail about every **5 minutes**.
- 📝 When it finds a routine program question, it writes a reply — grounded in the same cited knowledge base as the Program Assistant — and saves it to **your Drafts folder** (Outlook web/desktop, under Drafts).
- 🚫 **It never sends anything.** Ever. You open the draft, edit it if you like, and *you* click send — or delete it.
- 🙅 **It leaves everything else alone.** Advising cases, grades, complaints, anything personal, sensitive, or ambiguous is left untouched for you to handle. Non-program mail (admin, IT, newsletters, spam) is ignored.
- 👀 Your mail is read only inside Cornell's systems; question-answering runs on Cornell's own AI gateway.

**How to try it:** Send yourself an email like *"What classes are offered in Fall 2026?"*, leave it unread, and check your Drafts folder ~5 minutes later.

**Enrollment is strictly opt-in**, one person at a time — tell Tim if you want in (or out; removal is instant).

---

## 3. Your email & calendar inside Claude (the Outlook connector)

**What it is:** A connector that lets you work with **your own** Outlook mail and calendar from a Claude conversation. You sign in with your own Cornell NetID (the normal Microsoft login screen, with Duo) — Claude only ever sees what you can see.

**Things to try asking:**
> *"List my 5 most recent emails."*
> *"Search my email for the message about the faculty meeting and summarize it."*
> *"What's on my calendar tomorrow?"*
> *"Draft a reply to the latest email from [name] saying I'll get back to them Friday."*

**What it won't do:** It saves drafts and creates tentative events, but sending mail is up to you, and it cannot delete events by design.

---

## 4. Your Smartsheet inside Claude (the Smartsheet connector)

**What it is:** A connector that lets Claude look things up in **your own** Smartsheet account — your sheets, your workspaces, and only what's shared with *you*. It uses a personal access token that you create in your own Smartsheet settings (5-minute, no-code setup — the Install Checklist walks you through it).

**Things to try asking:**
> *"Use smartsheet_whoami"* (confirms it's acting as you)
> *"List my Smartsheets."*
> *"Search my Smartsheet for 'orientation' and show me what you find."*
> *"Open the [sheet name] sheet and summarize what's in it."*

**Optional editing:** Out of the box it's **read-only**. There's a switch in the plugin settings ("Allow write actions") that, if *you* turn it on, also lets Claude add, update, or delete rows on your behalf. Leave it off if you only want lookups.

**Don't have Smartsheet or a token?** Then this connector simply isn't for you — skip it. Everything else works fine without it.

---

## 5. Your Canvas courses inside Claude (faculty)

**What it is:** For faculty — ask questions about **your own** Canvas courses and students ("which of my students haven't submitted assignment 2?", "how is the class doing on quizzes?"). It runs as *your* Canvas identity via your own Canvas token, so you only ever see your own courses — that's what keeps it FERPA-appropriate.

Ask Tim if you want this one; it needs one extra key from him plus your own Canvas token.

---

## The security posture, in plain words

- **You are always you.** Every connector acts with *your* login or *your* token — never a shared account. Person A can never see person B's mail, sheets, or students.
- **Your tokens stay on your machine**, in your operating system's secure storage. They're never emailed, never in shared files.
- **All AI runs on Cornell infrastructure** (the program's n8n server + Cornell's AI gateway). Program and student data never goes to outside AI providers.
- **Nothing is ever sent on your behalf.** Email replies are drafts; you review and send.
- **Read-only by default.** Anything that can change data (Smartsheet writes) is behind a switch you personally turn on.

---

*Mirrored from the (private) Systems Engineering AI suite repo — edits happen there first. Last verified working: 2026-07-08.*
