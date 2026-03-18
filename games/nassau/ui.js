registerGameUI("nassau", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;

    this.frontWager = +document.getElementById("frontWager").value || baseWager;
    this.backWager  = +document.getElementById("backWager").value  || baseWager;
    this.totalWager = +document.getElementById("totalWager").value || baseWager;

    this.renderWinnerButtons();
    this.wireTieBtn();
  },

  renderWinnerButtons() {
    const box = document.getElementById("nassauWinners");
    if (!box) return;
    box.innerHTML = "";

    [["A", teamAName], ["B", teamBName]].forEach(([key, label]) => {
      const btn = document.createElement("button");
      btn.textContent = label + " Wins Hole";
      btn.onclick = () => {
        saveState();
        nassauGame.recordHole(key, hole);

        // Settle at end of front 9
        if (hole === 9) {
          nassauGame.settleFront(this.frontWager, teams, ledger);
        }
        // Settle at end of back 9
        if (hole === 18) {
          nassauGame.settleBack(this.backWager, teams, ledger);
          nassauGame.settleOverall(this.totalWager, teams, ledger);
        }

        nextHole();
      };
      box.appendChild(btn);
    });
  },

  wireTieBtn() {
    const btn = document.getElementById("nassauTieBtn");
    if (!btn) return;
    btn.onclick = () => {
      saveState();
      // Tied hole — no points awarded, but still settle if end of 9
      if (hole === 9) {
        nassauGame.settleFront(this.frontWager, teams, ledger);
      }
      if (hole === 18) {
        nassauGame.settleBack(this.backWager, teams, ledger);
        nassauGame.settleOverall(this.totalWager, teams, ledger);
      }
      nextHole();
    };
  },

  onHoleChange() {
    this.renderWinnerButtons();
    this.wireTieBtn();
  },

  update() {}

});