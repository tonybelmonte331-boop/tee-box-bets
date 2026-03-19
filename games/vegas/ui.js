registerGameUI("vegas", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;

    this.setupInputs();
    window.finishVegasHole = () => this.finishHole();
  },

  setupInputs() {
    // Set placeholders to player names so inputs are clearly labelled
    const a1 = document.getElementById("a1");
    const a2 = document.getElementById("a2");
    const b1 = document.getElementById("b1");
    const b2 = document.getElementById("b2");

    if(a1) a1.placeholder = this.teams.A[0] || "A1";
    if(a2) a2.placeholder = this.teams.A[1] || "A2";
    if(b1) b1.placeholder = this.teams.B[0] || "B1";
    if(b2) b2.placeholder = this.teams.B[1] || "B2";
  },

  finishHole() {
    const a1 = +document.getElementById("a1").value;
    const a2 = +document.getElementById("a2").value;
    const b1 = +document.getElementById("b1").value;
    const b2 = +document.getElementById("b2").value;

    if (!a1 || !b1) return;

    const flip  = document.getElementById("birdieFlip").checked;
    const wager = baseWager;

    saveState();

    const winner = vegasGame.winner(a1, a2, b1, b2);
    const payout = vegasGame.calculate(a1, a2, b1, b2, wager, flip);

    if (payout > 0) {
      const loser = winner === "A" ? "B" : "A";
      teams[winner].forEach(p => ledger[p] += payout);
      teams[loser].forEach(p  => ledger[p] -= payout);
    }

    // Clear values but keep placeholders
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
