# SecureExam AI

**An online examination platform with AI-powered remote proctoring, automatic evaluation, and performance analytics — built to run entirely self-hosted, with no dependency on third-party cloud services.**

SecureExam AI conducts secure online examinations while using AI to detect suspicious behavior, prevent common forms of cheating, and instantly evaluate objective answers — giving teachers and administrators clear, explainable analytics instead of an opaque risk score.

---

## Features

- 🔐 **Role-based accounts** — student, teacher, and admin roles with JWT authentication
- 📝 **Exam & question management** — MCQ, true/false, numeric, and subjective question types
- ⏱️ **Secure exam-taking experience** — timed sessions, autosave, required fullscreen mode
- 🎥 **AI-powered proctoring**, running on three parallel paths:
  - Real-time face count and gaze detection in-browser (MediaPipe)
  - Browser-level tab/window-switch detection via a companion Chrome extension
  - Periodic deeper checks (object detection, audio analysis) via a Python AI microservice
- 🙂 **Gentle real-time nudges** — correctable issues (e.g. face out of frame) get a short grace period before becoming a flag, reducing false positives
- ✅ **Instant auto-grading** for objective questions
- 📊 **Performance analytics** — score distributions, flag summaries, per-student integrity timelines with linked evidence
- 🗄️ **Fully self-hosted** — PostgreSQL, Redis, and MinIO (S3-compatible object storage) all run locally via Docker; no AWS/GCS/Azure account required

---

## Architecture

SecureExam AI uses a **modular monolith with one dedicated AI service** — not full microservices, not a single undivided app:

- A single Node.js/Express backend, organized into feature modules (`auth`, `exams`, `proctoring`, `grading`, `analytics`) that run in one process and share one database connection.
- One separate Python/FastAPI service for AI proctoring checks, since the CV/audio libraries needed are Python-native — this is the one deliberate service boundary.
- A Chrome extension (Manifest V3) for browser-level detection a normal web page cannot perform on its own.

```
Browser (React + MediaPipe + extension)
        │
        ▼
Node.js backend  ──►  PostgreSQL
   │      │      ──►  Redis (cache + BullMQ queue)
   │      └──────►  Python AI microservice ──► MinIO (snapshots)
   ▼
Socket.io (live proctoring alerts)
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend API | Node.js + Express, Socket.io |
| Database | PostgreSQL |
| Cache / Queue | Redis + BullMQ |
| AI microservice | Python + FastAPI |
| Client-side AI | MediaPipe Tasks Vision |
| Browser extension | Chrome extension (Manifest V3) |
| Object storage | MinIO (self-hosted, S3-compatible) |
| Deployment | Docker Compose |

---

## Project structure

```
securexam/
├── docker-compose.yml
├── db/
│   └── init.sql              # users, exams, questions, submissions, proctoring_flags
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/         # register, login, JWT
│       │   ├── exams/        # exam & question CRUD
│       │   ├── proctoring/   # flag ingestion + live broadcast
│       │   ├── grading/      # auto-grading
│       │   └── analytics/    # dashboards
│       └── server.js
├── ai-service/
│   └── main.py                # snapshot analysis (object/audio detection)
├── extension/
│   ├── manifest.json
│   └── background.js          # tab/window detection
└── frontend/
    └── src/
```

---

## Getting started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+
- Python 3.11+
- Google Chrome (for the proctoring extension)

### 1. Start the infrastructure
```bash
docker compose up postgres redis minio
```

### 2. Run the backend
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, JWT_SECRET, PORT
npm run dev
```

### 3. Run the AI microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Load the Chrome extension
Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `extension/` folder.

### 6. Try it out
Open the frontend URL, register a student account, then log in. A successful login confirms the frontend, backend, JWT auth, and database are all wired together correctly.

---

## Roadmap

- [x] Auth, database schema, core exam/question management
- [x] Exam-taking UI with autosave and fullscreen enforcement
- [x] Client-side proctoring (MediaPipe) with gentle nudges
- [x] Chrome extension for tab/window detection
- [x] AI microservice for object/audio checks
- [x] Auto-grading and analytics dashboards
- [ ] Load testing and security hardening
- [ ] Deployment polish and documentation pass

---

## Design principles

- **Explainable, not opaque.** Flags are backed by a specific rule and a linked snapshot, not just a black-box risk score.
- **Fair by default.** Correctable issues get a chance to self-resolve before becoming a permanent flag.
- **Privacy-first.** Only periodic frames and flagged clips are stored — never continuous video — and nothing leaves self-hosted infrastructure.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing module pattern (`model.js` → `controller.js` → `routes.js`) when adding backend functionality.
3. Open a pull request describing what changed and why.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## Authors

Built by a 2–3 person team as an 8-week academic capstone project.
