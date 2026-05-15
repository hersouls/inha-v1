// Elevate OpenAI Codex CLI to a standalone option (peer of Claude CLI)
// in References (slides 31, 44), slide 35 desc, and slide 51 tech chips.
const fs = require('fs');
const path = 'D:/Moonwave_Web/INHA_v1.0/.build/slides.html';
let s = fs.readFileSync(path, 'utf8');
const before = s.length;

const reps = [
  // Slide 31 (Ch2 References) AI combinations cell — rewrite all 5 lis
  [
    `              <li><strong>조합 A · Antigravity 단독</strong> — Google AI 구독 · Gemini 3 기반 agentic IDE<span class="url">antigravity.google</span></li>
              <li><strong>조합 B · VS Code + Claude CLI</strong> — 구독 없이도 · 가장 보편<span class="url">code.claude.com</span></li>
              <li><strong>조합 C · Antigravity + Claude CLI</strong> — 동시 활용 (본 발표자)</li>
              <li><strong>조합 D · Cursor · Codex CLI · Copilot</strong> — 사내 표준 따라 선택</li>
              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시 우선</li>`,
    `              <li><strong>조합 A · Antigravity (Gemini IDE)</strong> — Google AI 구독자 · Gemini 3 agentic IDE<span class="url">antigravity.google</span></li>
              <li><strong>조합 B · Claude CLI</strong> — Anthropic 구독자 · CLI 표준<span class="url">code.claude.com</span></li>
              <li><strong>조합 C · Codex CLI</strong> — OpenAI · ChatGPT 구독자<span class="url">github.com/openai/codex</span></li>
              <li><strong>조합 D · 동시 활용</strong> — A+B(본 발표자) 또는 A+C · B+C 등 자유 조합</li>
              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시 우선</li>`
  ],

  // Slide 44 (Ch3 References) AI combinations cell — rewrite all 5 lis
  [
    `              <li><strong>조합 A · Antigravity 단독</strong> — Google AI 구독 · Gemini 3 agentic IDE</li>
              <li><strong>조합 B · VS Code + Claude CLI</strong> — 구독 없이도 · 가장 보편</li>
              <li><strong>조합 C · Antigravity + Claude CLI</strong> — 동시 활용 (본 발표자)</li>
              <li><strong>조합 D · Cursor · Codex CLI</strong> — 다른 IDE 옵션</li>
              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시</li>`,
    `              <li><strong>조합 A · Antigravity (Gemini IDE)</strong> — Google AI 구독자 · Gemini 3 agentic IDE</li>
              <li><strong>조합 B · Claude CLI</strong> — Anthropic 구독자 · CLI 표준</li>
              <li><strong>조합 C · Codex CLI</strong> — OpenAI · ChatGPT 구독자</li>
              <li><strong>조합 D · 동시 활용</strong> — A+B(본 발표자) 또는 A+C · B+C 자유 조합</li>
              <li><strong>조합 E · Ollama + 위 도구</strong> — 폐쇄망 · 프라이버시</li>`
  ],

  // Slide 35 big-step ② desc — list all three subscription paths
  [
    `<strong>Google AI 구독 시 Antigravity, 없으면 VS Code + Claude CLI</strong>가 <code class="inline">src/</code> 전체를 작성한다. 30 Zustand 스토어 · 25+ Firestore 컬렉션 · 3 역할 · 5계위 계약. 동작하는 v1이 2~4주에 완성된다.`,
    `<strong>구독 환경에 따라 — Antigravity(Google) · Claude CLI(Anthropic) · Codex CLI(OpenAI)</strong> 중 보유한 도구가 <code class="inline">src/</code> 전체를 작성한다. 30 Zustand 스토어 · 25+ Firestore 컬렉션 · 3 역할 · 5계위 계약. 동작하는 v1이 2~4주에 완성.`
  ],

  // Slide 51 compute layer tech chips — add Codex CLI as another strong chip
  [
    `<span class="strong">Ollama</span><span>Local RAG</span><span class="strong">Antigravity</span><span class="strong">Claude CLI</span><span>Agents</span>`,
    `<span class="strong">Ollama</span><span>Local RAG</span><span class="strong">Antigravity</span><span class="strong">Claude CLI</span><span class="strong">Codex CLI</span><span>Agents</span>`
  ],
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

fs.writeFileSync(path, s, 'utf8');
console.log('Applied:', applied, '/', reps.length);
if (notFound.length) {
  console.log('NOT FOUND:');
  notFound.forEach(x => console.log('  ' + x + '...'));
}
console.log('Size:', before, '→', s.length);
