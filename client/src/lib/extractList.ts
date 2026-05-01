export function extractList(payload: unknown): unknown[] {
  if (!payload) return [];

  // Direct array payload
  if (Array.isArray(payload)) return payload;

  // Common Laravel resource shapes
  if (typeof payload === 'object' && payload !== null) {
    const payloadObj = payload as Record<string, unknown>;
    if (Array.isArray(payloadObj.data)) return payloadObj.data;

    const nestedData = payloadObj.data as Record<string, unknown> | undefined;
    if (nestedData && Array.isArray(nestedData.data)) return nestedData.data;

    // Common variants
    if (Array.isArray(payloadObj.items)) return payloadObj.items;
    if (Array.isArray(payloadObj.results)) return payloadObj.results;

    // If payload.data is an object with an array property, return the first array found
    if (payloadObj.data && typeof payloadObj.data === 'object') {
      const values = Object.values(payloadObj.data);
      const arr = values.find((v) => Array.isArray(v));
      if (Array.isArray(arr)) return arr;
    }
  }

  return [];
}
