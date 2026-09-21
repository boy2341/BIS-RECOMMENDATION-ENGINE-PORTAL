# Deployment Guide: Render (Unified & Safe)

This project is configured as a **single, unified, self-contained service** on Render. 
The FastAPI backend serves the compiled React application directly as static files while handling all `/api/*` endpoints on the same port.

---

## 🔒 Security Guarantee ("Nothing Spread Out")
- **No secret leaks**: Your `.env` and `GROQ_API_KEY` are blocked by `.gitignore` and `.dockerignore`.
- **Single URL**: Both frontend and backend live on the same domain (e.g. `https://is-assist.onrender.com`).
- **No CORS failures**: Since requests to `/api` are same-origin in production, browser preflights will never be blocked.
- **Free Tier Compatible**: Only uses **1 Web Service** on Render.

---

## 🚀 Step-by-Step Deployment Instructions

### Option 1: Render Blueprint (Recommended — 1-Click Setup)

1. **Push your code to GitHub**:
   In your project root (`c:\sih`), open terminal or PowerShell:
   ```bash
   git init
   git add .
   git commit -m "feat: unified Render deployment setup with BIS standards portal"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
   *(Note: The root `.gitignore` automatically keeps your `.env` and sensitive files safe).*

2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** → **Blueprint**.
   - Connect your GitHub repository.
   - Render will detect `render.yaml` automatically.
   - Under **Environment Variables**, set:
     - `GROQ_API_KEY`: Paste your Groq API key (`gsk_...`).
   - Click **Apply**. Render will automatically build the Docker container and deploy!

---

### Option 2: Manual Web Service (Docker)

If you prefer to create the service manually in Render without Blueprints:

1. Push your repository to GitHub (as in Step 1 above).
2. On Render, click **New +** → **Web Service**.
3. Select your repository.
4. Fill in the following:
   - **Name**: `is-assist-portal` (or your choice)
   - **Region**: Any (e.g., Oregon, Frankfurt, Singapore)
   - **Language / Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: **Free**
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `your_actual_groq_api_key`
   - `GROQ_MODEL`: `openai/gpt-oss-20b` (or `llama-3.3-70b-versatile`)
   - `STANDARDS_PATH`: `/app/backend/data/standards.json`
   - `CHROMA_PATH`: `/app/backend/storage/chroma`
6. Click **Create Web Service**.

---

### Option 3: Native Python Runtime (Without Docker)

If you prefer Render's native Python runtime:
- **Runtime**: Python 3
- **Build Command**: `./build.sh` (or `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build && cd ..`)
- **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**: Add `PYTHON_VERSION=3.11.9` and `GROQ_API_KEY`.

---

## ✅ Verification after Deployment

Once Render finishes deploying (it will display a green checkmark with a URL like `https://is-assist-xxxx.onrender.com`):

1. **Open the URL in your browser**:
   - The full-page portal will load.
2. **Check Health**:
   - The top header will show `Backend Online` (green badge).
   - Visiting `https://your-url.onrender.com/api/health` returns `{"status": "ok"}`.
3. **Explore Knowledge Base**:
   - Click the **"BIS Standards & Rules Knowledge Base"** tab. All 10 Indian Standards will load from ChromaDB.
4. **Test Tender Formulation**:
   - Click **"I want 50 pumps"** → Click **"Analyze & Identify Applicable Standards"**.
   - Complete the questionnaire and click **"Formulate GeM Tender Specification"** to preview and download the signed PDF!
