import json
from pathlib import Path
from typing import Any

class StandardsStore:
    def __init__(self, path: str):
        target = Path(path)
        if not target.exists():
            candidates = [
                Path(__file__).resolve().parent.parent.parent / "data" / "standards.json",
                Path("backend/data/standards.json"),
                Path("data/standards.json"),
            ]
            for c in candidates:
                if c.exists():
                    target = c
                    break
        self.path = target
        self.records: list[dict[str, Any]] = []
        self.by_number: dict[str, dict[str, Any]] = {}
        self.load()

    def load(self):
        with self.path.open('r', encoding='utf-8') as f:
            self.records = json.load(f)
        self.by_number = {r['standard_number'].lower(): r for r in self.records}

    def all(self):
        return self.records

    def get(self, standard_number: str):
        key = standard_number.lower().strip()
        if key in self.by_number:
            return self.by_number[key]
        compact = key.replace(' ', '')
        for k, v in self.by_number.items():
            if k.replace(' ', '') == compact:
                return v
        return None

    def text_for_embedding(self, record: dict[str, Any]) -> str:
        return ' | '.join([
            record.get('standard_number', ''),
            record.get('title', ''),
            record.get('category', ''),
            record.get('scope', ''),
            ' '.join(record.get('keywords', [])),
        ])
