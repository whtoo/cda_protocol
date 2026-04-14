/**
 * CDA Protocol — Assemble Hook
 *
 * Builds turn input with phase-aware direction filtering.
 * Dead-End Registry is used as a *warning sign*, not a filter:
 * matched dead ends are injected into the system prompt so the model
 * can explicitly exclude disproven directions during reasoning.
 */

const { DeadEndRegistry } = require('../lib/deadEndRegistry');

module.exports = async function assemble(context, config) {
  const { messages, direction, misses, session_id } = context;
  const { keep_threshold = 0.75 } = config;

  // Step 1: Filter legacy miss hashes (hard misses, not DER)
  const viable = messages.filter(m => !misses.includes(m.directionHash));

  // Step 2: Lightweight QTS scoring (recency + role + direction proximity)
  const scored = viable.map((m, idx) => {
    const score = computeMessageScore(m, direction, idx, viable.length);
    return { ...m, score };
  });

  // Step 3: Apply keep threshold
  const keep = scored.filter(m => m.score >= keep_threshold);

  // Step 4: Dead-End Registry — inject warnings, do NOT suppress messages
  let systemPromptAddition = null;
  let deadEndMatches = [];

  const trace = direction && (direction.trace || direction);
  if (trace && session_id) {
    const registry = new DeadEndRegistry(context.registryStore);
    deadEndMatches = registry.match(session_id, trace, 0.82);

    if (deadEndMatches.length > 0) {
      const warnings = deadEndMatches
        .slice(0, 5)
        .map(m => `- [${m.similarity.toFixed(2)}] ${m.reason}`)
        .join('\n');

      systemPromptAddition = [
        `[NEGATIVE-EXPERIENCE] The current direction is semantically close to ${deadEndMatches.length} known dead-end(s).`,
        `Do NOT repeat the following disproven approaches:`,
        warnings,
        `Use these as exclusion constraints when reasoning forward.`
      ].join('\n');
    }
  }

  return {
    contextItems: keep,
    filteredCount: messages.length - keep.length,
    directionAligned: true,
    deadEndMatches,
    deadEndSuppressed: false,
    systemPromptAddition
  };
};

function computeMessageScore(message, direction, index, total) {
  const recency = 0.5 + 0.5 * (index / Math.max(1, total - 1));
  const roleWeight = { system: 1.0, user: 1.0, assistant: 0.95, tool: 0.85 }[message.role] || 0.8;
  let proximity = 0.8;
  if (direction && message.content) {
    proximity = 0.6 + 0.3 * textOverlap(String(message.content), String(direction.content || direction));
  }
  return Math.min(1.0, recency * roleWeight * proximity);
}

function textOverlap(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect++;
  return intersect / Math.sqrt(setA.size * setB.size);
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}
