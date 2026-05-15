/* ─────────────────────────────────────────────────────────
 * rag_client.js
 * 인하대 연구실 RAG 챗봇 클라이언트 (브라우저 전용)
 *
 * 의존: vector_db.js (window.VECTOR_DB_B64, window.VECTOR_DB_META)
 *
 * 사용 예:
 *   const rag = await RAGClient.init({ apiKey: '...' });
 *   const answer = await rag.chat('VPP 전압 안정도가 뭐야?');
 *   console.log(answer.text, answer.sources);
 * ───────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  const DEFAULTS = {
    embedModel: 'text-embedding-3-small',
    chatModel: 'gpt-4o-mini',
    embedDim: 512,
    topK: 4,
    minScore: 0.25,
    apiBase: 'https://api.openai.com/v1',
    systemPrompt:
      '너는 인하대학교 전력시스템 연구실(원동준 교수님 연구실)의 자료를 바탕으로 답변하는 AI 어시스턴트야.\n' +
      '아래 [참고 문서] 내용만을 근거로 한국어로 정확하고 간결하게 답변해.\n' +
      '문서에 없는 내용은 "제공된 자료에서 찾을 수 없습니다"라고 답하고 추측하지 마.\n' +
      '답변 마지막에 출처 표시는 하지 마 (UI에서 별도 표시됨).',
  };

  /* ───── base64 + gzip 해제 → JSON ─────────────────────── */
  async function decodeVectorDB(b64) {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  }

  /* ───── 정규화 사전 계산 (검색 가속용) ─────────────── */
  function precomputeIndex(db) {
    const n = db.chunks.length;
    const dim = db.dimensions;
    const matrix = new Float32Array(n * dim);
    const norms = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const v = db.chunks[i].embedding;
      let sum = 0;
      for (let j = 0; j < dim; j++) {
        matrix[i * dim + j] = v[j];
        sum += v[j] * v[j];
      }
      norms[i] = Math.sqrt(sum) || 1e-9;
    }
    return { matrix, norms, dim, n };
  }

  /* ───── OpenAI API 호출 ─────────────────────────────── */
  async function openaiCall(path, body, opts) {
    const res = await fetch(`${opts.apiBase}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI ${path} ${res.status}: ${errText}`);
    }
    return res.json();
  }

  async function embedQuery(text, opts) {
    const data = await openaiCall(
      '/embeddings',
      { model: opts.embedModel, input: text, dimensions: opts.embedDim },
      opts
    );
    return data.data[0].embedding;
  }

  async function callChat(messages, opts, onToken) {
    if (onToken) {
      const res = await fetch(`${opts.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: opts.chatModel,
          messages,
          stream: true,
          temperature: 0.2,
        }),
      });
      if (!res.ok) throw new Error(`Chat ${res.status}: ${await res.text()}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            const delta = j.choices?.[0]?.delta?.content || '';
            if (delta) {
              full += delta;
              onToken(delta, full);
            }
          } catch (_) { /* 부분 JSON 무시 */ }
        }
      }
      return full;
    }
    const data = await openaiCall(
      '/chat/completions',
      { model: opts.chatModel, messages, temperature: 0.2 },
      opts
    );
    return data.choices[0].message.content;
  }

  /* ───── 메인 클라이언트 ─────────────────────────────── */
  class RAGClient {
    constructor(db, opts) {
      this.db = db;
      this.opts = opts;
      this._idx = precomputeIndex(db);
    }

    static async init(opts = {}) {
      if (!global.VECTOR_DB_B64) {
        throw new Error('vector_db.js가 로드되지 않았습니다 (window.VECTOR_DB_B64 없음)');
      }
      const merged = { ...DEFAULTS, ...opts };
      const db = await decodeVectorDB(global.VECTOR_DB_B64);
      return new RAGClient(db, merged);
    }

    setApiKey(key) {
      this.opts.apiKey = key;
    }

    /** 검색만 (LLM 호출 X) */
    async search(query, topK) {
      const k = topK || this.opts.topK;
      const qVec = await embedQuery(query, this.opts);
      const { matrix, norms, dim, n } = this._idx;
      let qNorm = 0;
      for (let j = 0; j < dim; j++) qNorm += qVec[j] * qVec[j];
      qNorm = Math.sqrt(qNorm) || 1e-9;
      const ranked = [];
      for (let i = 0; i < n; i++) {
        let dot = 0;
        const off = i * dim;
        for (let j = 0; j < dim; j++) dot += matrix[off + j] * qVec[j];
        ranked.push([dot / (norms[i] * qNorm), i]);
      }
      ranked.sort((a, b) => b[0] - a[0]);
      return ranked.slice(0, k).map(([score, i]) => ({
        score,
        ...this.db.chunks[i],
      }));
    }

    /** 검색 + LLM 답변 생성 */
    async chat(query, options = {}) {
      const onToken = options.onToken;
      const history = options.history || [];
      const sources = await this.search(query);

      const filtered = sources.filter(s => s.score >= this.opts.minScore);
      const useSources = filtered.length > 0 ? filtered : sources.slice(0, 1);

      const context = useSources
        .map(
          (s, i) =>
            `[자료 ${i + 1}] (출처: ${s.source} / ${s.section})\n${s.text}`
        )
        .join('\n\n---\n\n');

      const messages = [
        { role: 'system', content: this.opts.systemPrompt },
        ...history,
        {
          role: 'user',
          content: `[참고 문서]\n${context}\n\n[질문]\n${query}`,
        },
      ];

      const text = await callChat(messages, this.opts, onToken);
      return { text, sources: useSources, allCandidates: sources };
    }
  }

  global.RAGClient = RAGClient;
})(window);
