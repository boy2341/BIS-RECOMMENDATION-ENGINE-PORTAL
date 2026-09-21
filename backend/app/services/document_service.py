import fitz

class DocumentService:
    @staticmethod
    def extract_pdf(data: bytes) -> str:
        doc = fitz.open(stream=data, filetype='pdf')
        try:
            text = '\n'.join(page.get_text('text') for page in doc)
        finally:
            doc.close()
        return text.strip()
