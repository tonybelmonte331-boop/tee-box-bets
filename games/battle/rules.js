registerGameRules("battle", {
  title: "Net Battle",
  icon: "⚔️",
  description: `
    <p>A handicap-based stroke play game where players compete on their net score — making it fair for all skill levels.</p>
    <h4>Modes</h4>
    <ul>
      <li><strong>Free For All</strong> — 2–4 players, each competing individually on net score.</li>
      <li><strong>2v2 Teams</strong> — Two teams of two. Team net score = combined net strokes of both players. Lowest team net wins.</li>
    </ul>
    <h4>Handicap Strokes</h4>
    <p>Each player's course handicap is calculated from their index, course rating, and slope. Strokes are distributed by hole difficulty ranking if a course is selected, or evenly across holes. A yellow indicator shows holes where you receive a stroke. For 9-hole rounds, handicap is halved automatically.</p>
    <h4>Payout Modes</h4>
    <ul>
      <li><strong>Flat Pot</strong> — all players put in the wager amount. Lowest net score (or team) wins the pot.</li>
      <li><strong>Per Stroke</strong> — set a dollar amount per stroke. Each pair (or team) settles based on net score difference × wager.</li>
    </ul>
  `
});