registerGameUI("vegas", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;

    // Labels already in HTML via teamAPlayers / teamBPlayers
    // Wire the finish button
    window.finishVegasHole = () => this.finishHole();
  },

  finishHole() {
    const a1 = +document.getElementById("a1").value;
    const a2 = +document.getElementById("a2").value;
    const b1 = +document.getElementById("b1").value;
    const b2 = +document.getElementById("b2").value;

    if (!a1 || !b1) return;

    // 2-player mode: a2/b2 may be 0 — treat as single score
    const isTeams = this.teams.A.length > 1;

    const scoreA1 = a1;
    const scoreA2 = isTeams ? a2 : a1;
    const scoreB1 = b1;
    const scoreB2 = isTeams ? b2 : b1;

    const flip  = document.getElementById("birdieFlip").checked;
    const wager = baseWager;

    saveState();

    const winner = vegasGame.winner(scoreA1, scoreA2, scoreB1, scoreB2);
    const payout = vegasGame.calculate(scoreA1, scoreA2, scoreB1, scoreB2, wager, flip);

    if (payout > 0) {
      const loser = winner === "A" ? "B" : "A";
      teams[winner].forEach(p => ledger[p] += payout);
      teams[loser].forEach(p  => ledger[p] -= payout);
    }

    // Clear inputs
    ["a1","a2","b1","b2"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    document.getElementById("birdieFlip").checked = false;

    nextHole();
  },

  onHoleChange() {},
  update() {}

});