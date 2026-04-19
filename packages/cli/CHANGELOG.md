# @docubook/cli

## 0.4.3

### Patch Changes

- 43813f0: Fix scaffold installer runtime errors in CLI

## 0.4.2

### Patch Changes

- a6e93c8: release @docubook/cli v0.4.2
  - fix : add version flag description to CLI version command
  - chore : Helpful messages from pnpm when an update error occurs.
  - fix : prevent temp dir leaks, use portable paths, harden install commands
  - fix : prevent duplicate commands, validate template early
  - fix : validate directoryName early, guard undefined/null, throw on cancel
  - fix : pnpm manual command and improve package manager detection

## 0.4.1

### Patch Changes

- fix : only show 5 lines of changelog from release body

## 0.4.0

### Minor Changes

- 6bd3c30: Add package-manager-aware scaffolding output and persist detected package manager in
  generated project config.
