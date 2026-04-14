/**
 * CDA Protocol — Assemble Hook
 * Filters candidate messages by semantic direction and known dead-end registry.
 */

const { DeadEndRegistry } = require('../lib/deadEndRegistry');

module.exports = async function assemble(context, config) {
  const { messages, direction, misses, session_id } = context;
  const { delta_threshold, keep_threshold, dead_end_penalty = 0.85 } = config;

  // Step 1: Filter known dead ends (legacy miss hash)
  const viable = messages.filter(m => !misses.includes(m.directionHash));

  // Step 2: Check Dead-End Registry for current direction similarity
  const registry = new DeadEndRegistry(context.registryStore);
  const deadEndMatches = registry.match(session_id, direction.trace || direction, 0.82);
  const isNearDeadEnd = deadEndMatches.length > 0;

  // Step 3: Score by QTS (stub — replace with real QTS implementation)
  const scored = viable.map(m => {
    let score = qtsStub(m, direction);
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

function qtsStub(message, direction) {
  // Placeholder: intent_match + phase_match + tool_relevance + causal_proximity
  return 0.8;
}
