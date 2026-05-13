// Constant-time string comparison: does not short-circuit on length mismatch
// or differing bytes, so secret length and content cannot be inferred from
// response timing.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBuf = enc.encode(a);
  const bBuf = enc.encode(b);
  const len = Math.max(aBuf.byteLength, bBuf.byteLength, 32);
  let mismatch = aBuf.byteLength ^ bBuf.byteLength;
  for (let i = 0; i < len; i++) {
    const av = i < aBuf.byteLength ? aBuf[i] : 0;
    const bv = i < bBuf.byteLength ? bBuf[i] : 0;
    mismatch |= av ^ bv;
  }
  return mismatch === 0 && aBuf.byteLength === bBuf.byteLength;
}
