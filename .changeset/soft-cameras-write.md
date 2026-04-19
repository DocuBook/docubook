---
"@docubook/cli": patch
---

release @docubook/cli v0.4.2

- fix : add version flag description to CLI version command
- chore : Helpful messages from pnpm when an update error occurs.
- fix : prevent temp dir leaks, use portable paths, harden install commands
- fix : prevent duplicate commands, validate template early
- fix : validate directoryName early, guard undefined/null, throw on cancel
- fix : pnpm manual command and improve package manager detection