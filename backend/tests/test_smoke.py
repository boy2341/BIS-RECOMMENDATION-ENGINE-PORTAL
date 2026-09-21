import json
from pathlib import Path


def test_standards_dataset_is_valid():
    path = Path(__file__).parents[1] / 'data' / 'standards.json'
    records = json.loads(path.read_text(encoding='utf-8'))
    assert len(records) >= 5
    assert all(r.get('standard_number') and r.get('title') for r in records)


def test_required_api_modules_import_without_startup():
    import app.schemas.api  # noqa: F401
    import app.services.groq_service  # noqa: F401
