export function computeConfidence(opts: {
  hasAuthor: boolean;
  hasExcerpt: boolean;
}): number {
  let base = 0.85;
  if (!opts.hasAuthor) base -= 0.1;
  if (!opts.hasExcerpt) base -= 0.05;
  if (base < 0.5) base = 0.5;
  return Math.round(base * 100) / 100;
}
