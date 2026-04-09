# Basic JSON View

The simplest rendering style for the external graph. All datums and edges are displayed as formatted JSON objects.

## Components

- `BasicJsonView.tsx` - Orchestrates the view and manages filter state.
- `DatumList.tsx` - Renders the filtered list of datums as JSON.
- `EdgeList.tsx` - Renders the filtered list of edges as JSON.
- `TagFilter.tsx` - Presents available tags as toggleable filters and reports the active selection.
