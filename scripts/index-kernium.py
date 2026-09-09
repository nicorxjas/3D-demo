"""Rebuild the page/chunk index from the pinned Jungheinrich operating manual.
Run with Python + pypdf. Download is explicit via --download.
"""
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'data' / 'kernium'
URL = 'https://www.fallsway.com/hubfs/Fallsway_January2022/Pdf/efg-213-220-316k-320.pdf'
DEST.mkdir(parents=True, exist_ok=True)
pdf = DEST / 'manual.pdf'
if '--download' in sys.argv:
    urllib.request.urlretrieve(URL, pdf)
reader = PdfReader(pdf)
pages = []
chunks = []
for n, page in enumerate(reader.pages, 1):
    text = re.sub(r'[ \t]+', ' ', page.extract_text().replace('\ufffd', '-')).strip()
    label = re.search(r'\b([A-F])\s+(\d+)\b', text[:100])
    section = f'{label[1]} {label[2]}' if label else f'PDF {n}'
    pages.append({'page': n, 'section': section, 'text': text})
    # Page boundaries are never crossed; overlap retains nearby context.
    for offset in range(0, len(text), 2700):
        fragment = text[offset:offset + 3000]
        if len(fragment.strip()) < 40:
            continue
        chunks.append({'id': f'manual-p{n}-c{offset // 2700 + 1}', 'page': n,
                       'section': section, 'text': fragment})
index = {'document': '51099986', 'edition': '07.11', 'language': 'en',
         'manufacturer': 'Jungheinrich', 'sourceUrl': URL, 'pageCount': len(pages),
         'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(),
         'pages': pages, 'chunks': chunks}
(DEST / 'index.json').write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Indexed {len(pages)} pages / {len(chunks)} chunks; SHA-256 {index["sha256"]}')
