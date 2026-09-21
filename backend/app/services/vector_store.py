from pathlib import Path
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer

class VectorStore:
    def __init__(self, chroma_path: str, embedding_model: str, standards_store):
        resolved_path = Path(chroma_path).resolve()
        resolved_path.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(resolved_path))
        self.collection = self.client.get_or_create_collection(
            name='indian_standards',
            metadata={'hnsw:space': 'cosine'},
        )
        self.embedder = SentenceTransformer(embedding_model)
        self.standards_store = standards_store
        self.ensure_index()

    def _embed(self, texts: list[str]):
        vectors = self.embedder.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vectors.tolist()

    def ensure_index(self):
        records = self.standards_store.all()
        existing = self.collection.count()
        if existing == len(records):
            return
        self.rebuild()

    def rebuild(self):
        records = self.standards_store.all()
        try:
            existing_ids = self.collection.get().get('ids', [])
            if existing_ids:
                self.collection.delete(ids=existing_ids)
        except Exception:
            pass
        ids = [r['standard_number'] for r in records]
        documents = [self.standards_store.text_for_embedding(r) for r in records]
        embeddings = self._embed(documents)
        metadatas = []
        for r in records:
            metadatas.append({
                'standard_number': r['standard_number'],
                'title': r['title'],
                'year': r.get('year') or '',
                'category': r.get('category') or '',
                'status': r.get('status') or '',
            })
        self.collection.add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        q = self._embed([query])[0]
        result = self.collection.query(query_embeddings=[q], n_results=top_k, include=['metadatas', 'distances', 'documents'])
        output = []
        for i, meta in enumerate(result.get('metadatas', [[]])[0]):
            distance = float(result['distances'][0][i])
            similarity = max(0.0, min(1.0, 1.0 - distance))
            record = self.standards_store.get(meta['standard_number'])
            if record:
                output.append({**record, 'vector_similarity': similarity})
        return output
