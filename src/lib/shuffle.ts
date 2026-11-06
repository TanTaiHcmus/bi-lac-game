/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Random teams of `teamSize` each; whoever is left over sits out. */
export function drawTeams<T>(pool: readonly T[], teamSize: number) {
  const shuffled = shuffle(pool);
  return {
    teamA: shuffled.slice(0, teamSize),
    teamB: shuffled.slice(teamSize, teamSize * 2),
    bench: shuffled.slice(teamSize * 2),
  };
}
