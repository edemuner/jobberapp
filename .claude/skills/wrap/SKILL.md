---
name: wrap
description: Wrap up the current work session in this repo — ensure new/changed code has real unit test coverage, run the affected service's test suite until it passes with 100% coverage (where applicable), then commit and push to main. Use when the user says /wrap, "wrap up", or asks to finish a session with full test coverage before committing.
---

# /wrap

Jobberapp is a personal study project; commits go straight to `main` (no
ticket-branch requirement — see the repo's CLAUDE.md). This skill closes out
a work session: it turns whatever uncommitted/unpushed work exists into a
tested, committed, pushed state.

**Never commit failing tests. Never commit to fake coverage** (no
`istanbul ignore`, no deleting assertions, no weakening
`coverageThreshold` just to make a number turn green). If 100% truly can't
be reached for a piece of code, that's a judgment call to surface to the
user, not to paper over.

## Steps

### 1. Find the scope of "current progress"

Run `git status` and `git diff` (staged + unstaged) at the repo root, plus
check untracked files. Identify which service directories are touched
(e.g. `2-notification-service`, `9-jobber-shared`, or any future numbered
service) — a "service" here means any directory with its own
`package.json` and a `test` script.

If the working tree is clean and local `main` matches `origin/main`,
report that there's nothing to wrap and stop.

### 2. Baseline

For each affected service, run its existing test script (e.g.
`npm test`, which in this repo maps to
`jest --coverage=true -w=1 --forceExit --detectOpenHandles=true --watchAll=false`)
to confirm the starting point: do existing tests pass, and what's the
current coverage summary (statements/branches/functions/lines)?

If existing tests are already failing, fix those first — that's a
prerequisite, not part of "new" coverage work. Use the
`superpowers:systematic-debugging` skill if the failure's cause isn't
immediately obvious; don't guess-and-check.

### 3. Identify what needs tests

Within each affected service, list the **non-test** source files that are
new or changed (`git diff --name-only` / untracked, filtered to
`src/**/*.ts` excluding anything under a `test/` folder). Cross-reference
against the coverage report to see which of those files/lines/branches
aren't already covered.

"If applicable" carve-outs — don't force unit tests onto things that
aren't meaningfully unit-testable, e.g.:
- pure bootstrap/wiring files that just call `app.listen()` or start a
  process, with no branching logic of their own
- type-only files (interfaces, `.d.ts`)
- files already excluded via `jest.config.ts`'s `collectCoverageFrom`

If you decide something is a carve-out, say so explicitly in the final
report — don't silently exclude it. Everything else with real logic
(consumers, transports, config parsing, helpers, error handling branches)
should get real tests.

### 4. Write tests, following this repo's existing conventions

Match the style already established (see
`2-notification-service/src/queues/test/email.consumer.test.ts`):
- `jest.mock(...)` external/internal modules at the top of the file
- `beforeEach(() => jest.resetAllMocks())` / `afterEach(() => jest.clearAllMocks())`
- `describe` per function/module, `it` per behavior
- `jest.spyOn(...).mockReturnValue(...)` for stubbing return values
- assert both the *outcome* and the *calls made to collaborators*
  (`toHaveBeenCalledWith`, `toHaveBeenCalledTimes`)

Use the `superpowers:test-driven-development` skill's discipline: write a
test that actually exercises the missing branch/behavior (not just a hit
for coverage), watch it fail for the right reason if the code path is
genuinely untested, then confirm it passes.

### 5. Iterate to 100%

Re-run the service's test script with coverage after each batch of new
tests. Repeat step 4 for whatever's still short. Stop iterating once:
- all tests pass, AND
- coverage is 100% across statements/branches/functions/lines for that
  service (excluding any explicitly-noted carve-outs from step 3).

### 6. Commit and push

Stage the affected service's changed/added source and test files (and any
config touched to make this possible, e.g. `jest.config.ts`,
`tsconfig.json`). Use `git status` after staging to sanity-check nothing
unintended (secrets, unrelated files) got swept in.

Write a Conventional Commit message per this repo's rules
(`<type>(<scope>): <description>`, e.g.
`test(notification-service): cover mail transport error paths`). Pick
`test` if the commit is purely about coverage, or `feat`/`fix` if writing
the tests surfaced and required a real code change.

Commit directly to `main` (no ticket branch needed in this repo), then
`git push origin main`.

### 7. Report back

Summarize: which files gained coverage, the before/after coverage
numbers, any carve-outs and why, the commit SHA, and a link to the commit
(`https://github.com/edemuner/jobberapp/commit/<sha>`).
