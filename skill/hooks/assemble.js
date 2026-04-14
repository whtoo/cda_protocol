/**
 * CDA Protocol — Assemble Hook
 * Filters candidate messages by semantic direction and known miss history.
 */
module.exports = async function assemble(context, config) {
  const { messages, direction, misses } = context;
  const { delta_threshold, keep_threshold } = config;

  // Step 1: Filter known dead ends
  const viable = messages.filter(m => !misses.includes(m.directionHash));

  // Step 2: Score by QTS (stub — replace with real QTS implementation)
  const scored = viable.map(m => ({
    ...m,
    score: qtsStub(m, direction)
  }));

  // Step 3: Apply thresholds
  const keep = scored.filter(m => m.score >= keep_threshold);

  return {
    contextItems: keep,
    filteredCount: messages.length - keep.length,
    directionAligned: true
  };
};

function qtsStub(message, direction) {
  // Placeholder: intent_match + phase_match + tool_relevance + causal_proximity
  return 0.8;
}
