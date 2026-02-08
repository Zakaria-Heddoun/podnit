export function extractList(payload: any): any[] {
  if (!payload) return [];

  // Direct array payload
  if (Array.isArray(payload)) return payload;

  // Common Laravel resource shapes
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;

  // Common variants
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;

  // If payload.data is an object with an array property, return the first array found
  if (payload.data && typeof payload.data === 'object') {
    const values = Object.values(payload.data);
    const arr = values.find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr;
  }

  return [];
}
