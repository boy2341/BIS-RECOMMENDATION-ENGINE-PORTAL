import json
from groq import Groq

EXTRACTION_SCHEMA = {
    'type': 'object',
    'properties': {
        'product': {'type': 'string'},
        'product_category': {'type': 'string'},
        'application': {'type': ['string', 'null']},
        'language': {'type': 'string'},
        'confidence': {'type': 'number'},
        'parameters': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'value': {'type': 'string'},
                    'confidence': {'type': 'number'},
                },
                'required': ['name', 'value', 'confidence'],
                'additionalProperties': False,
            },
        },
        'keywords': {'type': 'array', 'items': {'type': 'string'}},
    },
    'required': ['product', 'product_category', 'application', 'language', 'confidence', 'parameters', 'keywords'],
    'additionalProperties': False,
}

EXPLANATION_SCHEMA = {
    'type': 'object',
    'properties': {
        'summary': {'type': 'string'},
        'primary_reason': {'type': 'string'},
        'matching_factors': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {'factor': {'type': 'string'}, 'evidence': {'type': 'string'}, 'strength': {'type': 'number'}},
                'required': ['factor', 'evidence', 'strength'],
                'additionalProperties': False,
            },
        },
        'caution': {'type': 'string'},
    },
    'required': ['summary', 'primary_reason', 'matching_factors', 'caution'],
    'additionalProperties': False,
}

SPEC_SCHEMA = {
    'type': 'object',
    'properties': {
        'title': {'type': 'string'},
        'clause': {'type': 'string'},
        'required_fields': {'type': 'array', 'items': {'type': 'string'}},
        'notes': {'type': 'array', 'items': {'type': 'string'}},
    },
    'required': ['title', 'clause', 'required_fields', 'notes'],
    'additionalProperties': False,
}

class GroqService:
    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise RuntimeError('GROQ_API_KEY is not configured. Add it to backend/.env.')
        self.client = Groq(api_key=api_key)
        self.model = model

    def _json_call(self, system: str, user: str, schema_name: str, schema: dict) -> dict:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            response_format={
                'type': 'json_schema',
                'json_schema': {'name': schema_name, 'strict': True, 'schema': schema},
            },
            include_reasoning=False,
            temperature=0.1,
        )
        content = response.choices[0].message.content or '{}'
        return json.loads(content)

    def extract_requirements(self, text: str) -> dict:
        return self._json_call(
            '''You are the requirements extraction component of IS-Assist, an Indian Standards recommendation system.
Extract only facts supported by the supplied procurement text. Never invent a technical parameter. Preserve units and values.
Identify the likely product and category, application, language, and the most useful technical parameters for standards retrieval.
Confidence must be between 0 and 1. If a field is not stated, use null for application and do not fabricate parameters.''',
            text,
            'procurement_requirements',
            EXTRACTION_SCHEMA,
        )

    def explain(self, user_text: str, understanding: dict, candidates: list[dict]) -> dict:
        evidence = []
        for c in candidates:
            evidence.append({
                'standard_number': c['standard_number'],
                'title': c['title'],
                'scope': c.get('scope', ''),
                'category': c.get('category', ''),
                'vector_similarity': round(float(c.get('vector_similarity', 0)), 4),
                'status': c.get('status', ''),
            })
        return self._json_call(
            '''You are the explanation component of IS-Assist.
You must explain recommendations ONLY from the supplied procurement text, extracted requirements, and retrieved standard evidence.
Never invent a standard number, title, scope, certification requirement, amendment, or legal obligation.
A retrieved standard is a candidate, not proof of legal applicability. Make that distinction clear.
Do not say a standard is the latest unless the evidence explicitly says so.''',
            json.dumps({'procurement_text': user_text, 'understanding': understanding, 'retrieved_candidates': evidence}, ensure_ascii=False),
            'standard_explanation',
            EXPLANATION_SCHEMA,
        )

    def generate_specification(self, product: str, requirements: list[dict], standards: list[dict], context: str) -> dict:
        evidence = [
            {'standard_number': s.get('standard_number'), 'title': s.get('title'), 'status': s.get('status'), 'scope': s.get('scope')}
            for s in standards
        ]
        return self._json_call(
            '''You are the procurement clause generator for IS-Assist.
Generate a concise, professional draft procurement specification using ONLY the supplied requirements and standard evidence.
Never invent a standard number. Never claim mandatory certification unless the supplied evidence explicitly supports it.
If a standard's current status is uncertain, instruct the buyer to verify the current BIS edition/status before publishing the tender.
The clause is a draft for human review, not legal advice.''',
            json.dumps({'product': product, 'requirements': requirements, 'standards': evidence, 'context': context}, ensure_ascii=False),
            'procurement_specification',
            SPEC_SCHEMA,
        )
