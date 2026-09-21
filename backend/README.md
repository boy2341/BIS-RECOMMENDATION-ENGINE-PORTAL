# IS-Assist Backend

FastAPI prototype backend for **AI-Powered Recommendation Engine for Identifying Applicable Indian Standards for Procurement Specifications**.

## Architecture

```text
Procurement text / PDF
        |
        v
   Groq GPT-OSS 20B
        |
        v
Structured requirements
        |
        v
Sentence Transformers embeddings
        |
        v
      ChromaDB
        |
        v
Candidate Indian Standards
        |
        v
Deterministic ranking + metadata relationships
        |
        v
Groq grounded explanation / procurement clause
```

The LLM is **Groq**. The prototype uses `openai/gpt-oss-20b`, which supports Groq strict Structured Outputs. The LLM is never allowed to invent standard numbers: standard candidates come only from `data/standards.json` and the ChromaDB index.

## Project structure

```text
backend/
├── app/
│   ├── api/routes/       # FastAPI route handlers
│   ├── core/             # Application configuration
│   ├── models/           # Domain/database models
│   ├── schemas/          # Pydantic request and response schemas
│   ├── services/         # Business logic and integrations
│   └── main.py           # FastAPI application entry point
├── data/                 # Local standards knowledge base
├── storage/              # Local ChromaDB data
├── tests/                # Automated tests
├── .env.example          # Environment variable template
├── requirements.txt      # Python dependencies
└── README.md             # Setup and API documentation
```

## Important prototype limitation

The included standards data is a **small demonstration knowledge base**, not an authoritative BIS database. Standard status, edition, amendments, applicability and certification requirements must be verified against current BIS information before any real procurement use.

## Setup (PowerShell)

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set:

```env
GROQ_API_KEY=your_real_key
GROQ_MODEL=openai/gpt-oss-20b
```

## Run

```powershell
uvicorn app.main:app --reload --port 8000
```

First startup downloads the Sentence Transformers embedding model and builds the local ChromaDB index. This may take a few minutes the first time.

## Endpoints

- `GET /` — API information
- `GET /api/health` — health/configuration status
- `POST /api/analyze` — analyze procurement text and recommend standards
- `POST /api/upload` — extract text from a PDF and analyze it
- `GET /api/standards` — list prototype standards
- `GET /api/standards/{standard_number}` — inspect a standard record
- `POST /api/standards/reindex` — rebuild ChromaDB index
- `POST /api/specification/generate` — generate a grounded draft procurement clause
- `/docs` — Swagger UI

## Example analyze request

```json
{
  "text": "Supply and installation of three phase induction motors, 5 kW, 415 V, 50 Hz, IP55 enclosure, suitable for continuous industrial operation.",
  "top_k": 5
}
```

## Design choices

### Groq
Used for:
- structured technical requirement extraction
- grounded recommendation explanation
- procurement clause drafting

### ChromaDB + Sentence Transformers
Used for semantic retrieval. This keeps the vector database local for the prototype and avoids sending the standards corpus to a third-party vector service.

### Grounding
The system retrieves standards first. Groq receives the procurement text plus retrieved evidence when explaining results. The model is explicitly instructed not to invent IS numbers or legal requirements.

### Version/amendment safety
The prototype stores status/amendment metadata but intentionally does **not** claim that an old record is the latest standard unless that is verified in the source data. The UI/API should therefore present status as something to verify before procurement publication.
