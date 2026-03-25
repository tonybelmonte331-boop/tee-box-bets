registerGameRules("baseball", {
  title: "Baseball",
  icon: "⚾",
  description: `
    <p>An 18-hole team game structured like a baseball game — 9 innings, 2 holes per inning.</p>
    <p><strong>Hole 1</strong> = Top of 1st (Away team bats), <strong>Hole 2</strong> = Bottom of 1st (Home team bats), and so on.</p>
    <h4>Scoring Runs</h4>
    <p>The team with the <strong>lower score</strong> on their half-inning scores runs equal to the <strong>difference</strong> between the two scores.</p>
    <p>Example: Away shoots 4, Home shoots 6 → Away scores 2 runs in the top half.</p>
    <h4>Birdie</h4>
    <p>If any player makes birdie or better on that hole, runs scored are <strong>doubled</strong>.</p>
    <h4>Payout</h4>
    <p>Each run is worth the base wager. View the live scoreboard at any time during the round.</p>
  `
});