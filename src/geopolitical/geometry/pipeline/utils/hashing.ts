// hashing.ts - lightweight FNV-1a hash for coordinate arrays

export function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash >>> 0) * 0x01000193;
  }
  // Convert to 8-char hex
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}

export function hashRings(rings: [number, number][][]): string {
  // Flatten with limited precision to create stable string
  const parts: string[] = [];
  for (const ring of rings) {
    parts.push('|');
    for (const [lng, lat] of ring) {
      parts.push(lng.toFixed(4));
      parts.push(',');
      parts.push(lat.toFixed(4));
      parts.push(';');
    }
  }
  return fnv1aHash(parts.join(''));
}
