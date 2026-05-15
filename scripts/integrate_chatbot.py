"""
AI_시대의_업무방식.html 에 RAG 챗봇 위젯을 인라인으로 통합

- 기존 챗봇 코드가 있으면 교체 (멱등성)
- 없으면 </head> 직전에 CSS, </body> 직전에 JS+DOM 삽입
- vector_db.js + rag_client.js를 인라인으로 합침 (외부 의존 0)

재실행 시: 챗봇 코드만 새 버전으로 교체, HTML 본문은 보존.
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "AI_시대의_업무방식.html"
VECTOR_JS = ROOT / "scripts" / "vector_db.js"
RAG_JS = ROOT / "scripts" / "rag_client.js"

# 마커 — 재실행 시 이 사이를 통째로 교체
CSS_START = "<!-- IRAG_CSS_START -->"
CSS_END = "<!-- IRAG_CSS_END -->"
JS_START = "<!-- IRAG_JS_START -->"
JS_END = "<!-- IRAG_JS_END -->"

# ─── 위젯 CSS (head에 삽입) ──────────────────────────────
WIDGET_CSS = """
<style id="irag-style">
/* 인하대 RAG 챗봇 위젯 — 모든 클래스 irag- 접두어로 격리 */
.irag-fab{
  position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:50%;
  background:linear-gradient(135deg,#e0282f,#8e1419);color:#fff;border:0;cursor:pointer;
  display:grid;place-items:center;font-family:inherit;
  box-shadow:0 8px 24px rgba(224,40,47,.35),0 2px 6px rgba(0,0,0,.12);
  z-index:99998;transition:transform .18s ease,box-shadow .18s ease;
}
.irag-fab:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(224,40,47,.45),0 4px 10px rgba(0,0,0,.15)}
.irag-fab svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.irag-fab__badge{
  position:absolute;top:-4px;right:-4px;background:#fff;color:#bb1b21;font-size:10px;
  font-weight:800;padding:2px 6px;border-radius:10px;letter-spacing:.02em;
  box-shadow:0 2px 6px rgba(0,0,0,.15);
}

.irag-panel{
  position:fixed;right:24px;bottom:96px;width:min(420px,calc(100vw - 32px));
  height:min(640px,calc(100vh - 120px));background:#fff;border-radius:16px;
  border:1px solid #e9eaee;box-shadow:0 24px 60px rgba(0,0,0,.18);
  display:none;flex-direction:column;overflow:hidden;z-index:99999;
  font-family:"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  color:#191a1b;
}
.irag-panel.is-open{display:flex;animation:iragSlideUp .22s cubic-bezier(.2,.8,.2,1)}
@keyframes iragSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.irag-header{
  display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e9eaee;
  background:linear-gradient(135deg,#fdeded,#fff);
}
.irag-header__avatar{
  width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#e0282f,#8e1419);
  display:grid;place-items:center;color:#fff;font-weight:800;font-size:12px;flex:0 0 32px;
}
.irag-header__title{flex:1;min-width:0}
.irag-header__title strong{display:block;font-size:13.5px;font-weight:800;color:#191a1b;line-height:1.2}
.irag-header__title span{display:block;font-size:11px;color:#6f737b;margin-top:2px}
.irag-header button{
  border:0;background:transparent;color:#55585d;cursor:pointer;width:30px;height:30px;
  border-radius:8px;display:grid;place-items:center;transition:background .15s;
}
.irag-header button:hover{background:#f3f4f6;color:#191a1b}
.irag-header button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

.irag-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:#fafafa}
.irag-msgs:empty::before{
  content:"인하대 전력시스템 연구실 자료에 대해\\A질문해 보세요. 예:\\A• \\\"VPP 전압 안정도 알고리즘은?\\\"\\A• \\\"V2G 관련 논문 알려줘\\\"";
  white-space:pre-line;color:#8b8f97;font-size:12.5px;text-align:center;margin:auto;line-height:1.7;
}
.irag-msg{display:flex;gap:8px;align-items:flex-start;animation:iragFadeIn .2s ease}
@keyframes iragFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.irag-msg__avatar{
  flex:0 0 26px;height:26px;border-radius:50%;display:grid;place-items:center;
  font-size:10px;font-weight:800;color:#fff;
}
.irag-msg--user .irag-msg__avatar{background:#3d3f43}
.irag-msg--bot  .irag-msg__avatar{background:linear-gradient(135deg,#e0282f,#8e1419)}
.irag-msg__body{flex:1;min-width:0}
.irag-msg__text{
  font-size:13px;line-height:1.6;color:#191a1b;background:#fff;border-radius:10px;
  padding:9px 12px;white-space:pre-wrap;word-break:break-word;border:1px solid #e9eaee;
}
.irag-msg--user .irag-msg__text{background:#e9eaee;border-color:transparent}
.irag-sources{margin-top:6px;display:flex;flex-direction:column;gap:5px}
.irag-src{
  font-size:11px;color:#3d3f43;background:#fff;border:1px solid #e9eaee;border-left:3px solid #e0282f;
  border-radius:6px;padding:7px 9px;
}
.irag-src__head{display:flex;justify-content:space-between;gap:6px;font-weight:700;color:#232425;margin-bottom:2px}
.irag-src__score{color:#bb1b21;font-variant-numeric:tabular-nums;font-size:10.5px}
.irag-src__path{color:#6f737b;font-weight:500;font-size:10.5px;margin-bottom:3px}
.irag-src__text{color:#55585d;line-height:1.5}

.irag-input-wrap{
  border-top:1px solid #e9eaee;padding:10px;display:flex;gap:6px;background:#fff;
}
.irag-input{
  flex:1;resize:none;border:1px solid #c7cad1;border-radius:10px;padding:9px 11px;
  font-family:inherit;font-size:13px;line-height:1.5;outline:none;min-height:38px;max-height:100px;
  color:#191a1b;background:#fff;
}
.irag-input:focus{border-color:#e0282f;box-shadow:0 0 0 3px rgba(224,40,47,.1)}
.irag-send{
  border:0;background:linear-gradient(135deg,#e0282f,#8e1419);color:#fff;
  font-weight:700;font-size:13px;border-radius:10px;padding:0 14px;cursor:pointer;min-width:54px;
}
.irag-send:disabled{background:#c7cad1;cursor:not-allowed}

.irag-typing{display:inline-block;width:18px;text-align:left;color:#8b8f97}
.irag-typing::after{content:"●";animation:iragDots 1.2s steps(3,end) infinite}
@keyframes iragDots{0%{content:"●"}33%{content:"● ●"}66%{content:"● ● ●"}}

/* API 키 입력 모달 */
.irag-modal{
  position:absolute;inset:0;background:rgba(255,255,255,.96);
  display:none;flex-direction:column;justify-content:center;padding:24px;z-index:1;
  backdrop-filter:blur(4px);
}
.irag-modal.is-open{display:flex}
.irag-modal h3{font-size:15px;font-weight:800;color:#191a1b;margin:0 0 6px;letter-spacing:-0.01em}
.irag-modal p{font-size:12.5px;color:#55585d;margin:0 0 14px;line-height:1.55}
.irag-modal p a{color:#bb1b21;text-decoration:underline;font-weight:600}
.irag-modal__row{display:flex;gap:6px;margin-bottom:10px}
.irag-modal__row input{
  flex:1;border:1px solid #c7cad1;border-radius:8px;padding:9px 11px;
  font-family:inherit;font-size:13px;outline:none;font-feature-settings:"tnum";
}
.irag-modal__row input:focus{border-color:#e0282f;box-shadow:0 0 0 3px rgba(224,40,47,.1)}
.irag-modal__row button{
  border:0;background:#bb1b21;color:#fff;font-weight:700;font-size:12.5px;
  border-radius:8px;padding:9px 14px;cursor:pointer;
}
.irag-modal__hint{font-size:11px;color:#8b8f97;line-height:1.5}
.irag-modal__hint strong{color:#bb1b21}

/* 모바일 최적화 */
@media (max-width:520px){
  .irag-panel{
    right:0;bottom:0;width:100vw;height:100vh;max-height:100vh;border-radius:0;
  }
  .irag-fab{right:16px;bottom:16px}
}
</style>
"""

# ─── 위젯 DOM (body 끝에 삽입) ────────────────────────────
WIDGET_DOM = """
<button class="irag-fab" id="irag-fab" aria-label="AI 챗봇 열기" title="연구실 자료 검색 챗봇">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
  <span class="irag-fab__badge" id="irag-fab-badge">RAG</span>
</button>

<div class="irag-panel" id="irag-panel" role="dialog" aria-label="연구실 자료 RAG 챗봇" aria-modal="false">
  <div class="irag-header">
    <div class="irag-header__avatar">AI</div>
    <div class="irag-header__title">
      <strong>연구실 자료 챗봇</strong>
      <span id="irag-meta">로딩 중…</span>
    </div>
    <button id="irag-key-btn" title="API 키 설정" aria-label="API 키 설정">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
    <button id="irag-close-btn" title="닫기" aria-label="닫기">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <div class="irag-modal" id="irag-modal">
    <h3>OpenAI API 키 설정</h3>
    <p>챗봇 사용에 OpenAI API 키가 필요합니다. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a> 에서 발급받으세요.</p>
    <div class="irag-modal__row">
      <input type="password" id="irag-key-input" placeholder="sk-..." autocomplete="off" />
      <button id="irag-key-save">저장</button>
    </div>
    <div class="irag-modal__hint">
      <strong>안전:</strong> 키는 본인 브라우저(localStorage)에만 저장되며, 서버로 전송되지 않습니다. OpenAI 외 외부에 공유되지 않습니다.
    </div>
  </div>

  <div class="irag-msgs" id="irag-msgs"></div>

  <div class="irag-input-wrap">
    <textarea class="irag-input" id="irag-input" placeholder="질문을 입력하세요 (Enter 전송)" disabled></textarea>
    <button class="irag-send" id="irag-send" disabled>전송</button>
  </div>
</div>
"""

# ─── 위젯 마운트 JS (body 끝, vector_db.js + rag_client.js 다음에 삽입) ──
WIDGET_JS = """
<script>
/* 인하대 RAG 챗봇 위젯 마운트 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY_STORE = 'inha_rag_openai_key';

  const fab = $('irag-fab');
  const panel = $('irag-panel');
  const closeBtn = $('irag-close-btn');
  const keyBtn = $('irag-key-btn');
  const modal = $('irag-modal');
  const keyInput = $('irag-key-input');
  const keySave = $('irag-key-save');
  const meta = $('irag-meta');
  const msgsEl = $('irag-msgs');
  const inputEl = $('irag-input');
  const sendBtn = $('irag-send');

  let rag = null;
  let busy = false;
  let history = [];

  /* 패널 열고 닫기 */
  function openPanel() {
    panel.classList.add('is-open');
    setTimeout(() => inputEl.focus(), 100);
  }
  function closePanel() {
    panel.classList.remove('is-open');
  }
  fab.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) closePanel(); else openPanel();
  });
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });

  /* API 키 모달 */
  function openKeyModal() { modal.classList.add('is-open'); keyInput.focus(); }
  function closeKeyModal() { modal.classList.remove('is-open'); }
  keyBtn.addEventListener('click', openKeyModal);
  keySave.addEventListener('click', () => {
    const k = keyInput.value.trim();
    if (!k.startsWith('sk-')) { keyInput.style.borderColor = '#e0282f'; return; }
    localStorage.setItem(KEY_STORE, k);
    if (rag) rag.setApiKey(k);
    keyInput.style.borderColor = '';
    closeKeyModal();
    enableInput();
  });
  keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') keySave.click(); });

  function enableInput() {
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.placeholder = '질문을 입력하세요 (Enter 전송)';
  }
  function disableInput(reason) {
    inputEl.disabled = true;
    sendBtn.disabled = true;
    inputEl.placeholder = reason || '준비 중…';
  }

  /* 메시지 렌더링 */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function addMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `irag-msg irag-msg--${role}`;
    wrap.innerHTML = `<div class="irag-msg__avatar">${role==='user'?'You':'AI'}</div><div class="irag-msg__body"><div class="irag-msg__text"></div></div>`;
    wrap.querySelector('.irag-msg__text').textContent = text;
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return wrap.querySelector('.irag-msg__text');
  }
  function addSources(sources) {
    if (!sources || !sources.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'irag-sources';
    sources.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'irag-src';
      const preview = s.text.replace(/\\s+/g, ' ').slice(0, 140);
      div.innerHTML = `
        <div class="irag-src__head">
          <span>${i+1}. ${escapeHtml(s.source.slice(0, 50))}${s.source.length>50?'…':''}</span>
          <span class="irag-src__score">${(s.score*100).toFixed(0)}%</span>
        </div>
        <div class="irag-src__path">${escapeHtml(s.section || '')}</div>
        <div class="irag-src__text">${escapeHtml(preview)}…</div>`;
      wrap.appendChild(div);
    });
    msgsEl.lastChild.querySelector('.irag-msg__body').appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  /* 전송 */
  async function send() {
    if (busy || !rag) return;
    if (!rag.opts.apiKey) { openKeyModal(); return; }
    const q = inputEl.value.trim();
    if (!q) return;
    busy = true;
    sendBtn.disabled = true;
    inputEl.value = '';
    addMsg('user', q);
    const targetEl = addMsg('bot', '');
    targetEl.innerHTML = '<span class="irag-typing"></span>';
    try {
      let firstToken = true;
      const result = await rag.chat(q, {
        history: history.slice(-6),
        onToken: (delta, full) => {
          if (firstToken) { targetEl.textContent = ''; firstToken = false; }
          targetEl.textContent = full;
          msgsEl.scrollTop = msgsEl.scrollHeight;
        },
      });
      if (firstToken) targetEl.textContent = result.text;
      addSources(result.sources);
      history.push({ role: 'user', content: q });
      history.push({ role: 'assistant', content: result.text });
    } catch (e) {
      targetEl.textContent = '오류: ' + e.message;
      targetEl.style.color = '#bb1b21';
    } finally {
      busy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }
  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  /* 초기화 — RAG 클라이언트 로드 */
  (async () => {
    try {
      rag = await RAGClient.init();
      if (window.VECTOR_DB_META) {
        meta.textContent = `${VECTOR_DB_META.count} 청크 · ${VECTOR_DB_META.dimensions}d`;
      }
      const savedKey = localStorage.getItem(KEY_STORE);
      if (savedKey) {
        rag.setApiKey(savedKey);
        enableInput();
      } else {
        disableInput('우측 상단 ⚙️ 클릭 → API 키 설정');
      }
    } catch (e) {
      meta.textContent = '로드 실패';
      console.error('[INHA RAG]', e);
      disableInput('초기화 실패: ' + e.message);
    }
  })();
})();
</script>
"""


def remove_existing(html: str) -> str:
    """기존 챗봇 코드 제거 (멱등성)"""
    # CSS 블록 제거
    html = re.sub(
        re.escape(CSS_START) + r".*?" + re.escape(CSS_END) + r"\n?",
        "",
        html,
        flags=re.DOTALL,
    )
    # JS+DOM 블록 제거
    html = re.sub(
        re.escape(JS_START) + r".*?" + re.escape(JS_END) + r"\n?",
        "",
        html,
        flags=re.DOTALL,
    )
    return html


def main() -> None:
    print("=" * 60)
    print("AI_시대의_업무방식.html 챗봇 통합")
    print("=" * 60)

    if not HTML.exists():
        print(f"❌ HTML 없음: {HTML}")
        sys.exit(1)
    if not VECTOR_JS.exists() or not RAG_JS.exists():
        print(f"❌ JS 모듈 없음. build_vector_db.py 먼저 실행 필요.")
        sys.exit(1)

    html = HTML.read_text(encoding="utf-8")
    original_size = len(html.encode("utf-8"))
    print(f"\n원본 HTML: {original_size:,} bytes ({original_size/1024:.1f} KB)")

    # 기존 챗봇 코드 제거
    html_clean = remove_existing(html)
    if len(html_clean) != len(html):
        print(f"  → 기존 챗봇 코드 제거됨 ({len(html) - len(html_clean):,} bytes)")
        html = html_clean

    # 인라인 스크립트 본문 로드
    vector_js_body = VECTOR_JS.read_text(encoding="utf-8").rstrip()
    rag_js_body = RAG_JS.read_text(encoding="utf-8").rstrip()

    # CSS 블록 (마커 포함)
    css_block = f"\n{CSS_START}\n{WIDGET_CSS.strip()}\n{CSS_END}\n"

    # JS+DOM 블록: vector_db + rag_client + 위젯 DOM + 위젯 마운트 JS
    js_block = (
        f"\n{JS_START}\n"
        f"{WIDGET_DOM.strip()}\n"
        f"<script>\n/* === inlined vector_db.js === */\n{vector_js_body}\n</script>\n"
        f"<script>\n/* === inlined rag_client.js === */\n{rag_js_body}\n</script>\n"
        f"{WIDGET_JS.strip()}\n"
        f"{JS_END}\n"
    )

    # 삽입: </head> 직전, </body> 직전
    if "</head>" not in html or "</body>" not in html:
        print("❌ </head> 또는 </body> 태그 없음")
        sys.exit(1)

    html = html.replace("</head>", css_block + "</head>", 1)
    html = html.replace("</body>", js_block + "</body>", 1)

    HTML.write_text(html, encoding="utf-8")
    new_size = len(html.encode("utf-8"))
    delta = new_size - original_size
    print(f"\n✅ 통합 완료")
    print(f"  → 새 HTML : {new_size:,} bytes ({new_size/1024:.1f} KB)")
    print(f"  → 증가량  : {delta:+,} bytes ({delta/1024:+.1f} KB)")
    print(f"  → 백업    : {HTML.name}.bak")
    print(f"\n브라우저에서 열어 우측 하단 ⓘ 챗봇 버튼을 확인하세요.")


if __name__ == "__main__":
    main()
