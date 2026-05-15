// Mobile responsive fixes for slides.html
// 1) PWA + iOS meta tags
// 2) Change stage/deck centering: grid place-items → absolute + translate(-50%, -50%) scale
// 3) Portrait rotation prompt
// 4) Improved fit() — visualViewport API + orientationchange
// 5) Hide fullscreen button when API unsupported (iOS Safari iPhone)
const fs = require('fs');
const p = 'D:/Moonwave_Web/INHA_v1.0/.build/slides.html';
let s = fs.readFileSync(p, 'utf8');
const before = s.length;

const reps = [
  // 1) PWA + iOS meta tags
  [
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`
  ],

  // 2) Change stage CSS — remove display:grid, place-items:center
  [
    '.stage{position:fixed;inset:0;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse 70% 60% at 50% 50%, #1a1c20, #0c0d10)}',
    '.stage{position:fixed;inset:0;overflow:hidden;background:radial-gradient(ellipse 70% 60% at 50% 50%, #1a1c20, #0c0d10)}'
  ],

  // 3) Change deck CSS — position:absolute + translate(-50%,-50%) centering
  [
    '.deck{position:relative;width:1920px;height:1080px;background:#ffffff;transform-origin:center center;box-shadow:0 0 80px rgba(0,0,0,0.4);overflow:hidden;border-radius:4px}',
    '.deck{position:absolute;left:50%;top:50%;width:1920px;height:1080px;background:#ffffff;transform-origin:center center;transform:translate(-50%,-50%) scale(0.5);box-shadow:0 0 80px rgba(0,0,0,0.4);overflow:hidden;border-radius:4px}'
  ],

  // 4) Print CSS — also reset position/left/top
  [
    `  @media print{
    .deck-nav, .deck-hint{display:none}
    .stage{position:static;display:block;background:#fff}
    .deck{transform:none !important;page-break-after:always;box-shadow:none}
    .slide{position:relative;opacity:1;visibility:visible}
    .bar__fill{transform:scaleX(var(--w)) !important}
  }`,
    `  /* ─── Mobile · Portrait rotation prompt ─── */
  .rotate-prompt{
    display:none;position:fixed;inset:0;z-index:9999;
    background:linear-gradient(135deg, var(--kt-red-600), var(--kt-red-700));
    color:#fff;flex-direction:column;align-items:center;justify-content:center;
    gap:28px;padding:48px;text-align:center;font-family:var(--font-display);
    padding-bottom:calc(48px + env(safe-area-inset-bottom));
    padding-top:calc(48px + env(safe-area-inset-top));
  }
  .rotate-prompt__mark{
    width:60px;height:46px;border-radius:10px;background:#fff;
    display:grid;place-items:center;color:var(--kt-red-700);
    font-family:var(--font-display);font-weight:800;font-size:20px;
    letter-spacing:-0.04em;box-shadow:0 8px 24px rgba(0,0,0,0.20);
    margin-bottom:8px;
  }
  .rotate-prompt__icon{
    width:88px;height:88px;opacity:0.95;
    animation:rp-rotate 2.6s ease-in-out infinite;
  }
  .rotate-prompt__title{
    font-weight:200;font-size:30px;letter-spacing:-0.025em;line-height:1.2;
  }
  .rotate-prompt__title strong{font-weight:600}
  .rotate-prompt__sub{
    font-weight:400;font-size:14px;opacity:0.88;line-height:1.6;max-width:300px;
  }
  .rotate-prompt__sub code{
    font-family:var(--font-mono);background:rgba(255,255,255,0.18);
    padding:2px 7px;border-radius:4px;font-size:12.5px;
  }
  @keyframes rp-rotate{
    0%,52%{transform:rotate(0)}
    72%,100%{transform:rotate(-90deg)}
  }

  /* Phone portrait — show rotation prompt, hide deck/nav */
  @media (max-width:600px) and (orientation:portrait){
    .stage,.deck-nav,.deck-hint{display:none !important}
    .rotate-prompt{display:flex}
  }

  /* Mobile landscape — fill viewport, respect safe area */
  @media (max-height:500px) and (orientation:landscape){
    .stage{background:#000;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
    .deck{box-shadow:none;border-radius:0}
    .deck-nav{bottom:calc(8px + env(safe-area-inset-bottom));transform:translateX(-50%) scale(0.85);transform-origin:bottom center}
  }
  /* Tablet/smaller landscape — tighter nav */
  @media (max-width:1024px) and (orientation:landscape){
    .deck-nav{bottom:12px}
  }

  @media print{
    .deck-nav, .deck-hint{display:none}
    .stage{position:static;display:block;background:#fff}
    .deck{position:relative;left:auto;top:auto;transform:none !important;page-break-after:always;box-shadow:none}
    .slide{position:relative;opacity:1;visibility:visible}
    .bar__fill{transform:scaleX(var(--w)) !important}
  }`
  ],

  // 5) Insert rotation prompt HTML before <nav class="deck-nav">
  [
    `<nav class="deck-nav" role="navigation" aria-label="Slide navigation">`,
    `<div class="rotate-prompt" id="rotate-prompt" aria-hidden="true">
  <div class="rotate-prompt__mark">KT</div>
  <svg class="rotate-prompt__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="18" height="12" rx="2.5"/>
    <line x1="7" y1="22" x2="17" y2="22" opacity="0.7"/>
    <path d="M19 4l2 2-2 2" stroke-width="1.8"/>
    <path d="M21 6h-4a3 3 0 0 0-3 3v1" stroke-width="1.8"/>
  </svg>
  <div class="rotate-prompt__title">화면을 <strong>가로로</strong> 돌려 주세요</div>
  <div class="rotate-prompt__sub">본 발표 자료는 <code>16:9</code> 가로 비율로 제작되었습니다.<br/>가로 모드에서 가장 잘 보입니다.</div>
</div>

<nav class="deck-nav" role="navigation" aria-label="Slide navigation">`
  ],

  // 6) Replace fit() — use visualViewport + translate(-50%,-50%) scale
  [
    `  function fit(){
    var sw = window.innerWidth, sh = window.innerHeight;
    var scale = Math.min(sw/1920, sh/1080);
    deck.style.transform = 'scale(' + scale + ')';
  }`,
    `  function fit(){
    var sw, sh;
    // visualViewport gives accurate dimensions on mobile (excludes browser chrome)
    if (window.visualViewport) {
      sw = window.visualViewport.width;
      sh = window.visualViewport.height;
    } else {
      sw = window.innerWidth;
      sh = window.innerHeight;
    }
    var scale = Math.min(sw/1920, sh/1080);
    // translate+scale instead of grid centering — more reliable on mobile
    deck.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }`
  ],

  // 7) Add orientationchange + visualViewport listeners
  [
    `  window.addEventListener('resize', fit);
  fit();`,
    `  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function(){
    setTimeout(fit, 100);
    setTimeout(fit, 400);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fit);
  }
  fit();`
  ],

  // 8) Hide fullscreen button when API unsupported (iOS Safari iPhone)
  [
    `  fsBtn.addEventListener('click', function(){ fsBtn.classList.remove('is-pulse'); toggleFs(); });`,
    `  // Hide fullscreen button when API unsupported (e.g., iOS Safari iPhone)
  var fsSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled);
  if (!fsSupported) {
    fsBtn.style.display = 'none';
    fsBtn.classList.remove('is-pulse');
  }
  fsBtn.addEventListener('click', function(){ fsBtn.classList.remove('is-pulse'); toggleFs(); });`
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
