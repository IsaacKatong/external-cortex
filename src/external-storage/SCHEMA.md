# External Storage Schema

JSON object definitions for data stored externally.

## Datum

```json
{
  "id": "string (UUID, unique)",
  "name": "string",
  "type": "string",
  "content": "string"
}
```

| Field   | Type   | Description                                              |
|---------|--------|----------------------------------------------------------|
| id      | string | UUID for the datum (unique)                              |
| name    | string | Name for the datum                                       |
| type    | string | Determines how to interpret content                      |
| content | string | Datum content. Can be markdown, a link, or anything else |

## Edge

```json
{
  "fromDatumID": "string (UUID)",
  "toDatumID": "string (UUID)"
}
```

| Field       | Type   | Description                                          |
|-------------|--------|------------------------------------------------------|
| fromDatumID | string | Datum where the edge starts                          |
| toDatumID   | string | Datum where the edge ends (combination is unique)    |

## DatumTag

```json
{
  "name": "string",
  "datumID": "string (UUID)"
}
```

| Field   | Type   | Description                                       |
|---------|--------|---------------------------------------------------|
| name    | string | Name of the datum tag                             |
| datumID | string | ID of the datum (combination is unique)           |

## DatumDimension

```json
{
  "name": "string",
  "datumID": "string (UUID)",
  "value": "number"
}
```

| Field   | Type   | Description                                              |
|---------|--------|----------------------------------------------------------|
| name    | string | Name of the datum dimension                              |
| datumID | string | ID of the datum (name and datumID combination is unique) |
| value   | number | Numeric value for the dimension                          |

## DatumTagAssociations

```json
{
  "childTagName": "string",
  "parentTagName": "string",
  "type": "string"
}
```

| Field         | Type   | Description                                              |
|---------------|--------|----------------------------------------------------------|
| childTagName  | string | Child to gain association                                |
| parentTagName | string | Parent to give association to child                      |
| type          | string | Type of association (combination of all 3 is unique)     |

## EdgeTag

```json
{
  "name": "string",
  "edgeID": "string"
}
```

| Field  | Type   | Description                  |
|--------|--------|------------------------------|
| name   | string | Name of the tag              |
| edgeID | string | Edge which the tag belongs to|
