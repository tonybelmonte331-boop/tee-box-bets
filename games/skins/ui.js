registerGameUI("skins", {

  build({ players, teams, ledger, baseWager }) {
    this.players = players;
    this.teams   = teams;
    this.ledger  = ledger;
    this.baseWager = baseWager;
    this.renderWinnerButtons();
    this.wireTieBtn();
  },

  renderWinnerButtons() {
    const box = document.getElementById("winnerButtons");
    if (!box) return;
    box.innerHTML = "";

    const isTeams = this.teams.A.length > 1;

    if (isTeams) {
      // Team mode — one button per team
      [["A", teamAName], ["B", teamBName]].forEach(([key, label]) => {
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
      // FFA mode — one button per player
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
