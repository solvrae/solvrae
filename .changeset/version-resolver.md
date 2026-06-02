---
"@solvrae/core": minor
"@solvrae/adapter-next": minor
"create-solvrae": minor
---

Add registry-backed version resolution. Adapters now declare dependencies as
`{ range, baseline }`; at scaffold time the engine queries the npm registry for the
highest version satisfying the range and writes it as an **exact pin**, falling back
to the baseline when the registry is unreachable. Adds `VersionResolver`,
`createRegistryResolver`, `offlineResolver`, and `resolveAll` to `@solvrae/core`
(depends on `semver`); adapter planning methods may now be async; `create-solvrae`
gains `--offline`. Generated repos get the latest known-good versions, reproducibly.
