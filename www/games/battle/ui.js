registerGameUI("battle", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.teams     = teams;
    this.ledger    = ledger;
    this.baseWager = baseWager;
    this.renderHole();
  },

  renderHole() {
    const box = document.getElementById("battleBox");
    if(!box) return;
    box.innerHTML = "";

    box.appendChild(this.buildTally());

    const par = (typeof bettingCourse !== "undefined" && bettingCourse?.pars)
      ? bettingCourse.pars[hole - 1] : null;

    if(par){
      const parEl = document.createElement("div");
      parEl.style.cssText = "font-size:12px;opacity:.5;margin-bottom:12px;";
      parEl.textContent = `Hole ${hole} — Par ${par}`;
      box.appendChild(parEl);
    }

    const ch = battleGame.getCourseHandicaps();
    const inputArea = document.createElement("div");
    inputArea.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-bottom:16px;";

    this.players.forEach(p => {
      const strokes  = battleGame.strokesForHole(p, hole - 1);
      const hcpLabel = strokes > 0
        ? `<span style="color:#f1c40f;font-size:11px;margin-left:6px;">-${strokes} stroke${strokes > 1 ? "s" : ""}</span>` : "";

      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:12px;";
      row.innerHTML = `
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${p}${hcpLabel}</div>
          <div style="font-size:11px;opacity:.5;">HCP: ${ch[p] ?? "—"} course strokes</div>
        </div>
        <input id="battle_${p}" type="number" inputmode="numeric"
          class="score-input" placeholder="Gross"
          style="width:80px;text-align:center;">
      `;
      inputArea.appendChild(row);
    });

    box.appendChild(inputArea);

    const actions = document.createElement("div");
    actions.className = "hole-actions";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = hole >= holeLimit ? "Finish Round" : "Next Hole";
    nextBtn.onclick = () => this.finishHole();

    const undoBtn = document.createElement("button");
    undoBtn.className = "undo-btn";
    undoBtn.textContent = "Undo";
    undoBtn.onclick = () => undoHole();

    actions.appendChild(nextBtn);
    actions.appendChild(undoBtn);
    box.appendChild(actions);
  },

  finishHole() {
    const scores = {};
    let valid = true;
    this.players.forEach(p => {
      const val = +document.getElementById(`battle_${p}`)?.value;
      if(!val){ valid = false; return; }
      scores[p] = val;
    });
    if(!valid) return;

    saveState();
    battleGame.recordHole(hole - 1, scores);

    if(hole >= holeLimit){
      battleGame.settle(this.players, baseWager, ledger, teams);
    }

    nextHole();
  },

  buildTally() {
    const nets  = battleGame.getNetScores();
    const ch    = battleGame.getCourseHandicaps();
    const tally = document.createElement("div");
    tally.className = "dots-tally";
    tally.style.cssText = `
      display:grid;
      grid-template-columns:repeat(${this.players.length}, 1fr);
      gap:6px;
      margin-bottom:16px;
      padding:12px 8px;
      background:rgba(255,255,255,.06);
      border-radius:12px;
    `;
    this.players.forEach(p => {
      const net = nets[p] || 0;
      const col = document.createElement("div");
      col.style.cssText = "text-align:center;min-width:0;";
      col.innerHTML = `
        <div style="font-size:11px;opacity:.75;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p}</div>
        <div style="font-size:22px;font-weight:800;line-height:1.1;">${net}</div>
        <div style="font-size:10px;opacity:.5;">${ch[p]!==undefined ? "hcp "+ch[p] : "net"}</div>
      `;
      tally.appendChild(col);
    });
    return tally;
  },

  updateTally() {
    const box = document.getElementById("battleBox");
    if(!box) return;
    const existing = box.querySelector(".dots-tally");
    if(existing) existing.replaceWith(this.buildTally());
  },

  onHoleChange() { this.renderHole(); updateUI(); },
  update() { this.updateTally(); }

});