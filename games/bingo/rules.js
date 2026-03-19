registerGameRules("bingo", {
  title: "Bingo Bango Bongo",
  icon: "🎯",
  description: `
    <p>A points-based game where 3 points are up for grabs every hole — one for each of Bingo, Bango, and Bongo.</p>
    <ul>
      <li><strong>Bingo</strong> — First player to reach the green.</li>
      <li><strong>Bango</strong> — Player closest to the pin once all balls are on the green.</li>
      <li><strong>Bongo</strong> — First player to hole out.</li>
    </ul>
    <h4>Important Rules</h4>
    <p>Players must play in order of distance from the hole — this is what makes Bingo and Bongo fair. Multiple players can win points on the same hole. A player can earn 0–3 points per hole.</p>
    <h4>Payout</h4>
    <p>Each point is worth the base wager. Every point you win collects the wager from each opponent. Example: 3 players, $5 wager — winning a point earns $10 (from 2 opponents).</p>
  `
});