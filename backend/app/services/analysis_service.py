from typing import Any

class AnalysisService:
    def __init__(self, standards_store, vector_store, groq_service):
        self.standards_store = standards_store
        self.vector_store = vector_store
        self.groq = groq_service

    @staticmethod
    def _normalize(s: str) -> str:
        return ''.join(ch.lower() if ch.isalnum() or ch.isspace() else ' ' for ch in (s or '')).split()

    def _rank(self, understanding: dict, candidates: list[dict]) -> list[dict]:
        query_tokens = set(self._normalize(' '.join([
            understanding.get('product', ''),
            understanding.get('product_category', ''),
            understanding.get('application') or '',
            ' '.join(p['name'] + ' ' + p['value'] for p in understanding.get('parameters', [])),
            ' '.join(understanding.get('keywords', [])),
        ])))
        ranked = []
        for c in candidates:
            text_tokens = set(self._normalize(' '.join([
                c.get('title', ''), c.get('category', ''), c.get('scope', ''), ' '.join(c.get('keywords', []))
            ])))
            overlap = len(query_tokens & text_tokens) / max(1, len(query_tokens))
            category_match = 1.0 if understanding.get('product_category', '').lower() in c.get('category', '').lower() or c.get('category', '').lower() in understanding.get('product_category', '').lower() else 0.0
            score = (0.78 * float(c.get('vector_similarity', 0)) + 0.17 * overlap + 0.05 * category_match) * 100
            c = dict(c)
            c['final_score'] = round(max(0, min(100, score)), 1)
            ranked.append(c)
        return sorted(ranked, key=lambda x: x['final_score'], reverse=True)

    def _match_type(self, c: dict, index: int) -> str:
        cat = (c.get('category') or '').lower()
        if index == 0:
            return 'primary'
        if 'testing' in cat or 'vibration' in cat:
            return 'test'
        if 'safety' in cat or 'enclosure' in cat:
            return 'safety'
        if 'application' in cat:
            return 'reference'
        return 'related'

    def analyze(self, text: str, top_k: int = 5) -> dict[str, Any]:
        understanding = self.groq.extract_requirements(text)
        retrieval_query = ' '.join([
            understanding.get('product', ''),
            understanding.get('product_category', ''),
            understanding.get('application') or '',
            ' '.join(f"{p['name']} {p['value']}" for p in understanding.get('parameters', [])),
            ' '.join(understanding.get('keywords', [])),
        ])
        candidates = self.vector_store.search(retrieval_query, top_k=max(top_k, 6))
        ranked = self._rank(understanding, candidates)[:top_k]
        explanation = self.groq.explain(text, understanding, ranked)

        recommended = []
        related = []
        seen = set()
        for i, c in enumerate(ranked):
            item = {
                'standard_number': c['standard_number'],
                'title': c['title'],
                'year': c.get('year'),
                'relevance_score': c['final_score'],
                'match_type': self._match_type(c, i),
                'rationale': explanation.get('summary', '') if i == 0 else f"Semantic match with the product, application, and/or technical parameters extracted from the procurement text.",
                'status': c.get('status'),
                'amendment': c.get('amendment'),
                'source_url': c.get('source_url'),
            }
            recommended.append(item)
            for rel in c.get('relations', []):
                if rel['standard_number'] in seen or rel['standard_number'] in [x['standard_number'] for x in recommended]:
                    continue
                target = self.standards_store.get(rel['standard_number'])
                if target:
                    seen.add(rel['standard_number'])
                    related.append({
                        'standard_number': target['standard_number'],
                        'title': target['title'],
                        'relationship': rel['relationship'],
                        'source_url': target.get('source_url'),
                    })
        related = related[:8]

        category = understanding.get('product_category', '').lower()
        compliance = [
            {'item': 'BIS Product Certification / conformity requirement', 'status': 'verify', 'note': 'Verify whether the exact product category is covered by a compulsory certification requirement, licence scheme, or other applicable BIS requirement.'},
            {'item': 'CRS applicability', 'status': 'verify', 'note': 'Verify applicability only if the product falls within the current Compulsory Registration Scheme scope.'},
            {'item': 'Safety requirements', 'status': 'verify', 'note': 'Check product-specific safety, installation, testing, and workplace requirements before publishing the procurement specification.'},
        ]
        if 'motor' in category or 'electrical' in category:
            compliance.append({'item': 'Hallmarking', 'status': 'not-applicable', 'note': 'Hallmarking is generally associated with specified precious-metal goods, not ordinary industrial electrical equipment; verify if the product scope changes.'})
        else:
            compliance.append({'item': 'Hallmarking', 'status': 'unknown', 'note': 'Not inferred from the current category; verify only if the procurement item involves precious-metal goods covered by hallmarking requirements.'})

        checklist = [
            'Confirm the exact product category and intended application.',
            'Verify the recommended standard edition and current BIS status before issuing the tender.',
            'Check whether cited standards have applicable amendments or superseding standards.',
            'Confirm mandatory certification/conformity requirements separately from voluntary standards.',
            'Have the final procurement specification reviewed by the responsible technical/procurement authority.',
        ]
        return {
            'understanding': understanding,
            'recommended_standards': recommended,
            'related_standards': related,
            'compliance': compliance,
            'explanation': explanation,
            'procurement_checklist': checklist,
            'ai': {
                'provider': 'groq',
                'model': self.groq.model,
                'llm_enabled': True,
                'retrieval': 'ChromaDB + Sentence Transformers',
                'grounding': 'LLM receives only retrieved standards evidence for explanation/generation',
            },
        }
