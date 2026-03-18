registerGameUI("baseball", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;

    this.setupLabels();
    this.setupInputVisibility();

    window.finishBaseballHole = () => this.finishHole();
  },

  setupLabels() {
    const away = document.getElementById("baseballAwayLabel");
    const home = document.getElementById("baseballHomeLabel");
    if (away) away.textContent = `Away: ${this.teams.A.join(" & ")}`;
    if (home) home.textContent = `Home: ${this.teams.B.join(" & ")}`;
  },

  setupInputVisibility() {
    const a2 = document.getElementById("baseballAwayScore2");
    const b2 = document.getElementById("baseballHomeScore2");
    const is1v1 = this.teams.A.length === 1;

    if (is1v1) {
      a2?.classList.add("hidden");
      b2?.classList.add("hidden");
    } else {
      a2?.classList.remove("hidden");
      b2?.classList.remove("hidden");
    }

    // Placeholders = player names
    const a1el = document.getElementById("baseballAwayScore1");
    if (a1el) a1el.placeholder = this.teams.A[0] || "Away 1";
    if (a2)   a2.placeholder   = this.teams.A[1] || "Away 2";

    const b1el = document.getElementById("baseballHomeScore1");
    if (b1el) b1el.placeholder = this.teams.B[0] || "Home 1";
    if (b2)   b2.placeholder   = this.teams.B[1] || "Home 2";
  },

  finishHole() {
    const is1v1 = this.teams.A.length === 1;

    const a1 = +document.getElementById("baseballAwayScore1").value || 0;
    const a2 = is1v1 ? 0 : (+document.getElementById("baseballAwayScore2").value || 0);
    const b1 = +document.getElementById("baseballHomeScore1").value || 0;
    const b2 = is1v1 ? 0 : (+document.getElementById("baseballHomeScore2").value || 0);

    if (!a1 && !b1) return;

    // Best score per team (lowest = better in golf)
    const scoreA = is1v1 ? a1 : Math.min(a1, a2);
    const scoreB = is1v1 ? b1 : Math.min(b1, b2);

    const birdie = document.getElementById("baseballBirdie").checked;

    saveState();

    GAME_ENGINES.baseball.recordHole(hole, scoreA, scoreB, birdie, baseWager, teams, ledger);

    // Clear inputs
    ["baseballAwayScore1","baseballAwayScore2","baseballHomeScore1","baseballHomeScore2"]
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

    document.getElementById("baseballBirdie").checked = false;

    nextHole();
  },

  onHoleChange() {
    this.update();
  },

  update() {
    const inning = Math.ceil(hole / 2);
    const isTop  = hole % 2 === 1;
    const el = document.getElementById("baseballInning");
    if (el) el.textContent = (isTop ? "Top" : "Bottom") + " of Inning " + inning;
  }

});
