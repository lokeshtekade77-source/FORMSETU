# FormSetu MVP API

## Scope and conventions

These APIs are implemented by the FastAPI service in `backend/app` and serve an independent, synthetic-data-only demo. Base path: `/api`.

- Every request is scoped to a short-lived demo session; do not collect real identity data or implement OTP flows.
- Responses use JSON. Files are accepted only by the controlled demo upload endpoint and are stored in demo/local storage.
- IDs below are opaque UUIDs. Error responses use `{ "error": { "code", "message", "details" } }`.
- No endpoint connects to a government system, uses government data, or submits an application externally.

## Session and catalogue

| Method and path | Purpose |
| --- | --- |
| `POST /sessions` | Creates a seeded judge scenario and returns its first application. |
| `GET /sessions/{sessionId}` | Returns the session and applications. |
| `POST /sessions/{sessionId}/reset` | Replaces a demo session with a new deterministic seed. |

`POST /sessions` example response:

```json
{
  "id": "demo-session-uuid",
  "application": { "id": "demo-application-uuid", "status": "draft" },
  "disclaimer": "Independent FormSetu prototype. Demo data only."
}
```

## Application workflow and data entry

| Method and path | Purpose |
| --- | --- |
| `GET /applications/{applicationId}` | Returns the application, progress, current step, and summary. |
| `GET /applications/{applicationId}/requirements` | Returns required information and document checklist. |
| `GET /applications/{applicationId}/fields` | Returns field values with source and verification status. |
| `POST /applications/{applicationId}/fields/{fieldId}/update` | Saves a manual value. |
| `POST /applications/{applicationId}/fields/{fieldId}/verify` | Marks a field confirmed. |

Field update request example:

```json
{
  "fields": [
    { "key": "personal.firstName", "value": "Aarav", "source": "manual" },
    { "key": "address.district", "value": "Bhandara", "source": "manual" }
  ]
}
```

## Previous-application import and conflicts

| Method and path | Purpose |
| --- | --- |
| `GET /previous-applications?session_id=` | Lists synthetic previous applications in the session. |
| `GET /previous-applications/{id}` | Returns its reusable fields. |
| `POST /applications/{applicationId}/imports` | Starts comparison with a selected history. |
| `GET /applications/{applicationId}/imports` | Returns import fields and decisions. |
| `POST /imports/{importId}/fields/{fieldId}/decision` | Applies `use`, `edit`, or `reject`. |

Conflict resolution request:

```json
{
  "resolution": "manual",
  "value": "Bhandara"
}
```

## Documents, validation, and preparation

| Method and path | Purpose |
| --- | --- |
| `GET /documents?session_id=` | Lists session document records. |
| `GET /applications/{applicationId}/documents` | Lists requirement slots and statuses. |
| `POST /applications/{applicationId}/documents/link` | Reserved local-demo document linking endpoint. |

Preparation must be transparent: return both original and output metadata and never modify the original upload in place.

## Review and completion

| Method and path | Purpose |
| --- | --- |
| `GET /applications/{applicationId}/validation` | Returns progress and unresolved conflicts. |
| `POST /applications/{applicationId}/declaration` | Saves the demo declaration. |
| `POST /applications/{applicationId}/complete-demo` | Runs final checks and returns `Application Ready`. |

`POST /applications/{applicationId}/complete-demo` rejects requests until the seeded conflict resolves and the declaration is accepted. Its successful response says `Application Ready`; it never calls an external submission service. File upload/real document processing remains deliberately unimplemented.

## Minimal status vocabulary

- Application: `draft`, `requirements_reviewed`, `importing`, `in_progress`, `review_ready`, `ready`.
- Document: `missing`, `uploaded`, `invalid`, `preparing`, `prepared`, `valid`.
- Conflict: `unresolved`, `imported`, `kept_current`, `manual`.
