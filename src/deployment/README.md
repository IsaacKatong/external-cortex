# Deployment

Handles deploying External Cortex as a hosted website. Each subdirectory implements deployment logic for a specific hosting backend defined in `src/config/hosting.ts`.

## Supported Backends

- **github-pages/** - Deploys to a newly created GitHub repository with GitHub Pages enabled.
