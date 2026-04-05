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

## Long-Term Vision

- Anyone can download External Cortex, find a cheap hosting service, and start dumping information into it
- A local LLM could automatically handle the dumping for a user
