"""기존 vector_db.b64.txt → vector_db.js 변환 (1회용 헬퍼)"""
from pathlib import Path
ROOT = Path(__file__).resolve().parent
b64 = (ROOT / "vector_db.b64.txt").read_text(encoding="ascii").strip()
js = (
    "/* AUTO-GENERATED — do not edit. Regenerate via scripts/build_vector_db.py */\n"
    f'window.VECTOR_DB_B64 = "{b64}";\n'
    'window.VECTOR_DB_META = {model:"text-embedding-3-small",dimensions:512,count:305};\n'
)
out = ROOT / "vector_db.js"
out.write_text(js, encoding="utf-8")
print(f"Generated: {out.name} ({len(js):,} bytes)")
