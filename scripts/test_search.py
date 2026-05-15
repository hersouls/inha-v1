"""
벡터 DB 검색 품질 검증 스크립트
샘플 쿼리로 top-3 결과를 출력하여 임베딩 품질 확인
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Windows PowerShell cp949 호환
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "scripts" / "vector_db.json"

SAMPLE_QUERIES = [
    "VPP 가상발전소 전압 안정도",
    "전기자동차 V2G 충전 인프라",
    "탄소중립과 분산에너지",
    "ESS 에너지저장장치 최적 운영",
    "Won 교수 연구 분야",
    "전력시스템 수업 과목",
]

def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def main() -> None:
    load_dotenv(ROOT / ".env")
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    print(f"DB 로드: {DB_PATH}")
    db = json.loads(DB_PATH.read_text(encoding="utf-8"))
    print(f"  모델: {db['model']} ({db['dimensions']}d)")
    print(f"  청크 수: {db['count']}\n")

    embeddings = np.array([c["embedding"] for c in db["chunks"]], dtype=np.float32)
    chunks = db["chunks"]

    for q in SAMPLE_QUERIES:
        print("=" * 70)
        print(f"질문: {q}")
        print("-" * 70)
        resp = client.embeddings.create(
            model=db["model"],
            input=[q],
            dimensions=db["dimensions"],
        )
        qv = np.array(resp.data[0].embedding, dtype=np.float32)
        # 코사인 유사도 (벡터화)
        scores = embeddings @ qv / (
            np.linalg.norm(embeddings, axis=1) * np.linalg.norm(qv) + 1e-9
        )
        top_idx = np.argsort(-scores)[:3]
        for rank, i in enumerate(top_idx, 1):
            c = chunks[i]
            preview = c["text"].replace("\n", " ")[:120]
            print(f"  #{rank} [score={scores[i]:.3f}] {c['source'][:60]}")
            print(f"      섹션: {c['section'][:60]}")
            print(f"      본문: {preview}…")
        print()


if __name__ == "__main__":
    main()
