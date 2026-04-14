/**
 * Dead-End Registry
 *
 * CDA 的负向经验库。记录被证伪的推理链 / 工具调用组合，
 * 在 assemble 阶段用于过滤已知错误方向。
 *
 * 此实现为开源版（单会话、in-memory），可立即运行。
 * 企业版在此基础上提供跨会话聚合、持久化与团队级分析。
 */

class DeadEndRegistry {
  constructor(store = new Map()) {
    this.store = store; // session_id -> DeadEndItem[]
  }

  /**
   * 显式注册一条死路
   * @param {string} session_id
   * @param {object} trace - 推理链或工具调用轨迹
   * @param {string} reason - 失败原因
   * @returns {DeadEndItem}
   */
  register(session_id, trace, reason) {
    const item = {
      id: `de_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      session_id,
      trace,
      reason,
      created_at: new Date().toISOString(),
      frequency: 1,
    };

    if (!this.store.has(session_id)) {
      this.store.set(session_id, []);
    }
    const list = this.store.get(session_id);
    // 若 reason 和 trace 摘要相同，则累加频次而非新增条目
    const fingerprint = this._fingerprint(trace) + "::" + reason;
    const existing = list.find(i => this._fingerprint(i.trace) + "::" + i.reason === fingerprint);
    if (existing) {
      existing.frequency += 1;
      existing.created_at = item.created_at;
      return existing;
    }

    list.push(item);
    return item;
  }

  /**
   * 列出某会话的已知死路
   * @param {string} session_id
   * @param {number} [top_k=10]
   * @returns {DeadEndItem[]}
   */
  list(session_id, top_k = 10) {
    const items = this.store.get(session_id) || [];
    return items
      .sort((a, b) => b.frequency - a.frequency || b.created_at.localeCompare(a.created_at))
      .slice(0, top_k);
  }

  /**
   * 检查当前方向是否与已知死路高度相似
   * @param {string} session_id
   * @param {object} current_trace
   * @param {number} [threshold=0.82]
   * @returns {DeadEndMatch[]}
   */
  match(session_id, current_trace, threshold = 0.82) {
    const items = this.store.get(session_id) || [];
    const matches = [];
    for (const item of items) {
      const similarity = this._semanticSimilarity(current_trace, item.trace);
      if (similarity >= threshold) {
        matches.push({
          dead_end_id: item.id,
          reason: item.reason,
          similarity,
        });
      }
    }
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  // ── 内部实现：语义相似度（基于词袋余弦，无需外部 embedding 依赖） ──

  _semanticSimilarity(a, b) {
    const textA = this._normalizeTrace(a);
    const textB = this._normalizeTrace(b);
    if (!textA || !textB) return 0.0;
    const vecA = this._bagOfWords(textA);
    const vecB = this._bagOfWords(textB);
    return this._cosineSimilarity(vecA, vecB);
  }

  _normalizeTrace(trace) {
    if (typeof trace === "string") return trace;
    if (trace == null) return "";
    // 优先提取语义内容字段
    if (trace.content) return typeof trace.content === "string" ? trace.content : JSON.stringify(trace.content);
    if (trace.text) return String(trace.text);
    if (trace.reasoning) return String(trace.reasoning);
    if (trace.toolCalls || trace.tools) {
      return JSON.stringify(trace.toolCalls || trace.tools);
    }
    return JSON.stringify(trace);
  }

  _fingerprint(trace) {
    const t = this._normalizeTrace(trace);
    return t.slice(0, 200);
  }

  _bagOfWords(text) {
    const tokens = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 1);
    const freq = new Map();
    for (const t of tokens) {
      freq.set(t, (freq.get(t) || 0) + 1);
    }
    return freq;
  }

  _cosineSimilarity(vecA, vecB) {
    const keys = new Set([...vecA.keys(), ...vecB.keys()]);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (const k of keys) {
      const a = vecA.get(k) || 0;
      const b = vecB.get(k) || 0;
      dot += a * b;
    }
    for (const v of vecA.values()) normA += v * v;
    for (const v of vecB.values()) normB += v * v;
    if (normA === 0 || normB === 0) return 0.0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

module.exports = { DeadEndRegistry };
