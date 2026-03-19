registerGameUI("skins", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;
    this.renderWinnerButtons();
    this.wireTieBtn();
  },

  renderWinnerButtons() {
    const box = document.getElementById("winnerButtons");
    if (!box) return;
    box.innerHTML = "";

    // Teams mode = both A and B have players
    const isTeams = this.teams.A.length > 0 && this.teams.B.length > 0;

    if (isTeams && this.teams.A.length > 1) {
      // 2v2 teams — label above each button showing team name + players
      [["A", teamAName], ["B", teamBName]].forEach(([key, label]) => {
        const roster = this.teams[key].join(" & ");
        const lbl = document.createElement("div");
        lbl.textContent = `${label}: ${roster}`;
        lbl.style.cssText = "font-size:13px;opacity:.8;margin-top:10px;margin-bottom:4px;font-weight:600;";
        box.appendChild(lbl);

        const btn = document.createElement("button");
        btn.textContent = label + " Win";
        btn.onclick = () => {
          saveState();
          applyBonus();
          skinsGame.winTeam(key, teams, ledger);
          skinsGame.clearBonus();
          birdieToggle.checked = false;
          eagleToggle.checked  = false;
          nextHole();
        };
        box.appendChild(btn);
      });
    } else {
      // FFA or 1v1 — one button per individual player
      this.players.forEach(p => {
        const btn = document.createElement("button");
        btn.textContent = p + " Wins";
        btn.onclick = () => {
          saveState();
          applyBonus();
          skinsGame.winPlayer(p, players, ledger);
          skinsGame.clearBonus();
          birdieToggle.checked = false;
          eagleToggle.checked  = false;
          nextHole();
        };
        box.appendChild(btn);
      });
    }
  },

  wireTieBtn() {
    const btn = document.getElementById("tieBtn");
    if (!btn) return;
    btn.onclick = () => {
      saveState();
      applyBonus();
      skinsGame.tie();
      birdieToggle.checked = false;
      eagleToggle.checked  = false;
      nextHole();
    };
  },

  onHoleChange() {
    this.renderWinnerButtons();
  },

  update() {}

});