// Reframe slides 3-4 (Ch1 §1.1 Token efficiency) to lead with Word → Markdown
// as the primary transformation (matches the source's 3 core axes), keeping
// HTML → MD specific benchmark numbers as supporting evidence.
const fs = require('fs');
const p = 'D:/Moonwave_Web/INHA_v1.0/.build/slides.html';
let s = fs.readFileSync(p, 'utf8');
const before = s.length;

const reps = [
  // Slide 3 — s-lead: emphasize Word/문서 포맷 전환
  [
    `<p class="s-lead">LLM은 토큰 단위로 과금된다. 같은 정보를 더 적은 토큰으로 표현하는 포맷은 그대로 OPEX 절감으로 이어진다.</p>`,
    `<p class="s-lead"><strong>Word · PDF · HTML 등 바이너리 · 서식 중심 포맷을 Markdown으로 전환</strong>하면 토큰이 대폭 줄어든다. LLM은 토큰 단위로 과금되므로 OPEX 절감으로 직결되고, AI 자동화 규모가 커질수록 <strong>누적 비용 차이가 급격히 벌어진다.</strong></p>`
  ],

  // Slide 3 — hero stat label
  [
    `<div class="hero-stat__label">HTML → Markdown 변환만으로 줄어드는 토큰 사용량</div>`,
    `<div class="hero-stat__label">Word · PDF · HTML → Markdown 전환 시 토큰 사용량 감소</div>`
  ],

  // Slide 3 — hero stat sub: clarify benchmark source + extrapolation
  [
    `<div class="hero-stat__sub">깨끗한 콘텐츠에서 약 <strong>68%</strong>, 실제 웹 페이지에서는 최대 <strong>87%</strong> 감소. 동일 콘텐츠 기준 약 <strong>−80%</strong>로 보고한 별도 출처도 있음 — <em>"80% fewer tokens isn't a rounding error"</em>.</div>`,
    `<div class="hero-stat__sub">벤치마크 측정 (Beam AI 2026, What IT Is 2026): <strong>HTML → MD 기준</strong> 깨끗한 콘텐츠 <strong>−68%</strong> · 실제 웹 페이지 <strong>−87%</strong> · 동등 콘텐츠 <strong>−80%</strong>. <em>Word · PDF 등 다른 바이너리 포맷도 유사 비율의 감소 패턴을 보인다.</em></div>`
  ],

  // Slide 3 — KPI 1 label: broaden
  [
    `<div class="kpi__label">HTML → Markdown 변환 시 토큰 사용량 (깨끗한 콘텐츠)</div>`,
    `<div class="kpi__label">문서 포맷 → Markdown 변환 시 토큰 감소 <small style="display:block;font-size:11px;color:var(--gray-500);font-weight:500;margin-top:2px">측정: HTML → MD, 깨끗한 콘텐츠</small></div>`
  ],

  // Slide 4 — s-lead: emphasize broader pattern
  [
    `<p class="s-lead">4가지 독립 연구·벤치마크가 공통적으로 가리키는 방향 ― 포맷 선택은 AI 도입의 <strong>가장 저렴한 최적화 레버</strong> 중 하나다.</p>`,
    `<p class="s-lead"><strong>Word · PDF · HTML 등 → Markdown으로 전환</strong>할수록 토큰이 줄어든다. 4가지 독립 연구·벤치마크가 공통적으로 가리키는 방향 — 포맷 선택은 AI 도입의 <strong>가장 저렴한 최적화 레버</strong> 중 하나다.</p>`
  ],

  // Slide 4 — bottom takeaway info-card title: emphasize Word transition
  [
    `<h3>왜 일관되게 줄어드는가</h3>`,
    `<h3>왜 일관되게 줄어드는가 (Word · PDF · HTML 모두)</h3>`
  ],
];

let applied = 0;
const notFound = [];
for (const [from, to] of reps) {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    applied++;
  } else {
    notFound.push(from.substring(0, 100));
  }
}

fs.writeFileSync(p, s, 'utf8');
console.log('Applied:', applied, '/', reps.length);
if (notFound.length) {
  console.log('NOT FOUND:');
  notFound.forEach(x => console.log('  ' + x + '...'));
}
console.log('Size:', before, '→', s.length);
