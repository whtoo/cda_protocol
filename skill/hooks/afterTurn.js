/**
 * CDA Protocol — AfterTurn Hook
 * Evaluates alignment score and detects dead-end patterns post-turn.
 */

module.exports = async function afterTurn(context) {
  const { turnResult, direction, session_id } = context;

  // Alignment evaluation
  const alignmentScore = computeAlignment(context);
  const driftDetected = alignmentScore < 0.75;

  // Dead-end detection: if the turn explicitly failed, flag it
  const isFailure = turnResult && (turnResult.status === 'failure' || turnResult.error);
  let deadEndFlagged = false;

  if (isFailure && session_id) {
    deadEndFlagged = true;
    // The actual registration is typically handled by the orchestrator
    // calling registerDeadEnd(); here we just signal it.
  }

  return {
    alignmentScore,
    driftDetected,
    deadEndFlagged,
    recommendation: driftDetected ? 'trigger_compact_or_refocus' : 'continue'
  };
};

function computeAlignment(context) {
  // TODO: replace with real drift calculation between current direction and global intent
  return 0.92;
}
