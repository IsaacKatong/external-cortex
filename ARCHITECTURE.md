# External Cortex Architecture

External Cortex functions as an augment to a person's brain, helping them think and understand. It serves as a dump for information from various sources (TikTok, YouTube, Reddit, Twitter, etc.). Once inside External Cortex, users can assign tags and connections to detail the significance of their information.

A separate project, **GraphSect**, handles rendering of the user's information. External Cortex displays what GraphSect shows along with filters, settings, and interfaces for creating/editing datums.

## External Storage

External Cortex connects to external storage where information is held.

**Supported storage (v1):**
- **GitHub** - stores the graph (JSON)
- **Google Docs** - stores media

This will expand to additional storage providers in the future.

## Data Model

There are 6 core objects, stored as JSON externally and loaded into a local SQLite DB on launch.

### Datum

The information (TikTok, YouTube, Reddit, etc.) the user dumps into the software.

### Edge

The links between datums.

### DatumTag

Identifies what groups a datum belongs to.

### DatumDimension

Datums can optionally have numeric dimensions to provide additional information about them (time, price, weather, etc.).

### DatumTagAssociations

A datum tag can be associated to any number of tags. If tag A is associated to tag B, then all datums with tag A also have tag B. Functions as a tag hierarchy.

### EdgeTag

Identifies what groups an edge belongs to.

## Data Flow

1. JSON data is stored externally (GitHub or other supported source)
2. On launch, External Cortex loads the JSON into a local SQLite DB for easier querying
3. The DB contents are sent to GraphSect for rendering
4. External Cortex displays the GraphSect output alongside filters, settings, and datum creation/editing interfaces

### Initial Load (External Source -> SQLite -> GraphSect -> UI)

```
┌───────────────────────┐
│   External Storage    │
│ (GitHub, Google Docs) │
└───────────┬───────────┘
            │
            │  1. Fetch JSON on launch
            ▼
┌───────────────────────┐
│    External Cortex    │
│    (Load & Parse)     │
└───────────┬───────────┘
            │
            │  2. Insert parsed objects
            │     (Datum, Edge, DatumTag,
            │      DatumDimension,
            │      DatumTagAssociations,
            │      EdgeTag)
            ▼
┌───────────────────────┐
│       SQLite DB       │
└───────────┬───────────┘
            │
            │  3. Query and send data
            ▼
┌───────────────────────┐
│       GraphSect       │
│   (Rendering Engine)  │
└───────────┬───────────┘
            │
            │  4. Rendered graph output
            ▼
┌───────────────────────┐
│          UI           │
│  (Graph + Filters +   │
│   Settings + Editor)  │
└───────────────────────┘
```

### User Edits (UI -> SQLite -> External Source)

```
┌───────────────────────┐
│          UI           │
│  (Create/edit datum,  │
│   tag, edge, etc.)    │
└───────────┬───────────┘
            │
            │  1. User submits change
            ▼
┌───────────────────────┐
│    External Cortex    │
│  (Validate & Process) │
└───────────┬───────────┘
            │
            │  2. Write change to DB
            ▼
┌───────────────────────┐
│       SQLite DB       │
└───────────┬───────────┘
            │
            │  3. Sync updated JSON
            ▼
┌───────────────────────┐
│   External Storage    │
│ (GitHub, Google Docs) │
└───────────────────────┘
```

### Full Round-Trip

```
┌──────────────┐ 1. Fetch  ┌──────────────┐ 2. Store  ┌──────────────┐
│   External   │──────────>│   External   │──────────>│    SQLite    │
│   Storage    │           │    Cortex    │           │      DB      │
└──────────────┘           └──────────────┘           └──────┬───────┘
       ▲                                                     │
       │                                                3. Query
       │                                                     │
       │                                                     ▼
       │                                              ┌──────────────┐
       │                                              │   GraphSect  │
       │                                              │  (Renderer)  │
       │                                              └──────┬───────┘
       │                                                     │
       │                                                4. Render
       │                                                     │
       │                                                     ▼
       │                                              ┌──────────────┐
       │                  5. User edits               │      UI      │
       │              ┌───────────────────────────────┤ (Graph View  │
       │              │                               │ + Controls)  │
       │              ▼                               └──────────────┘
       │   ┌──────────────────┐
       │   │  External Cortex │
       │   │(Validate & Sync) │
       │   └────┬─────────────┘
       │        │
       │        │  6. Write to SQLite DB
       │        │  7. Sync JSON to storage
       │        │
       └────────┘
```

## Configuration

External Cortex stores user configuration at `~/.external-cortex/config.json`. The file is a JSON map where each key is a user-defined name for a configuration and each value is the configuration object for that instance. This allows a single user to host multiple External Cortex sites simultaneously with different settings.

### Config File Format

```json
{
  "default": {
    "storageType": "LOCAL",
    "localStorageDirectory": "local-storage",
    "hostingType": "GITHUB_PAGES",
    "uiStyle": "BASIC_JSON",
    "githubRepoName": "",
    "password": "",
    "colors": { "textPrimary": "#e0e0e0", "textSecondary": "#a0a0a0", "background": "#1a1a1a", "border": "#444444", "accent": "#6cb4ee" }
  },
  "work-cortex": {
    "storageType": "GITHUB",
    "githubRepoName": "user/work-cortex-site",
    "password": "my-secret",
    "colors": { "accent": "#ff6600" }
  }
}
```

Each named config is merged with defaults — missing fields fall back to `CONFIG_DEFAULTS`. A legacy single-object config file (without named keys) is automatically treated as the `"default"` config for backward compatibility.

### Config Selection

When running commands (`dev`, `build`, `deploy:github-pages`), the user is prompted to select which configuration to use:

- **Dev / Build**: The `"default"` option is always available and selected by pressing Enter. Other named configs are listed as numbered options.
- **Deploy**: There is no default option — the user must explicitly choose which config to deploy.

If only one config exists, it is used automatically without prompting.

### Encryption

If a config has a non-empty `password` field, `graph.json` is encrypted before deployment using AES-256-GCM with PBKDF2 key derivation (100,000 iterations, SHA-256). The encrypted payload is `base64(salt || iv || ciphertext + authTag)`.

At build time, a compile-time constant `__EC_ENCRYPTED__` is set to `true` when the selected config has a password. The UI checks this flag:

1. If encrypted, a black "Enter Password" screen is shown instead of the graph.
2. The user enters their password and the browser decrypts `graph.json` using the Web Crypto API.
3. If decryption fails (wrong password), an error is shown and the user can retry.
4. On successful decryption, the graph loads normally.

The password is never sent to the server or stored in the deployed bundle — only the encrypted `graph.json` is uploaded.

## Long-Term Vision

- Anyone can download External Cortex, find a cheap hosting service, and start dumping information into it
- A local LLM could automatically handle the dumping for a user
