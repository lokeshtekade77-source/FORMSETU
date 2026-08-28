# FormSetu judge demo flow

## Demo guardrails

Run the demonstration with the seeded **Customer Support Associate — Demo** scenario and generated files only. The demonstrator should say at the start: “FormSetu is an independent prototype. It does not access, submit to, or partner with any government system.” Do not enter real personal data, documents, Aadhaar/PAN numbers, OTPs, or any external portal credentials.

## Exact journey

| # | Screen / moment | Judge-facing action and expected outcome |
| --- | --- | --- |
| 1 | Landing | Open FormSetu’s landing page. Explain the value proposition: reuse information, map it to a form, validate documents, and review before the application is ready. Select **Start an Application**. |
| 2 | Application Selection | Show the six category tiles, then choose the featured **Customer Support Associate — Demo** recruitment flow. The application is created in the demo session. |
| 3 | Requirements | Review required information and the synthetic document checklist. Confirm the requirements, then continue. |
| 4 | Required Documents | Point out the document slots and their demo specifications: portrait, signature, identity-equivalent proof, date-of-birth proof, qualification, resume, and optional supporting certificate. Explain these are fictional demo requirements, not official requirements. |
| 5 | Previous Application | Choose **Import Previous Application** rather than Start Fresh. Show the two seeded prior applications and select **Recruitment Application — Demo 2025**. |
| 6 | Import Data | Start the import comparison. Explain that FormSetu brings forward only values the user chooses; it is not retrieving data from a government or third-party system. |
| 7 | Verify Data | Review the matching full-name and address fields. Keep the matching synthetic values and show their source/verification labels. |
| 8 | Change / Update Data | Use the edit affordance to update one field with a clearly synthetic value, for example change the first name to **Aarav**. Save the field and show the source changing to manual. |
| 9 | Resolve Conflicts | Show the seeded district conflict: previous application **Nagpur** versus current profile **Bhandara**. Choose **Bhandara**, or enter a different synthetic district, then apply the resolution. |
| 10 | Application Form | Complete the personal-detail form using synthetic values only. Save and continue so the stepper and application progress update. |
| 11 | Documents | Open the document screen. Upload a generated demo portrait that intentionally fails the size/dimension rules, and use the seeded vault item for another document. |
| 12 | Document Validation | Run validation and show clear reasons for the portrait failure: file size and dimensions do not meet the fictional target. Show required documents moving from missing/uploaded to validated where applicable. |
| 13 | Automatic Document Preparation | Select **Prepare Automatically**. Show the prepared demo output (JPG, 200×230 px, 20–50 KB target) alongside its original metadata, then select **Use Prepared File**. |
| 14 | Final Review | Open final review. Show grouped personal, address, education, work, and document data; mention the reused-field, manual-update, optimized-document, and resolved-conflict counters are calculated from this demo run. Use Edit only if a correction needs to be shown, then return to review. |
| 15 | Declaration | Check both declarations. Emphasize that these are local demo confirmations and no information will be transmitted outside FormSetu. |
| 16 | Application Ready | Select **Complete Application**. The final check verifies fields, documents, conflict resolution, and declarations, then presents **Application Ready**. End by reiterating that this is readiness for a fictional prototype workflow—not external submission or approval. |

## Demo reset

Start a new demo session before each judge run. This produces the same seeded prior-application data, conflict, and generated file set, keeping each presentation deterministic and isolated.

## Persistence in Phase 2

The FastAPI backend now seeds and persists the session, previous application, field/import decisions, conflict resolution, declaration, application status, and audit event metadata. The Phase 1 browser state remains as an intentional UI fallback until the next frontend integration pass wires these API calls into the existing Stitch-derived screens. Document upload and processing remain simulated UI states in this phase.
