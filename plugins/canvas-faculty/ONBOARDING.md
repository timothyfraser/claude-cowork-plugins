# Canvas Faculty Assistant — faculty onboarding (no coding required)

This guide gets you set up to ask Claude about **your own** Cornell Canvas courses and
students. It takes about 5 minutes. You will paste two things into the plugin's settings:
**your Canvas token** and a **gate key**. You never write any code.

> Why two secrets? The **gate key** is a shared password that lets the program's Canvas
> assistant accept your request at all. Your **Canvas token** is personal — it makes the
> assistant act *as you*, so you only ever see *your own* courses and students (this is
> required under FERPA). Both stay only on your computer.

---

## Step 1 — Get your personal Canvas API token

1. Sign in to Cornell Canvas: **https://canvas.cornell.edu**
2. Click **Account** (your photo, top-left) → **Settings**.
3. Scroll to **Approved Integrations** → click **+ New Access Token**.
4. **Purpose:** type something you'll recognize, e.g. `SysEng Canvas Assistant (Cowork)`.
5. **Expires:** leave blank for no expiry, or set a date (you can always make a new one).
6. Click **Generate Token**.
7. **Copy the token now** — Canvas shows the full token only once. It looks like a long
   string of letters, numbers, and `~`. Keep it somewhere safe for the next step.

> Lost it / closed the window? Just delete that token in Approved Integrations and make a
> new one. A token only ever sees what *you* can see in Canvas.

---

## Step 2 — Get the gate key

Ask the **program administrator** (Tim Fraser, tmf77@cornell.edu) for the **Canvas gate key**.
It is a shared secret for the faculty group. Do not post it anywhere public.

---

## Step 3 — Add the plugin and paste your secrets

**In Claude Cowork:** add the **SysEng Canvas Faculty Assistant** plugin (or install the
`canvas-faculty.mcpb` in Claude Desktop: **Settings → Extensions → Install Extension**).

When prompted (or in the plugin's **Settings**), fill in three fields:

| Field | What to paste |
|---|---|
| **Canvas faculty webhook URL** | `https://n8n-dev.lcmain.aaii.cucloud.net/webhook/canvas-faculty` |
| **Your Canvas API token (X-Canvas-Token)** | the token you copied in Step 1 |
| **Gate key (X-Gate-Key)** | the gate key from Step 2 |

Save. Your secrets are stored only on your machine (in your OS keychain).

---

## Step 4 — Try it

Ask Claude something like:

- *"How many courses am I teaching this term?"*
- *"List the students in course 12345."*
- *"Show me assignment analytics for my data science course."*
- *"Which students are enrolled in both course 111 and course 222?"*

You should get an answer drawn from **your** Canvas data only.

---

## Troubleshooting

| Message | What it means | Fix |
|---|---|---|
| **Gate rejected (403)** | the gate key is missing or wrong | re-check the **Gate key** field; ask the administrator for the current value |
| **Unauthorized (401)** | your Canvas token is missing or was rejected | re-check the **Canvas API token** field; if it expired, make a new one (Step 1) |
| *"token invalid or expired"* in the answer | your Canvas token no longer works | generate a new token (Step 1) and paste it again |

## Privacy & safety

- Your Canvas token and the gate key **never leave your computer** except as headers sent
  to the Cornell-hosted webhook over HTTPS.
- The assistant is **read-only** and **scoped to you** — it cannot see other faculty's
  courses or students, and it cannot change anything in Canvas.
- It avoids exporting student names, NetIDs, or grades unless you explicitly ask for an
  export, in keeping with FERPA.
- If you ever think your token leaked, delete it in Canvas (**Account → Settings →
  Approved Integrations**) and generate a new one.
