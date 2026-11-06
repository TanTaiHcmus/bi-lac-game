// A match is worth the bigger team's size in points, split evenly on each side.
// Equal teams: ±1 each. 1 vs 3: the lone player ±3, each of the three ±1.
// REBUILD_STATS in db.ts applies the same rule in SQL.

/** Uneven teams are fine when the bigger one is a multiple of the smaller (1–2, 1–3, 2–4…). */
export function isValidSplit(sizeA: number, sizeB: number) {
  return sizeA > 0 && sizeB > 0 && Math.max(sizeA, sizeB) % Math.min(sizeA, sizeB) === 0;
}

/** Points each member of a team wins (or loses). */
export function pointsEach(ownSize: number, otherSize: number) {
  return Math.max(ownSize, otherSize) / ownSize;
}
