/**
 * CDA Protocol — AfterTurn Hook
 * Evaluates alignment score and detects dead-end patterns post-turn.
 */

const { DeadEndRegistry } = require('../lib/deadEndRegistry');

module.exports = async function afterTurn(context) {
  const { turnResult, direction, session_id, registryStore } = context;

  // Alignment evaluation
  const alignmentScore = computeAlignment(context);
  const driftDetected = alignmentScore < 0.75;

  // Dead-end detection: if the turn explicitly failed, register it
  const isFailure = turnResult && (turnResult.status === 'failure' || turnResult.error);
  let deadEndFlagged = false;

  if (isFailure && session_id) {
    const registry = new DeadEndRegistry(registryStore);
    const trace = direction && (direction.trace || direction);
    const reason = turnResult.error || turnResult.reason || 'turn failed';
    registry.register(session_id, trace || { reason }, reason);
    deadEndFlagged = true;
  }

  return {
    alignmentScore,
    driftDetected,
    deadEndFlagged,
    recommendation: driftDetected ? 'trigger_compact_or_refocus' : 'continue'
  };
};

function computeAlignment(context) {
  // Lightweight drift heuristic: compare current direction with global intent
  const { direction, globalIntent } = context;
  if (!direction || !globalIntent) return 0.92;
  const d = String(direction.content || direction);
  const g = String(globalIntent.content || globalIntent);
  const overlap = textOverlap(d, g);
  // High overlap = low drift
  return 0.5 + 0.5 * overlap;
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
