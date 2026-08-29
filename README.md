🧾 FormSetu

Apply Smarter. Fill Faster. Submit with Confidence.

FormSetu is an intelligent civic application platform designed to simplify the process of filling government and public-service forms.

It helps users reuse previously entered information, validate documents, prepare files, and complete applications accurately — reducing repetitive data entry, form-filling errors, and document-related problems.

«🚀 One profile. One document vault. Multiple applications.»

---

🌐 Live Demo

🔗 "FormSetu — Live Application" (https://formsetu.vercel.app/)

🔗 "GitHub Repository" (https://github.com/lokeshtekade77-source/FORMSETU)

---

🎯 Problem

Government and civic applications often require citizens to repeatedly enter the same information and upload documents in specific formats.

Common problems include:

- ❌ Re-entering the same personal information for every application
- ❌ Incorrect or missing documents
- ❌ Wrong image dimensions or file formats
- ❌ Signature and photograph requirements
- ❌ Difficulty understanding application requirements
- ❌ Data-entry mistakes
- ❌ Repeatedly searching for previously submitted information
- ❌ Lack of a centralized application history

For users who are not comfortable with digital platforms, these problems can make government applications unnecessarily difficult.

---

💡 Our Solution

FormSetu acts as a digital assistant between citizens and complex application processes.

Instead of starting every form from scratch, users can:

1. 👤 Create or import their personal information
2. 📄 Upload and manage important documents
3. 🧠 Reuse information from previous applications
4. 🔍 Automatically validate uploaded documents
5. 🛠️ Prepare documents according to application requirements
6. ✏️ Review automatically mapped information
7. ✅ Verify the complete application before submission

---

✨ Key Features

👤 1. Personal Information Management

Maintain reusable information such as:

- Name
- Contact details
- Address
- Educational information
- Other application-specific details

This information can be reused across multiple applications.

---

🔄 2. Intelligent Information Reuse

FormSetu reduces repetitive data entry by allowing users to reuse information from previous applications.

The system can identify relevant information and map it to new application fields.

Example

Previous Application
        ↓
Stored Information
        ↓
New Application
        ↓
Automatic Field Mapping
        ↓
User Verification
        ↓
Final Application

Users remain in control and can review suggested mappings before accepting them.

---

📂 3. Document Management

Users can upload and manage documents required for applications.

Supported document processing includes:

- 📸 Photograph
- ✍️ Signature
- 📄 PDF documents
- 🖼️ Image files
- 📑 Supporting certificates/documents

---

🔍 4. Document Intelligence & Validation

FormSetu performs automated checks on uploaded documents before they are used in an application.

Validation can include:

- File type
- File size
- Image dimensions
- PDF validity
- Image quality
- Photograph requirements
- Signature requirements
- Document readability

This helps identify problems before application submission.

---

🖼️ 5. Automatic Document Preparation

Uploaded documents can be processed according to application requirements.

The backend uses image and PDF processing libraries to perform operations such as:

- Image resizing
- Image processing
- PDF inspection
- Document preparation
- Format validation

---

📝 6. Application Workflow

FormSetu provides a structured application flow:

Start Application
       ↓
Personal Details
       ↓
Requirements
       ↓
Import / Reuse Information
       ↓
Upload Documents
       ↓
Document Verification
       ↓
Review Imported Data
       ↓
Final Review
       ↓
Application Ready

---

✅ 7. Final Review

Before completing an application, users can review:

- Personal information
- Imported information
- Uploaded documents
- Validation results
- Application requirements

The goal is to provide a final verification layer before submission.

---

🏗️ System Architecture

                    ┌──────────────────────┐
                    │      User / Citizen  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    │ React + TypeScript    │
                    └──────────┬───────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    │       Python         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
       │ PostgreSQL  │  │  Document   │  │ Information │
       │  Database   │  │ Processing  │  │   Mapping   │
       └─────────────┘  └─────────────┘  └─────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 Pillow              PyMuPDF

---

🛠️ Technology Stack

Frontend

Technology| Purpose
Next.js 15| Web application framework
React 19| UI development
TypeScript| Type-safe development
Tailwind CSS| Styling
React Hook Form| Form management
Zod| Schema validation

The current repository uses Next.js 15.4.x, React 19.1.x, React Hook Form and Zod.

Backend

Technology| Purpose
FastAPI| REST API
Python| Backend logic
SQLAlchemy| ORM
PostgreSQL| Database
Alembic| Database migrations
Pydantic Settings| Configuration
Uvicorn| ASGI server

Document Intelligence

Technology| Purpose
Pillow| Image processing
PyMuPDF| PDF processing
OpenCV| Computer vision
NumPy| Numerical/image processing

These document-processing dependencies are included in the project's Python requirements.

Testing

- Vitest
- TypeScript type checking
- ESLint
- Backend API testing

---

📁 Project Structure

FORMSETU/
│
├── api/                         # API-related components
├── backend/                     # FastAPI backend
│
├── src/                         # Next.js application source
│
├── civic_clarity/               # Civic clarity UI/module
├── formsetu_apply_smarter/      # Application workflow
├── formsetu_professional/       # Professional UI
├── import_data_formsetu/        # Data import workflow
├── personal_details_formsetu/   # Personal information
├── requirements_formsetu/       # Application requirements
├── review_import_formsetu/      # Imported data review
├── documents_formsetu/          # Document workflow
├── final_review_formsetu/       # Final application review
├── start_application_formsetu/  # Application initialization
│
├── storage/                     # Storage-related resources
├── docs/                        # Documentation
│
├── docker-compose.yml           # PostgreSQL development setup
├── package.json                 # Frontend dependencies/scripts
├── requirements.txt             # Backend dependencies
├── .env.example                 # Environment configuration template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── vercel.json

The repository currently contains dedicated modules for application start, requirements, personal details, importing data, documents, review, and final review.

---

🚀 Getting Started

Prerequisites

Make sure you have installed:

- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL 16+
- Git

Docker is recommended for the database.

---

1️⃣ Clone the Repository

git clone https://github.com/lokeshtekade77-source/FORMSETU.git

cd FORMSETU

---

2️⃣ Install Frontend Dependencies

npm install

---

3️⃣ Setup Python Environment

Create a virtual environment:

python -m venv .venv

Windows

.venv\Scripts\activate

Linux / macOS

source .venv/bin/activate

Install backend dependencies:

pip install -r requirements.txt

---

4️⃣ Configure Environment Variables

Create your environment file:

cp .env.example .env

For Windows:

copy .env.example .env

Update the values according to your local environment.

«⚠️ Never commit secrets, API keys, database passwords, or private credentials to GitHub.»

---

5️⃣ Start PostgreSQL

The repository includes a Docker Compose configuration for PostgreSQL.

Start the database using:

docker compose up -d

The development configuration uses PostgreSQL 16 and exposes port "5432".

---

6️⃣ Start the Backend

From the backend directory:

uvicorn main:app --reload

The API will normally be available at:

http://localhost:8000

FastAPI documentation:

http://localhost:8000/docs

---

7️⃣ Start the Frontend

In a separate terminal:

npm run dev

Open:

http://localhost:3000

---

🧪 Testing

Run the frontend test suite:

npm test

Run TypeScript checks:

npm run typecheck

Run linting:

npm run lint

Build the production application:

npm run build

The available frontend scripts are defined in the repository's "package.json".

---

🐳 Docker

To start the PostgreSQL development service:

docker compose up -d

To stop it:

docker compose down

To remove the database volume as well:

docker compose down -v

«⚠️ Removing the volume permanently deletes the local PostgreSQL data.»

---

🔐 Security & Privacy

FormSetu is designed around the principle that users should remain in control of their application data.

Important security practices:

- Do not commit ".env" files
- Do not expose database credentials
- Validate uploaded files
- Restrict accepted file types
- Apply file-size limits
- Sanitize uploaded content
- Protect API endpoints
- Use HTTPS in production
- Avoid storing unnecessary personal information

---

🎯 Use Cases

FormSetu can be adapted for applications such as:

- 🎓 Scholarships
- 🏫 Educational admissions
- 🏛️ Government schemes
- 📄 Certificates
- 💼 Employment applications
- 🏠 Housing schemes
- 💰 Financial assistance
- 🧑‍🎓 Student welfare schemes
- 🏢 Civic services

The platform is designed to be extensible so that new application workflows can be added without rebuilding the entire system.

---

🗺️ Roadmap

Phase 1 — Core Platform

- [x] Application workflow
- [x] Personal information management
- [x] Document upload
- [x] Document validation
- [x] Data reuse
- [x] Review workflow
- [x] PostgreSQL integration
- [x] FastAPI backend

Phase 2 — Intelligence

- [x] Automatic field mapping
- [x] Document intelligence
- [x] Confidence-based suggestions
- [ ] Advanced OCR
- [ ] Improved semantic field matching
- [ ] Multilingual form assistance

Phase 3 — Citizen Experience

- [ ] User accounts
- [ ] Application history
- [ ] Saved profiles
- [ ] Application status tracking
- [ ] Notifications
- [ ] Mobile-first improvements

Phase 4 — Government & Civic Integration

- [ ] Government portal integrations
- [ ] DigiLocker integration
- [ ] API-based document verification
- [ ] Automated application workflows
- [ ] Multi-state support
- [ ] Multi-language support

---

🌍 Vision

FormSetu aims to make digital government services simpler, faster, and more accessible.

Instead of forcing citizens to understand complicated digital processes, the platform aims to make the process work around the citizen.

«Fill once. Reuse everywhere. Verify before you submit.»

---

🤝 Contributing

Contributions are welcome!

1. Fork the repository

git fork https://github.com/lokeshtekade77-source/FORMSETU

2. Create a branch

git checkout -b feature/your-feature

3. Make your changes

Follow the existing project structure and coding conventions.

4. Test your changes

npm run lint
npm run typecheck
npm test

5. Commit

git add .
git commit -m "feat: add your feature"

6. Push

git push origin feature/your-feature

Then open a Pull Request.

---

📜 License

This project is currently intended as a development/project implementation.

Add an appropriate open-source license to the repository before distributing FormSetu publicly.

---

👨‍💻 Project

FormSetu — Civic Application Suite

Built with ❤️ to make digital applications easier for everyone.

Repository

GitHub:
https://github.com/lokeshtekade77-source/FORMSETU

Live Application

FormSetu:
https://formsetu.vercel.app/

---

<p align="center">
  <strong>FORMSETU</strong><br>
  <i>Apply Smarter. Fill Faster. Submit with Confidence.</i>
</p>
