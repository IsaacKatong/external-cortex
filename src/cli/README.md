# CLI

Entrypoint for the `external-cortex` command published to npm.

- `index.ts` — subcommand dispatcher invoked by `bin/cli.js`.
- `preflight.ts` — checks required host tools (`gh`, `git`) before running commands that need them.
- `packageRoot.ts` — resolves the installed package directory, so Vite and deploy commands run against the shipped source, not the user's cwd.
