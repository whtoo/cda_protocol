/**
 * CDA Protocol — Assemble Hook
 * Filters candidate messages by semantic direction and known dead-end registry.
 */

const { DeadEndRegistry } = require('../lib/deadEndRegistry');

module.exports = async function assemble(context, config) {
  const { messages, direction, misses, session_id } = context;
  const { delta_threshold = 0.05, keep_threshold = 0.75, dead_end_penalty = 0.85 } = config;

  // Step 1: Filter known dead ends (legacy miss hash)
  const viable = messages.filter(m => !misses.includes(m.directionHash));

  // Step 2: Check Dead-End Registry for current direction similarity
  const registry = new DeadEndRegistry(context.registryStore);
  const trace = direction && (direction.trace || direction);
  const deadEndMatches = trace && session_id
    ? registry.match(session_id, trace, 0.82)
    : [];
  const isNearDeadEnd = deadEndMatches.length > 0;

  // Step 3: Score by lightweight QTS (direction proximity + role + recency)
  const scored = viable.map((m, idx) => {
    let score = computeMessageScore(m, trace, idx, viable.length);
    // Penalize items whose direction hash matches a known dead-end pattern
    if (isNearDeadEnd && deadEndMatches.some(de => de.similarity > 0.85)) {
      score *= dead_end_penalty;
    }
    return { ...m, score };
  });

  // Step 4: Apply thresholds
  const keep = scored.filter(m => m.score >= keep_threshold);

  return {
    contextItems: keep,
    filteredCount: messages.length - keep.length,
    directionAligned: true,
    deadEndMatches,
    deadEndSuppressed: isNearDeadEnd
  };
};

function computeMessageScore(message, direction, index, total) {
  // Recency bias: newer messages score higher
  const recency = 0.5 + 0.5 * (index / Math.max(1, total - 1));
  // Role bias: system/user messages slightly favored over raw tool outputs
  const roleWeight = { system: 1.0, user: 1.0, assistant: 0.95, tool: 0.85 }[message.role] || 0.8;
  // Direction proximity: if message has content, compare with direction trace
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
