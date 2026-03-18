registerGameRules("vegas", {
  title: "Vegas",
  icon: "🎰",
  description: `
    <p>A 2v2 team game. Each player records their score per hole.</p>
    <p>Each team combines their two scores to form the <strong>lowest possible two-digit number</strong>. For example, scores of 4 and 3 become <strong>34</strong> (not 43).</p>
    <p>The difference between the two team numbers equals the <strong>points</strong> won that hole.</p>
    <p>Points × wager per point = payout.</p>
    <h4>Birdie Flip</h4>
    <p>If a player makes birdie or better, the <strong>losing team's</strong> two scores are flipped to the worst possible number — turning the hole into a bigger swing.</p>
  `
});