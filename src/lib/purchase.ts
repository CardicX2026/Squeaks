// Grant only after the debit succeeds: if CardicX refuses (402, 503, anything), nothing is granted.
export async function purchase<T>(debit: () => Promise<T>, grant: (result: T) => void): Promise<T> {
  const r = await debit();
  grant(r);
  return r;
}
