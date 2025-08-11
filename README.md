# ClinicalPilot

An AI‑assisted clinical reasoning workspace that helps capture symptom narratives, surface structured differential diagnoses, recommend next steps, enrich with references, stratify risk, and preserve longitudinal context — all while remaining transparent about limitations.

---

## 1. Problem We Wanted To Solve

Clinicians and trainees often bounce between free‑text notes, guidelines, scattered references, and emerging AI tools. Most chat‑style medical assistants:

- Give unstructured prose that is hard to reuse.
- Omit explainability or red‑flag triage context.
- Lose conversation continuity or make it awkward to re‑enter data (labs, vitals, photos).
- Provide no bridge from real‑world paper / image artifacts back into structured reasoning.

We wanted a single lightweight interface that: (a) accepts multimodal inputs (text + image + scanned document), (b) returns a _structured_ clinical summary (primary Dx, differentials, next steps), (c) layers safety signals (risk heuristics, reference enrichment), and (d) keeps the conversation persistently queryable.

---

## 2. Intuition Behind The Solution

1. **Structure unlocks reuse**: If AI output is JSON‑like we can enrich, store, filter, and display elegantly.
2. **Augment, don’t replace**: Provide assistant reasoning plus transparent heuristics (risk signals, citations) so the clinician stays in control.
3. **Frictionless capture**: The faster users get symptoms, vitals, labs (even from a photo) into the system, the more value the AI context has.
4. **Graceful degradation**: Rate limits or API hiccups shouldn’t dead‑end the user; partial / fallback responses still help.

---

## 3. Approach Overview

| Layer              | Goal                           | Key Decisions                                                          |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| Prompt Engineering | Consistent structured response | Deterministic template + temperature 0.3                               |
| Response Parsing   | Robust extraction              | Braces slicing + defensive sanitation                                  |
| Data Persistence   | Conversation continuity        | MongoDB schema with message + structured data blob                     |
| Safety & Insight   | Rapid triage feel              | Heuristic risk stratification (non‑diagnostic)                         |
| Enrichment         | Evidence links                 | Reference lookup attaching citations                                   |
| Multimodality      | Real clinical artifacts        | Image upload + (optional) vision model payload branch                  |
| Resilience         | Avoid hard crashes             | Retry, model downgrade, mock fallback                                  |
| UX                 | Fast clinical flow             | Dark/light mode, copy actions, rename/delete, scanner, reference panel |

---

## 4. Core Features

| Feature                                                        | Why It Matters                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| Structured AI Output (primary diagnosis, differentials, steps) | Enables UI cards, selective export, future analytics              |
| Gemini Integration w/ Model Downgrade                          | Balances quality (pro / vision) vs quota (flash)                  |
| Retry + Backoff + Fallback Mock                                | Maintains continuity under rate limits / outages                  |
| Medical Reference Panel (ICD contextual info)                  | On‑demand depth without leaving chat                              |
| Risk Stratification Panel (Heuristic)                          | Quick triage signal & transparency (not a clinical decision tool) |
| Document Scanner + OCR (Tesseract.js)                          | Pulls paper labs/notes directly into chat context                 |
| Image Upload (symptom photos, scans)                           | Adds visual context (vision model branch)                         |
| Conversation History Sidebar (rename / delete)                 | Organizes longitudinal encounters                                 |
| Dark / Light Theme + Accessible Contrast                       | Professional feel, minimizes eye strain                           |
| Copy Buttons (message / full response / diagnosis)             | Speeds hand‑off into EMR or notes                                 |
| Citations & Reference Enrichment                               | Encourages verification and continual learning                    |
| Defensive Parsing + Schema Validation                          | Prevents malformed LLM output breaking DB                         |

---

## 5. Why These Features (Design Rationale)

- **Safety & Trust**: Adding heuristic red‑flag and structured breakdown reduces blind acceptance of AI text.
- **Workflow Fit**: Clinicians juggle fragmented sources; fast capture (scanner + image + text) keeps momentum.
- **Scalability of Insight**: Structured storage unlocks future metrics (diagnosis frequency, time to escalation, etc.).
- **Resilience**: Fallbacks ensure demonstration continuity (important for panel review) even under quota stress.

---

## 6. What Makes ClinicalPilot Unique

1. **Multilayer Intelligence**: Not just an LLM wrapper—adds heuristic risk, references, structured enrichment.
2. **Transparent Failure Modes**: Clear messaging when LLM parse fails; still returns actionable next steps guidance.
3. **Workflow‑Centric Innovations**: In‑browser OCR document ingestion—rare in quick prototypes.
4. **Upgrade Path Ready**: Architecture already ready for user auth, auditing, FHIR export, analytics dashboards.
5. **Model Adaptivity**: Dynamic model fallback (pro → flash) shields users from quota surprises.

---

## 7. Tech Stack & Why

| Layer            | Tech                                   | Reason                                                   |
| ---------------- | -------------------------------------- | -------------------------------------------------------- |
| Backend Server   | Node.js + Express                      | Lightweight, familiar ecosystem, fast iteration          |
| LLM Integration  | Gemini API (flash / vision)            | Good balance of latency + multimodal capability          |
| Database         | MongoDB + Mongoose                     | Flexible schema for evolving structured response objects |
| Frontend         | React + MUI + Tailwind utility synergy | Rapid component styling + theme toggling                 |
| OCR              | Tesseract.js (client)                  | Zero backend dependency; privacy (local processing)      |
| Risk Logic       | Pure JS Heuristics                     | Deterministic, explainable, no new dependencies          |
| Deployment Ready | Env‑driven config                      | Easy to containerize / deploy later                      |

---

## 8. Implementation Steps (High Level)

1. **Bootstrap**: Express server, React client, Mongo connection, base routes.
2. **Conversation Model**: Schema for messages + optional structured assistant data.
3. **LLM Service**: Prompt constructor → Gemini call (with retry / downgrade / fallback) → parser → normalized object.
4. **Chat Controller**: Save user message early, call LLM, enrich, sanitize, persist assistant reply.
5. **Frontend Chat Flow**: FormData submit (message + optional image), streaming‑like UI pattern (optimistic user bubble + spinner).
6. **Enhancements**: Dark mode, copy utilities, sidebar history (CRUD), reference panel & risk panel.
7. **OCR Scanner**: Camera capture → canvas → Tesseract → pattern formatting → inject text into composer.
8. **Resilience & Logging**: Added verbose `[Gemini]` and `[Chat]` logs; fallback structured error responses.
9. **Security & Hygiene**: .env gating, .env.example template, ignoring sensitive keys in git.
10. **Polish & Testing**: Postman scripts (health, test model, chat), frontend error pathway improvements.

---

## 9. Challenges & How We Tackled Them

| Challenge                          | Impact                           | Mitigation                                                                              |
| ---------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| Gemini 429 Rate Limits (Pro model) | Hard 500s, blocked demo          | Automatic downgrade to flash + exponential backoff + test endpoint + fallback mock path |
| Unparseable / Partial LLM JSON     | DB validation errors             | Defensive brace slicing, null normalization, sanitation before save                     |
| Conversation ID Staleness          | Frontend 404 loops               | Auto‑retry clearing stale ID + backend silent new conversation fallback                 |
| Vision / Image Handling            | Payload complexity               | Conditional part injection (fallback to text model if absent)                           |
| Clinical Safety Perception         | Trust gap                        | Added heuristic risk panel + citations for traceability                                 |
| Document Re‑Entry Overhead         | Slowed workflow                  | OCR scanner to ingest labs / notes quickly                                              |
| Frontend Submodule Accident        | Frontend not browsable on GitHub | Removed submodule index, re‑added directory contents                                    |
| Theme Contrast in Light Mode       | Low readability                  | Explicit text color + gradient adjustments                                              |

---

## 10. How To Run Locally

### Prerequisites

- Node.js (LTS)
- MongoDB running locally (or Atlas URI)
- Gemini API key (AI Studio)

### Environment Setup

Create `backend/.env` (never commit real keys):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ClinicalPilot
GEMINI_API_KEY=YOUR_KEY_HERE
LLM_PROVIDER=gemini
USE_MOCK_LLM=false
GEMINI_TEXT_MODEL=gemini-1.5-flash-latest
GEMINI_VISION_MODEL=gemini-1.5-pro-vision
```

### Install & Start

From project root:

```bash
cd backend
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Open: http://localhost:3000

### Quick Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health
# Gemini test
curl http://localhost:5000/api/chat/test
```

### Using Mock Mode

If you exhaust quota:

```
USE_MOCK_LLM=true
```

Restart backend; structured mock responses continue UI testing.

---

## 11. Typical Workflow

1. Enter symptoms (optionally attach image or scan a document).
2. Receive structured response: primary Dx, differentials, steps, references, risk panel.
3. Open medical reference panel for ICD detail or trial context.
4. Copy any element (diagnosis, full response, steps) into clinical notes.
5. Continue conversation; rename or delete in sidebar as needed.

---

## 12. Extensibility Roadmap

| Next Step                      | Rationale                                            |
| ------------------------------ | ---------------------------------------------------- |
| User Auth + Roles              | Multi‑clinician usage & auditing                     |
| FHIR Export / JSON API         | Interoperability with EMR sandbox                    |
| Analytics Dashboard            | Aggregate differential patterns, triage distribution |
| Feedback Loop (thumbs up/down) | Continuous prompt / heuristic refinement             |
| Structured Vitals Component    | Direct structured entry + trend graphs               |
| Safety Guardrails (PHI scrub)  | Privacy & compliance maturation                      |

---

## 13. Disclaimers

- Not a diagnostic device. Educational / decision‑support augmentation only.
- Heuristic risk and references are _advisory_; always confirm clinically.
- OCR / parsing may introduce transcription errors—verify before charting.

---

## 14. Quick Troubleshooting

| Symptom                   | Fix                                                                        |
| ------------------------- | -------------------------------------------------------------------------- |
| 429 Errors                | Switch to mock (`USE_MOCK_LLM=true`), wait quota reset, ensure flash model |
| Blank Assistant Message   | Check backend logs for `parseLLMResponse error`; verify JSON braces        |
| 404 Conversation          | Stale ID — cleared automatically after patch; refresh page                 |
| White Text on Light Theme | Ensure latest MessageBubble styling (solid color + contrast text)          |
| OCR Slow                  | First Tesseract load is heavy; reuse session or defer import               |

---

## 15. Contribution Guide (Lightweight)

1. Fork & branch (`feature/your-feature`).
2. Keep changes small & atomic.
3. Add/update README or inline JSDoc for new modules.
4. Avoid committing `.env` / credentials.
5. Open PR with concise rationale + before/after screenshot if UI.

---



### Final Thought

ClinicalPilot focuses on _clarity + safety + speed_: giving clinicians structured, explainable support instead of opaque, generic paragraphs. Iterate responsibly.
