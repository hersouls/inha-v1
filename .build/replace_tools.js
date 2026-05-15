// Batch-replace AI tooling references in slides.html
// - Replace "Claude Code" mentions in Ch 2~4 with "Antigravity · Claude CLI"
// - Expand References slides to show various tool combinations
const fs = require('fs');
const path = 'D:/Moonwave_Web/INHA_v1.0/.build/slides.html';
let s = fs.readFileSync(path, 'utf8');
const before = s.length;

const reps = [
  // Common chip patterns
  ['<span class="tool-chip kt"><strong>Claude Code</strong></span>',
   '<span class="tool-chip kt"><strong>Antigravity · Claude CLI</strong></span>'],
  ['<span class="wf-step__tool"><strong>Claude Code</strong></span>',
   '<span class="wf-step__tool"><strong>Antigravity · Claude CLI</strong></span>'],

  // Slide 26 title
  ['<h2 class="s-title">Claude Code → <strong>단일 HTML 보고서</strong></h2>',
   '<h2 class="s-title">Antigravity · Claude CLI → <strong>단일 HTML 보고서</strong></h2>'],

  // Slide 27 qa-step small
  ['<small>Claude Code → 단일 HTML 보고서 작성</small>',
   '<small>Antigravity · Claude CLI → 단일 HTML 보고서 작성</small>'],

  // Slide 28 tl-step (HTML 자동 생성)
  ['<span class="tl-step__tool">Claude Code</span><span class="tl-step__what">HTML 자동 생성</span>',
   '<span class="tl-step__tool">Antigravity · CCLI</span><span class="tl-step__what">HTML 자동 생성</span>'],

  // Slide 42 tl-step (src/ 자동 작성)
  ['<span class="tl-step__tool">Claude Code</span><span class="tl-step__what">src/ 자동 작성</span>',
   '<span class="tl-step__tool">Antigravity · CCLI</span><span class="tl-step__what">src/ 자동 작성</span>'],

  // Slide 43 rec ③ desc
  ['<span class="rec__desc">Claude Code로 React/Firebase 코드 작성. 사람은 도메인 정합성·성능·보안 검토</span>',
   '<span class="rec__desc">Antigravity · Claude CLI로 코드 작성 · 사람은 도메인·보안 검토</span>'],

  // Slide 48 takeaway
  ['Claude Code · Cursor · 로컬 LLM',
   'Antigravity · Claude CLI · 로컬 LLM'],

  // Slide 50 AI PC card 에이전트 작업 line
  ['<li><strong>에이전트 작업</strong> · Claude Code · Cursor · 자동 PR · 리팩터</li>',
   '<li><strong>에이전트 작업</strong> · Antigravity · Claude CLI · 자동 PR · 리팩터</li>'],

  // Slide 51 arch-stack tech chips (compute layer)
  ['<span class="strong">Ollama</span><span>Local RAG</span><span>Claude Code</span><span>Agents</span>',
   '<span class="strong">Ollama</span><span>Local RAG</span><span class="strong">Antigravity</span><span class="strong">Claude CLI</span><span>Agents</span>'],

  // Slide 52 rec ⑤ desc
  ['<span class="rec__desc">개인 메모 → 벡터 → Claude Code · Cursor 참조</span>',
   '<span class="rec__desc">개인 메모 → 벡터 → Antigravity · Claude CLI 참조</span>'],

  // Slide 35 big-step ② desc — show combinations explicitly
  ['AI가 <code class="inline">src/</code> 전체를 작성한다. <strong>30 Zustand 스토어 · 25+ Firestore 컬렉션 · 3 역할 · 5계위 계약</strong>. 동작하는 v1이 2~4주에 완성된다.',
   '<strong>Google AI 구독 시 Antigravity, 없으면 VS Code + Claude CLI</strong>가 <code class="inline">src/</code> 전체를 작성한다. 30 Zustand 스토어 · 25+ Firestore 컬렉션 · 3 역할 · 5계위 계약. 동작하는 v1이 2~4주에 완성된다.'],

  // Slide 37 hero-stat sub — make AI concrete
  ['<em>예시 — KT 직접PPA: src/ 전체(30+ 스토어 · 25+ 컬렉션 · 3 역할 · 5 계위 계약 검증)를 AI가 작성하고, 사람은 정산 엔진 비즈니스 결정 · 권한 격리 검증에 집중.</em>',
   '<em>예시 — KT 직접PPA: src/ 전체(30+ 스토어 · 25+ 컬렉션 · 3 역할 · 5 계위 계약 검증)를 <strong>Antigravity · Claude CLI</strong>가 작성하고, 사람은 정산 엔진 비즈니스 결정 · 권한 격리 검증에 집중.</em>'],

  // Slide 31 (Ch2 References) AI cell — expand to combinations
  ['              <li><strong>Claude Code</strong> · 분석 코드 · HTML 보고서 작성<span class="url">code.claude.com</span></li>',
   '              <li><strong>조합 A · Antigravity 단독</strong> — Google AI 구독 · Gemini 3 기반 agentic IDE<span class="url">antigravity.google</span></li>\n              <li><strong>조합 B · VS Code + Claude CLI</strong> — 구독 없이도 · 가장 보편<span class="url">code.claude.com</span></li>\n              <li><strong>조합 C · Antigravity + Claude CLI</strong> — 동시 활용 (본 발표자)</li>\n              <li><strong>조합 D · Cursor · Codex CLI · Copilot</strong> — 사내 표준 따라 선택</li>\n              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시 우선</li>'],

  // Slide 44 (Ch3 References) AI cell — expand to combinations
  ['              <li><strong>Claude Code</strong> · src/ 자동 작성 · 시각 검증</li>',
   '              <li><strong>조합 A · Antigravity 단독</strong> — Google AI 구독 · Gemini 3 agentic IDE</li>\n              <li><strong>조합 B · VS Code + Claude CLI</strong> — 구독 없이도 · 가장 보편</li>\n              <li><strong>조합 C · Antigravity + Claude CLI</strong> — 동시 활용 (본 발표자)</li>\n              <li><strong>조합 D · Cursor · Codex CLI</strong> — 다른 IDE 옵션</li>\n              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시</li>'],
];

let applied = 0;
const notFound = [];
for (const [from, to] of reps) {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    applied++;
  } else {
    notFound.push(from.substring(0, 80));
  }
}

// CCLI is a tight abbreviation to fit narrow tl-step boxes; expand label later if needed
fs.writeFileSync(path, s, 'utf8');
console.log('Applied:', applied, '/', reps.length);
if (notFound.length) {
  console.log('NOT FOUND:');
  notFound.forEach(x => console.log('  ' + x + '...'));
}
console.log('Size:', before, '→', s.length);
