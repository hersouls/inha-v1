"""
인하대 연구실 자료 벡터 DB 빌드 스크립트
- 입력: DOCS/01.논문/*_KO.md, DOCS/02.연구실/*.md
- 처리: 마크다운 헤딩 기반 청크 + 500자 분할 → OpenAI 임베딩 (512d)
- 출력: vector_db.b64.txt (gzip + base64, HTML 인라인용)
"""
from __future__ import annotations

import base64
import gzip
import json
import os
import re
import sys
import time

# Windows PowerShell cp949 환경에서 유니코드 출력 보장
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv
from openai import OpenAI

# ─── 설정 ────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DOCS_PAPERS = ROOT / "DOCS" / "01.논문"
DOCS_LAB = ROOT / "DOCS" / "02.연구실"
OUT_JSON = ROOT / "scripts" / "vector_db.json"      # 디버그용
OUT_B64 = ROOT / "scripts" / "vector_db.b64.txt"   # HTML 인라인용 (raw)
OUT_JS = ROOT / "scripts" / "vector_db.js"         # <script src> 로 로드 가능한 모듈
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 512                                     # 축소 차원
CHUNK_TARGET = 500                                  # 청크 목표 길이(문자)
CHUNK_HARD_MAX = 700                                # 강제 분할 임계
BATCH_SIZE = 100                                    # OpenAI 임베딩 배치

# ─── 데이터 모델 ─────────────────────────────────────────
@dataclass
class Chunk:
    id: int
    source: str          # 파일명 (확장자 제외)
    section: str         # 헤딩 경로 ("Publication > 2024")
    text: str
    embedding: list[float] | None = None


# ─── 한국어 비율 계산 (Research Area.md 필터링용) ────────
HANGUL_RE = re.compile(r"[가-힣]")

def is_korean_paragraph(text: str, threshold: float = 0.15) -> bool:
    """한글 문자 비율이 threshold 이상이면 한국어 단락으로 판단"""
    text = text.strip()
    if not text:
        return False
    # 코드 블록, 리스트 마커, 제목은 통과 (구조 보존)
    if text.startswith(("```", "#", "- ", "* ", "1.", "2.", "3.", "4.", "5.")):
        return True
    han = len(HANGUL_RE.findall(text))
    return han / max(len(text), 1) >= threshold


def filter_korean_only(md_text: str) -> str:
    """Research Area.md 같은 한/영 짝 마크다운에서 한국어 단락만 남김"""
    paragraphs = re.split(r"\n\s*\n", md_text)
    kept: list[str] = []
    for p in paragraphs:
        if is_korean_paragraph(p):
            kept.append(p.strip())
    return "\n\n".join(kept)


# ─── 마크다운 헤딩 기반 청킹 ─────────────────────────────
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)

def split_by_headings(md: str) -> list[tuple[str, str]]:
    """
    (heading_path, body) 리스트 반환.
    heading_path는 'H1 > H2 > H3' 형태.
    """
    sections: list[tuple[str, str]] = []
    stack: list[str] = []  # [(level, title)]
    pos = 0
    current_path = ""
    current_body: list[str] = []

    matches = list(HEADING_RE.finditer(md))
    if not matches:
        return [("", md.strip())]

    # 첫 헤딩 이전 본문
    if matches[0].start() > 0:
        prelude = md[:matches[0].start()].strip()
        if prelude:
            sections.append(("(서두)", prelude))

    for i, m in enumerate(matches):
        level = len(m.group(1))
        title = m.group(2).strip()
        # heading stack 갱신
        stack = [(lv, ti) for lv, ti in stack if lv < level]
        stack.append((level, title))
        path = " > ".join(t for _, t in stack)
        # 본문 = 이 헤딩 끝 ~ 다음 헤딩 시작
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        body = md[body_start:body_end].strip()
        if body:
            sections.append((path, body))
    return sections


def split_long_section(text: str, target: int = CHUNK_TARGET, hard_max: int = CHUNK_HARD_MAX) -> list[str]:
    """긴 섹션을 문장/줄바꿈 기준으로 ~target자씩 분할"""
    text = text.strip()
    if len(text) <= hard_max:
        return [text]

    # 1차: 빈 줄 기준 단락 분할
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    buf = ""
    for p in paras:
        # 단락 자체가 너무 길면 문장 단위로
        if len(p) > hard_max:
            sentences = re.split(r"(?<=[.!?。\n])\s+", p)
            for s in sentences:
                if len(buf) + len(s) + 1 > target and buf:
                    chunks.append(buf.strip())
                    buf = s
                else:
                    buf = (buf + " " + s).strip() if buf else s
        else:
            if len(buf) + len(p) + 2 > target and buf:
                chunks.append(buf.strip())
                buf = p
            else:
                buf = (buf + "\n\n" + p).strip() if buf else p
    if buf.strip():
        chunks.append(buf.strip())
    return chunks


# ─── 자료 로드 ───────────────────────────────────────────
def load_sources() -> list[Chunk]:
    """모든 한국어 자료를 로드하여 청크 리스트 반환 (임베딩 전)"""
    chunks: list[Chunk] = []
    next_id = 0

    # 01.논문: _KO.md만
    paper_files = sorted(DOCS_PAPERS.glob("*_KO.md"))
    for fp in paper_files:
        text = fp.read_text(encoding="utf-8")
        sections = split_by_headings(text)
        for path, body in sections:
            for piece in split_long_section(body):
                if len(piece.strip()) < 30:  # 너무 짧은 청크 스킵
                    continue
                chunks.append(Chunk(
                    id=next_id,
                    source=fp.stem.replace("_KO", ""),
                    section=path,
                    text=piece,
                ))
                next_id += 1

    # 02.연구실: 3개 파일
    lab_files = {
        "Lecture.md": False,           # 한국어 위주, 그대로
        "Publication.md": False,       # 영문 메타데이터, 그대로 (검색용)
        "Research Area.md": True,      # 한/영 짝 → 한국어만 추출
    }
    for fname, ko_only in lab_files.items():
        fp = DOCS_LAB / fname
        if not fp.exists():
            print(f"  ⚠ 파일 없음: {fp}")
            continue
        text = fp.read_text(encoding="utf-8")
        if ko_only:
            text = filter_korean_only(text)
        sections = split_by_headings(text)
        for path, body in sections:
            for piece in split_long_section(body):
                if len(piece.strip()) < 30:
                    continue
                chunks.append(Chunk(
                    id=next_id,
                    source=fp.stem,
                    section=path,
                    text=piece,
                ))
                next_id += 1

    return chunks


# ─── OpenAI 임베딩 (배치 + 재시도) ───────────────────────
def embed_batch(client: OpenAI, texts: list[str], retries: int = 3) -> list[list[float]]:
    for attempt in range(retries):
        try:
            resp = client.embeddings.create(
                model=EMBED_MODEL,
                input=texts,
                dimensions=EMBED_DIM,
            )
            return [d.embedding for d in resp.data]
        except Exception as e:
            wait = 2 ** attempt
            print(f"  ⚠ 임베딩 실패 (시도 {attempt+1}/{retries}): {e} — {wait}s 후 재시도")
            time.sleep(wait)
    raise RuntimeError("임베딩 호출 실패 (재시도 초과)")


def embed_all(chunks: list[Chunk]) -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or api_key.startswith("여기에"):
        print("❌ OPENAI_API_KEY가 .env에 설정되지 않았습니다.")
        print(f"   파일 경로: {ROOT / '.env'}")
        sys.exit(1)
    client = OpenAI(api_key=api_key)

    total = len(chunks)
    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        texts = [c.text for c in batch]
        print(f"  임베딩 진행: {i + len(batch)}/{total}")
        vecs = embed_batch(client, texts)
        for c, v in zip(batch, vecs):
            c.embedding = v


# ─── 출력 (JSON + gzip + base64) ─────────────────────────
def save_outputs(chunks: list[Chunk]) -> dict:
    payload = {
        "model": EMBED_MODEL,
        "dimensions": EMBED_DIM,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "count": len(chunks),
        "chunks": [
            {
                "id": c.id,
                "source": c.source,
                "section": c.section,
                "text": c.text,
                "embedding": c.embedding,
            }
            for c in chunks
        ],
    }
    # JSON (디버그용)
    json_bytes = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    OUT_JSON.write_bytes(json_bytes)

    # gzip + base64 (HTML 인라인용)
    gz = gzip.compress(json_bytes, compresslevel=9)
    b64 = base64.b64encode(gz).decode("ascii")
    OUT_B64.write_text(b64, encoding="ascii")

    # JS 모듈 (<script src="vector_db.js">로 로드 가능)
    js_content = (
        "/* AUTO-GENERATED — do not edit. Regenerate via scripts/build_vector_db.py */\n"
        f'window.VECTOR_DB_B64 = "{b64}";\n'
        f'window.VECTOR_DB_META = {{model:"{EMBED_MODEL}",dimensions:{EMBED_DIM},count:{len(chunks)}}};\n'
    )
    OUT_JS.write_text(js_content, encoding="utf-8")

    stats = {
        "chunks": len(chunks),
        "json_bytes": len(json_bytes),
        "gzip_bytes": len(gz),
        "b64_chars": len(b64),
        "js_bytes": len(js_content.encode("utf-8")),
    }
    return stats


# ─── 메인 ────────────────────────────────────────────────
def main() -> None:
    print("=" * 60)
    print("인하대 연구실 벡터 DB 빌드")
    print("=" * 60)

    print("\n[1/3] 자료 로드 + 청크 분할…")
    chunks = load_sources()
    print(f"  → 총 청크: {len(chunks)}개")
    # 소스별 통계
    by_src: dict[str, int] = {}
    for c in chunks:
        by_src[c.source] = by_src.get(c.source, 0) + 1
    for src, n in sorted(by_src.items(), key=lambda x: -x[1]):
        print(f"    - {src}: {n}개")

    avg_len = sum(len(c.text) for c in chunks) / max(len(chunks), 1)
    print(f"  → 평균 청크 길이: {avg_len:.0f}자")
    est_tokens = sum(len(c.text) for c in chunks) // 2  # 한국어 대략 2자=1토큰
    est_cost = est_tokens / 1_000_000 * 0.02
    print(f"  → 예상 토큰: ~{est_tokens:,} / 예상 비용: ${est_cost:.4f}")

    print(f"\n[2/3] OpenAI 임베딩 생성 ({EMBED_MODEL}, {EMBED_DIM}d)…")
    embed_all(chunks)

    print("\n[3/3] 출력 파일 생성…")
    stats = save_outputs(chunks)
    print(f"  → JSON     : {OUT_JSON.name}  ({stats['json_bytes']:,} bytes)")
    print(f"  → gzip     : {stats['gzip_bytes']:,} bytes  ({stats['gzip_bytes']*100/stats['json_bytes']:.1f}%)")
    print(f"  → base64   : {OUT_B64.name}  ({stats['b64_chars']:,} chars)")
    print(f"  → JS 모듈  : {OUT_JS.name}  ({stats['js_bytes']:,} bytes)")

    print("\n✅ 완료. HTML에서 사용 방법:")
    print(f"   <script src=\"scripts/{OUT_JS.name}\"></script>")


if __name__ == "__main__":
    main()
