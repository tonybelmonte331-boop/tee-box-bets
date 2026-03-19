registerGameRules("dots", {
  title: "Dots",
  icon: "⭐",
  description: `
    <p>A point-based game where players earn "dots" for achievements on each hole. At the end of the round, players settle up based on their net dot difference against each opponent.</p>
    <h4>Standard Dots</h4>
    <ul>
      <li><strong>Birdie</strong> — 1 dot</li>
      <li><strong>Eagle</strong> — 2 dots</li>
      <li><strong>GIR</strong> — Hit the green in regulation — 1 dot</li>
      <li><strong>FIR</strong> — Tee shot in fairway (par 4 &amp; 5 only) — 1 dot</li>
      <li><strong>One Putt</strong> — 1 dot</li>
      <li><strong>Hole Out</strong> — Hole out from off the green — 2 dots</li>
      <li><strong>Sand Save</strong> — Up &amp; down from a bunker — 1 dot</li>
      <li><strong>Long Drive</strong> — Longest drive in the fairway — 1 dot</li>
      <li><strong>CTP</strong> — Closest to the pin on par 3s (must hit green) — 1 dot</li>
      <li><strong>Low Score</strong> — Lowest score on the hole — 1 dot</li>
    </ul>
    <h4>Setup</h4>
    <p>Before the round starts, choose which dots are active. You can also add custom dots with any name and value.</p>
    <h4>Payout</h4>
    <p>Each dot is worth the agreed wager. At the end, each player compares their total dots against every other player. The net difference × wager is paid out between each pair.</p>
  `
});