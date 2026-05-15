// AI 시대의 업무방식 — encrypted presentation builder
// Encrypts slides.html with PBKDF2-AES-GCM (password: 30307574)
// and embeds it in the KT-style lock screen identical to the reference.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PASSWORD   = '30307574';
const ITER       = 250000;
const KEY_BYTES  = 32;
const SALT_BYTES = 16;
const IV_BYTES   = 12;

const SLIDES_PATH = path.join(__dirname, 'slides.html');
const BG_PATH     = path.join(__dirname, 'bg-layer.txt');
const OUTPUT_PATH = path.join(__dirname, '..', 'AI_시대의_업무방식.html');

// 1) Load slides + background layer (KT PPT base64 JPEG, extracted from reference)
const slidesHtml = fs.readFileSync(SLIDES_PATH, 'utf8');
const BG_LAYER   = fs.readFileSync(BG_PATH, 'utf8').trim();

// 2) PBKDF2 → AES-GCM (matches reference deriveKey + decrypt)
const salt = crypto.randomBytes(SALT_BYTES);
const iv   = crypto.randomBytes(IV_BYTES);
const key  = crypto.pbkdf2Sync(PASSWORD, salt, ITER, KEY_BYTES, 'sha256');

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct1 = cipher.update(slidesHtml, 'utf8');
const ct2 = cipher.final();
const tag = cipher.getAuthTag();

// Combined wire format: salt(16) || iv(12) || ciphertext || tag(16)
const combined = Buffer.concat([salt, iv, ct1, ct2, tag]);
const PAYLOAD  = combined.toString('base64');

// 3) Remember token (matches computeRememberToken)
const REMEMBER_TOKEN = crypto
  .pbkdf2Sync(PASSWORD, '_kt_remember_salt_', 50000, 16, 'sha256')
  .toString('hex');

// 4) Wrapper — identical lock screen to reference (UI/UX 100%)
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#e0282f" />
<meta name="robots" content="noindex,nofollow" />
<title>AI 시대의 업무방식 · 보호된 문서</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
<style>
  :root {
    --kt-red-500:#e0282f; --kt-red-600:#bb1b21; --kt-red-700:#8e1419;
    --kt-red-50:#fdeded; --kt-red-100:#fad5d6;
    --gray-50:#f3f4f6; --gray-100:#e9eaee; --gray-200:#c7cad1;
    --gray-300:#adb1b9; --gray-400:#8b8f97; --gray-500:#6f737b;
    --gray-600:#55585d; --gray-700:#3d3f43; --gray-800:#232425;
    --gray-900:#191a1b; --black:#131415;
    --danger-bg:rgba(224,40,47,0.08);
    --font-display:"KT Flow","Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    --font-sans:"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box}
  html,body{height:100%;margin:0;padding:0}
  body{
    font-family:var(--font-sans);font-weight:500;color:var(--gray-900);
    line-height:1.5;letter-spacing:-0.01em;
    /* KT PPT 배경 이미지 + 가독성 오버레이 + KT red 톤 */
    background:
      radial-gradient(ellipse 80% 60% at 20% 0%, rgba(224,40,47,0.16), transparent 60%),
      radial-gradient(ellipse 70% 60% at 80% 100%, rgba(19,20,21,0.18), transparent 60%),
      linear-gradient(180deg, rgba(243,244,246,0.55), rgba(255,255,255,0.30) 60%),
      ${BG_LAYER};
    background-size: auto, auto, auto, cover;
    background-position: center, center, center, center;
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
    background-attachment: fixed, fixed, fixed, fixed;
    min-height:100vh;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
    display:flex;align-items:center;justify-content:center;
    padding:96px 24px 128px;
  }
  .kt-bottom-bar{
    position:fixed; left:0; right:0; bottom:0;
    height:68px;
    background:#fff;
    border-top:1px solid var(--gray-100);
    box-shadow:0 -2px 16px rgba(19,20,21,0.06),
               0 -1px 0 rgba(255,255,255,0.6) inset;
    display:flex; align-items:center; justify-content:flex-end;
    padding:0 42px;
    z-index:4;
  }
  .kt-bottom-bar::before{
    content:""; position:absolute; left:0; right:0; top:0; height:1px;
    background:linear-gradient(90deg, transparent, var(--kt-red-500), transparent);
    opacity:0.18;
  }
  .kt-bottom-bar__brand{
    font-family:var(--font-display);font-weight:600;font-size:13px;
    color:var(--gray-600);letter-spacing:0.04em;user-select:none;
  }
  .kt-bottom-bar__brand strong{color:var(--gray-900);font-weight:800}
  @media (max-width:480px){
    .kt-bottom-bar{ height:54px; padding:0 24px; }
    .kt-bottom-bar__brand{ font-size:11px; }
  }
  .kt-shell{
    width:100%;max-width:440px;background:#fff;border-radius:14px;
    border:1px solid var(--gray-100);overflow:hidden;position:relative;
    box-shadow:0 32px 64px -16px rgba(19,20,21,0.18),
               0 8px 24px -8px rgba(224,40,47,0.06);
  }
  .kt-shell::before{
    content:"";position:absolute;left:0;right:0;top:0;height:4px;
    background:linear-gradient(90deg, var(--kt-red-500), var(--kt-red-700));
  }
  .kt-head{padding:32px 36px 8px;display:flex;align-items:center;gap:12px}
  .kt-mark{
    width:42px;height:32px;border-radius:8px;
    background:linear-gradient(135deg, var(--kt-red-500), var(--kt-red-700));
    display:grid;place-items:center;color:#fff;
    font-family:var(--font-display);font-weight:800;font-size:14px;
    letter-spacing:-0.04em;box-shadow:0 6px 18px rgba(224,40,47,0.32);
  }
  .kt-head__meta{font-size:11px;font-weight:700;letter-spacing:0.08em;
    color:var(--gray-500);text-transform:uppercase}
  .kt-head__chip{
    margin-left:auto;padding:4px 10px;border-radius:99px;
    background:var(--kt-red-50);color:var(--kt-red-600);
    font-size:11px;font-weight:700;letter-spacing:0.04em;
  }
  .kt-body{padding:8px 36px 28px}
  .kt-title{
    font-family:var(--font-display);font-weight:100;font-size:28px;
    line-height:1.15;letter-spacing:-0.025em;color:var(--gray-900);
    margin:8px 0 6px;
  }
  .kt-title strong{color:var(--kt-red-600);font-weight:300}
  .kt-sub{font-size:13.5px;line-height:1.6;color:var(--gray-600);margin:0 0 18px}
  .kt-info{
    padding:12px 14px;margin-bottom:18px;background:var(--gray-50);
    border-left:3px solid var(--gray-300);border-radius:6px;
    font-size:12px;line-height:1.55;color:var(--gray-700);
  }
  .kt-info strong{color:var(--gray-900);font-weight:700}
  .kt-field{margin-bottom:14px;position:relative}
  .kt-field__label{
    display:block;font-size:11.5px;font-weight:700;color:var(--gray-600);
    margin-bottom:6px;letter-spacing:0.04em;text-transform:uppercase;
  }
  .kt-input-wrap{
    position:relative;border:1.5px solid var(--gray-200);border-radius:10px;
    background:#fff;transition:border-color 160ms ease, box-shadow 160ms ease;
  }
  .kt-input-wrap:focus-within{
    border-color:var(--kt-red-500);
    box-shadow:0 0 0 4px rgba(224,40,47,0.10);
  }
  .kt-input-wrap.is-invalid{
    border-color:var(--kt-red-500);
    background:linear-gradient(135deg, var(--danger-bg), #fff);
    animation:shake 360ms cubic-bezier(0.36,0.07,0.19,0.97);
  }
  @keyframes shake{
    10%,90%{transform:translateX(-1px)}
    20%,80%{transform:translateX(2px)}
    30%,50%,70%{transform:translateX(-4px)}
    40%,60%{transform:translateX(4px)}
  }
  .kt-input{
    width:100%;border:0;outline:0;background:transparent;
    padding:14px 48px 14px 16px;font-family:var(--font-sans);
    font-size:16px;font-weight:600;color:var(--gray-900);
    letter-spacing:0.02em;border-radius:10px;
  }
  .kt-input::placeholder{color:var(--gray-400);font-weight:500;letter-spacing:0}
  .kt-toggle{
    position:absolute;right:6px;top:50%;transform:translateY(-50%);
    width:36px;height:36px;border:0;background:transparent;cursor:pointer;
    border-radius:8px;color:var(--gray-500);display:grid;place-items:center;
    transition:background-color 120ms ease, color 120ms ease;
  }
  .kt-toggle:hover{background:var(--gray-50);color:var(--gray-800)}
  .kt-toggle svg{width:18px;height:18px}
  .kt-error{
    display:none;align-items:center;gap:8px;padding:10px 14px;
    margin-bottom:14px;background:var(--danger-bg);
    border-left:3px solid var(--kt-red-500);border-radius:8px;
    font-size:12.5px;color:var(--kt-red-700);font-weight:600;
  }
  .kt-error.show{display:flex}
  .kt-error svg{width:16px;height:16px;flex-shrink:0}
  .kt-row{
    display:flex;align-items:center;gap:8px;margin:4px 0 22px;
    font-size:12.5px;color:var(--gray-600);
  }
  .kt-row input[type=checkbox]{
    width:16px;height:16px;accent-color:var(--kt-red-500);cursor:pointer;
  }
  .kt-row label{cursor:pointer;user-select:none}
  .kt-submit{
    width:100%;border:0;cursor:pointer;padding:14px 18px;border-radius:10px;
    background:linear-gradient(135deg, var(--kt-red-500), var(--kt-red-700));
    color:#fff;font-family:var(--font-display);font-weight:600;font-size:15px;
    letter-spacing:-0.005em;
    box-shadow:0 8px 20px -6px rgba(224,40,47,0.42);
    transition:transform 160ms cubic-bezier(0.4,0,0.2,1),
               box-shadow 160ms ease, filter 120ms ease;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .kt-submit:hover{
    transform:translateY(-1px);
    box-shadow:0 12px 24px -6px rgba(224,40,47,0.54);
    filter:brightness(1.04);
  }
  .kt-submit:active{transform:translateY(0);filter:brightness(0.96)}
  .kt-submit:disabled{opacity:0.6;cursor:wait;transform:none;filter:none}
  .kt-submit svg{width:16px;height:16px}
  .kt-spinner{
    width:16px;height:16px;border-radius:50%;
    border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;
    animation:spin 720ms linear infinite;display:none;
  }
  .kt-submit.is-loading .kt-spinner{display:inline-block}
  .kt-submit.is-loading svg{display:none}
  @keyframes spin{to{transform:rotate(360deg)}}
  .kt-foot{
    padding:14px 36px 26px;border-top:1px solid var(--gray-100);
    display:flex;justify-content:space-between;align-items:center;
    font-size:10.5px;color:var(--gray-500);
  }
  .kt-foot strong{color:var(--gray-700);font-weight:700}
  @media (max-width:480px){
    .kt-head{padding:24px 22px 4px}
    .kt-body{padding:6px 22px 22px}
    .kt-foot{padding:12px 22px 20px}
    .kt-title{font-size:24px}
  }
</style>
</head>
<body>
<main class="kt-shell" role="main" aria-labelledby="kt-title">
  <header class="kt-head">
    <div class="kt-mark" aria-hidden="true">KT</div>
    <div><div class="kt-head__meta">AI 시대의 업무방식</div></div>
    <div class="kt-head__chip">SECURE</div>
  </header>
  <div class="kt-body">
    <h1 id="kt-title" class="kt-title">보호된 <strong>문서</strong></h1>
    <p class="kt-sub">본 자료는 비밀번호로 보호되어 있습니다. 비밀번호를 입력해 주세요.</p>
    <div class="kt-info">
      본 자료는 <strong>AI 시대의 업무방식</strong> 발표자료입니다.<br/>
      비밀번호가 필요하신 경우 <strong>담당자</strong>에게 문의 부탁드립니다.
    </div>
    <form id="kt-form" autocomplete="off" novalidate>
      <div class="kt-field">
        <label class="kt-field__label" for="kt-password">비밀번호</label>
        <div class="kt-input-wrap" id="kt-input-wrap">
          <input id="kt-password" class="kt-input" type="password"
            name="password" autocomplete="current-password" spellcheck="false"
            autofocus required placeholder="비밀번호 입력" />
          <button type="button" class="kt-toggle" id="kt-toggle"
            aria-label="비밀번호 표시">
            <svg id="kt-eye-show" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <svg id="kt-eye-hide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A10.93 10.93 0 0 1 12 4c7 0 11 8 11 8a19.85 19.85 0 0 1-4.18 5.18"/>
              <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="kt-error" id="kt-error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span id="kt-error-msg">비밀번호가 일치하지 않습니다.</span>
      </div>
      <div class="kt-row">
        <input type="checkbox" id="kt-remember" />
        <label for="kt-remember">이 브라우저에 기억 (7일)</label>
      </div>
      <button type="submit" class="kt-submit" id="kt-submit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span class="kt-spinner" aria-hidden="true"></span>
        <span id="kt-submit-label">잠금 해제</span>
      </button>
    </form>
  </div>
  <footer class="kt-foot">
    <span><strong>AI 시대의 업무방식</strong> · 발표자료</span>
    <span>SECURE · INTERNAL</span>
  </footer>
</main>
<div class="kt-bottom-bar" role="contentinfo" aria-hidden="true">
  <span class="kt-bottom-bar__brand">KT <strong>Enterprise</strong></span>
</div>
<script>
(function () {
  'use strict';
  var PAYLOAD = ${JSON.stringify(PAYLOAD)};
  var REMEMBER_TOKEN = ${JSON.stringify(REMEMBER_TOKEN)};
  var ITER = 250000;
  var REMEMBER_DAYS = 7;
  var LS_KEY = 'aiwork_doc_remember';

  var form = document.getElementById('kt-form');
  var pwd = document.getElementById('kt-password');
  var wrap = document.getElementById('kt-input-wrap');
  var err = document.getElementById('kt-error');
  var errMsg = document.getElementById('kt-error-msg');
  var rememberCb = document.getElementById('kt-remember');
  var submitBtn = document.getElementById('kt-submit');
  var submitLabel = document.getElementById('kt-submit-label');
  var toggleBtn = document.getElementById('kt-toggle');
  var eyeShow = document.getElementById('kt-eye-show');
  var eyeHide = document.getElementById('kt-eye-hide');

  toggleBtn.addEventListener('click', function () {
    var isPwd = pwd.type === 'password';
    pwd.type = isPwd ? 'text' : 'password';
    eyeShow.style.display = isPwd ? 'none' : '';
    eyeHide.style.display = isPwd ? '' : 'none';
    toggleBtn.setAttribute('aria-label', isPwd ? '비밀번호 숨김' : '비밀번호 표시');
    pwd.focus();
  });

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function bytesToHex(bytes) {
    var h = '';
    for (var i = 0; i < bytes.length; i++) {
      h += bytes[i].toString(16).padStart(2, '0');
    }
    return h;
  }
  function showError(msg) {
    errMsg.textContent = msg;
    err.classList.add('show');
    wrap.classList.add('is-invalid');
    setTimeout(function () { wrap.classList.remove('is-invalid'); }, 400);
  }
  function clearError() {
    err.classList.remove('show');
    wrap.classList.remove('is-invalid');
  }
  function setLoading(on) {
    submitBtn.disabled = !!on;
    submitBtn.classList.toggle('is-loading', !!on);
    submitLabel.textContent = on ? '복호화 중...' : '잠금 해제';
  }

  pwd.addEventListener('input', clearError);

  async function deriveKey(password, salt) {
    var baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  }

  async function decrypt(password) {
    var combined = b64ToBytes(PAYLOAD);
    var salt = combined.slice(0, 16);
    var iv = combined.slice(16, 28);
    var ciphertext = combined.slice(28);
    var key = await deriveKey(password, salt);
    var plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plain);
  }

  async function computeRememberToken(password) {
    var baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2',
        salt: new TextEncoder().encode('_kt_remember_salt_'),
        iterations: 50000,
        hash: 'SHA-256' },
      baseKey,
      128
    );
    return bytesToHex(new Uint8Array(bits));
  }

  function renderDocument(html) {
    document.open();
    document.write(html);
    document.close();
  }

  async function attempt(password, options) {
    options = options || {};
    setLoading(true);
    try {
      var html = await decrypt(password);
      if (options.remember) {
        try {
          var token = await computeRememberToken(password);
          var expires = Date.now() + REMEMBER_DAYS * 86400 * 1000;
          localStorage.setItem(LS_KEY, JSON.stringify({ token: token, expires: expires }));
        } catch (e) { /* localStorage 차단 시 무시 */ }
      }
      renderDocument(html);
    } catch (e) {
      setLoading(false);
      showError('비밀번호가 일치하지 않습니다.');
      pwd.select();
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = pwd.value.trim();
    if (!v) { showError('비밀번호를 입력해 주세요.'); pwd.focus(); return; }
    attempt(v, { remember: rememberCb.checked });
  });

  (async function autoUnlock() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || !saved.token || !saved.expires) return;
      if (Date.now() > saved.expires) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      if (saved.token !== REMEMBER_TOKEN) {
        localStorage.removeItem(LS_KEY);
        return;
      }
      submitLabel.textContent = '기억된 비밀번호로 잠금 해제';
    } catch (e) { /* 무시 */ }
  })();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
console.log('OK ->', OUTPUT_PATH);
console.log('slides bytes:', slidesHtml.length);
console.log('payload bytes(base64):', PAYLOAD.length);
console.log('remember token:', REMEMBER_TOKEN);
console.log('output bytes:', html.length);
