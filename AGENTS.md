<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# MomCare — how work is done here

`CLAUDE.md` in this repository holds the frontend conventions. The **method** —
how changes are verified, tested and committed across this project — lives in
`../backend/AGENTS.md`, and applies to this repository too. Read it.

The points that bite most often on this side:

- **This is a separate repository from the backend** (`momcare_web` and
  `momcare-backend`). Never mix their changes in one commit.
- **Never commit or push without being told to in that same message**, and never
  add an AI tool as author or co-author.
- **`NEXT_PUBLIC_*` is compiled into the bundle at build time.** Changing it in
  Vercel does nothing until a redeploy with the build cache **disabled**. A
  cached build keeps calling the previous host, and the setting page will show
  the new value the whole time.
- **Read form fields from the form, not from React state.** A password manager
  fills inputs without firing the events React listens for, so a controlled
  input can be visibly full while its state is empty. `login/page.tsx` reads
  `FormData` at submit for this reason.
- **The region map in `src/features/hospital-onboarding/regions.ts` is a
  display-only mirror** of the backend's `core/common/regions.py`. A backend
  test parses this file and fails if one country disagrees. Edit both.
- Before committing: `npx tsc --noEmit` and `npx vitest run`. The pre-commit
  hook runs prettier, typegen, typecheck and the full suite anyway.
