/**
 * Dead-End Registry
 *
 * CDA 的负向经验库。记录被证伪的推理链 / 工具调用组合，
 * 在 assemble 阶段用于过滤已知错误方向。
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
    this.store.get(session_id).push(item);
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
    // 按频次和最近发生时间简单排序
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
    return matches;
  }

  // 占位：实际实现应接入嵌入模型或规则匹配
  _semanticSimilarity(a, b) {
    // TODO: 替换为真实语义相似度计算（如向量余弦相似度）
    return 0.0;
  }
}

module.exports = { DeadEndRegistry };
