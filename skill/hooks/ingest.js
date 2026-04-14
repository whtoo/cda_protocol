module.exports = async function ingest(context) {
  return { stored: context.messages.length };
}
