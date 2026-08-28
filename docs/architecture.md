# FormSetu architecture

## Current repository (implemented Phase 2, 26 August 2026)

This repository is a Google Stitch export, not an initialized web application.

- There is no `package.json`, lockfile, `src/`, build configuration, router, test suite, or environment file.
- There is no frontend framework or version to report. Each screen is an independent static `code.html` file.
- Styling is Tailwind CSS loaded from `https://cdn.tailwindcss.com`, with per-screen inline Tailwind configuration. Google Fonts supplies Inter and Material Symbols. The two Stitch design briefs describe the related **Civic Clarity** and **FormSetu Professional** tokens.
- There is no reusable component implementation. The shared shell (left progress sidebar, header, language buttons, footer/disclaimer, cards, status chips, and action buttons) is duplicated as HTML in the screen files.
- There is no application state store. Values, progress, statuses, and filenames are hard-coded in markup. The only JavaScript is a landing-page SVG animation, a no-op hover listener, two inline route-like `window.location` handlers, and a conflict-card CSS-class toggle.
- The repository now includes a FastAPI service in `backend/`, SQLAlchemy 2.x models, Alembic configuration and initial migration, Docker Compose PostgreSQL configuration, a local replaceable `DocumentStorage` abstraction, and pytest coverage. The frontend still retains client-side session state as its offline UI fallback; API integration is staged for the next UI pass.

## Screen inventory and current visual route map

The exports are screen assets, not application routes. The following mapping is proposed for implementation while preserving each corresponding Stitch layout.

| Existing export | What it visually represents | Proposed route |
| --- | --- | --- |
| `formsetu_apply_smarter/code.html` | Landing / product explanation | `/` |
| `start_application_formsetu/code.html` | Application selection | `/applications/new` |
| `requirements_formsetu/code.html` | Requirements checklist | `/applications/:applicationId/requirements` |
| `import_data_formsetu/code.html` | Previous-application choice | `/applications/:applicationId/import` |
| `review_import_formsetu/code.html` | Import review and district conflict | `/applications/:applicationId/import/review` |
| `personal_details_formsetu/code.html` | Personal-details form | `/applications/:applicationId/personal-details` |
| `documents_formsetu/code.html` | Document upload, validation, preparation | `/applications/:applicationId/documents` |
| `final_review_formsetu/code.html` | Final review and declaration | `/applications/:applicationId/review` |

The existing screen placeholders such as `{{DATA:SCREEN:SCREEN_22}}` are Stitch links, not usable routes. Several links are `#`; no screen transition currently works as an integrated user journey.

## Existing visual content and mock data

All displayed records are static demonstration content. Examples include the candidate identifier `CAND-2024-8839`, the featured **Customer Support Associate** recruitment application, previous Recruitment/Scholarship demo applications, a profile named “Chaitanya Demo User”, a Nagpur/Bhandara district conflict, document filenames, application statistics, and final-review details. These are presentation-only values and are not persisted or validated.

The visual design includes:

- a 10-step sidebar: Registration, Personal Details, Contact Details, Address, Education, Experience, Eligibility, Documents, Declaration, Preview;
- requirements for information and supporting documents;
- an import comparison with field selection/edit affordances and a district conflict;
- personal-detail inputs and select controls;
- document status cards, mock optimization (“4.2 MB” to “47 KB”), and an apparent document vault;
- final review cards, two declaration checkboxes, and a “Complete Application” action.

## Functionality that is visual only

No user-facing form submission, field persistence, navigation, file selection, upload, document vault, image transformation, validation, import, conflict resolution, language switching, final completion, authentication, or data fetching exists. Required HTML attributes provide only browser-level hints; no `<form>` elements or submit handlers exist. The document page has no file input. The completion button links to `#success` only.

The prototype disclaimer is already present on the main screens. The final review currently uses an “NSEB / National Skills & Employment Board” label and an Aadhaar reference in a requirements/document label; before any public demo, these should be replaced with neutral fictional programme and document wording so the prototype neither uses government branding nor implies affiliation.

## Recommended target architecture

Keep the Stitch screens as the visual source of truth; translate their markup into components without redesigning layout, copy hierarchy, or visual states.

```text
React + TypeScript frontend
  ├─ Stitch-derived page components and shared application shell
  ├─ route-level data loaders / API client
  └─ local UI state only for unsaved edits
          │ HTTPS JSON + controlled demo file upload
FastAPI service
  ├─ application workflow and validation rules
  ├─ synthetic previous-application import engine
  ├─ document metadata/preparation job adapter
  └─ audit/event log
          ├─ PostgreSQL: workflow and structured data
          └─ demo object storage: uploaded/prepared files
```

Recommended implementation structure:

```text
frontend/                 # React + TypeScript application
  src/pages/              # one page per Stitch screen
  src/components/         # AppShell, Stepper, cards, form controls
  src/features/           # applications, import, documents, review
  src/lib/api/            # typed HTTP client
backend/
  app/api/                # REST routers
  app/services/           # workflow, import, document preparation
  app/models/             # persistence models
  tests/
database/
  migrations/
  seed/                   # synthetic demo scenarios only
```

For the hackathon MVP, use a seeded anonymous demo session instead of real account identity. The backend must accept only synthetic data, use a neutral fictional programme catalogue, keep files in local/demo object storage, and never call, scrape, or imitate a government system.

## Proposed database models

| Model | Key fields | Purpose |
| --- | --- | --- |
| `demo_sessions` | `id`, `scenario_key`, `created_at`, `expires_at` | Isolates each judge’s seeded demonstration run. |
| `application_types` | `id`, `slug`, `name`, `category`, `is_demo`, `requirements_json` | Defines the fictional Customer Support Associate flow and its required fields/documents. |
| `applications` | `id`, `session_id`, `application_type_id`, `status`, `current_step`, `progress_percent`, timestamps | Owns a single in-progress demo application. |
| `application_fields` | `id`, `application_id`, `field_key`, `value_json`, `source`, `verified_at` | Stores mapped, manually edited, and confirmed field values. |
| `previous_applications` | `id`, `session_id`, `title`, `category`, `updated_at`, `summary_json` | Synthetic histories offered by the import screen. |
| `import_runs` | `id`, `application_id`, `source_application_id`, `status`, timestamps | Records an import decision. |
| `field_conflicts` | `id`, `import_run_id`, `field_key`, `previous_value`, `current_value`, `resolution`, `resolved_value` | Tracks conflicts such as the demo district choice. |
| `documents` | `id`, `application_id`, `document_type`, `original_name`, `storage_key`, `mime_type`, `size_bytes`, `status` | Stores metadata for a demo upload or seeded document. |
| `document_validations` | `id`, `document_id`, `rule_results_json`, `is_valid`, `validated_at` | Preserves format, size, dimension, and requiredness checks. |
| `document_preparations` | `id`, `document_id`, `target_spec_json`, `output_storage_key`, `status`, `result_json` | Records simulated or local image/document transformations. |
| `declarations` | `id`, `application_id`, `truth_confirmed`, `cancellation_confirmed`, `accepted_at` | Stores the final two confirmation choices. |
| `application_events` | `id`, `application_id`, `event_type`, `payload_json`, `created_at` | Enables a simple auditable demo timeline. |

## MVP boundaries

The completed MVP is an independent FormSetu prototype, not a submission portal. It must display a clear demo disclaimer, use only generated or seeded data/files, avoid government logos and identifiers, and finish with “Application Ready” rather than submission to any external authority.

## Implemented persistence layer

`backend/app/models/models.py` implements the Phase 2 relational schema: demo sessions, application types/sections/fields, field values, previous applications/fields, imports/import fields, conflicts, documents/document requirements/application documents, declarations, and privacy-safe audit events. `backend/app/services/seed.py` deterministically creates the fictional Customer Support Associate — Demo Recruitment 2026 scenario, a 20-field Recruitment Application — Demo 2025 history, eight demo document requirements, and the unresolved Nagpur/Bhandara district conflict.

The service uses `DATABASE_URL`, defaults to SQLite only for local/test convenience, and uses PostgreSQL when run with the supplied `docker-compose.yml` and `.env` settings. No external service, identity service, government API, or cloud storage is present.
