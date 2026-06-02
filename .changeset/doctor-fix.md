---
"solvrae": minor
"@solvrae/scaffold": minor
---

`solvrae doctor` now runs real diagnostics and supports `--fix`. It checks the
shared theme exists, that each `ui-<family>/components.json` points `tailwind.css`
at the shared theme, and that every app consuming a `ui-<family>` package also
depends on `@scope/ui-theme`. Each issue carries a fix Action; `--fix` applies them
through the executor. Adds `collectDiagnostics` / `runDoctorChecks` to
`@solvrae/scaffold`. Verified end-to-end: a repo with a drifted `components.json`
css path and an app missing its theme dependency is detected and repaired.
