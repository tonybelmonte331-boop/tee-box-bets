registerGameRules("nine", {
  title: "9-Point",
  icon: "9️⃣",
  description: `
    <p>A 3-player game where each hole is worth exactly 9 points, distributed by finishing position.</p>
    <ul>
      <li><strong>1st place</strong> (lowest score) — 5 points</li>
      <li><strong>2nd place</strong> — 3 points</li>
      <li><strong>3rd place</strong> (highest score) — 1 point</li>
    </ul>
    <h4>Ties</h4>
    <ul>
      <li><strong>2-way tie for 1st:</strong> 4 pts each, 3rd gets 1</li>
      <li><strong>2-way tie for 2nd:</strong> winner gets 5, tied players get 2 each</li>
      <li><strong>3-way tie:</strong> 3 pts each</li>
    </ul>
    <h4>Payout</h4>
    <p>At the end of the round, players settle based on the point difference between each pair multiplied by the wager. Example: Tony has 54 pts, Logan has 45 pts — Tony collects 9 × wager from Logan.</p>
  `
});