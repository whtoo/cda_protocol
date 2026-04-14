/**
 * CDA Protocol — Bootstrap Hook
 * Pre-warms hot experiences before cold history.
 */
module.exports = async function bootstrap(context) {
  const { hotExperiences = [], coldHistory = [] } = context;
  return {
    preWarm: hotExperiences,
    coldLoad: coldHistory,
    phase: 'bootstrap'
  };
}
