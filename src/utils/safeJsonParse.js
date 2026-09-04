// Drop-in replacement for JSON.parse that returns `fallback` instead of throwing
// when the input is missing or not valid JSON (e.g. corrupted localStorage data).
export const safeJsonParse = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('safeJsonParse: invalid JSON, using fallback', error);
    return fallback;
  }
};

export default safeJsonParse;
