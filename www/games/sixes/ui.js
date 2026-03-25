registerGameUI("sixes", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.ledger    = ledger;
    this.baseWager = baseWager;
    sixesGame.reset(holeLimit);
    this.renderHole();
  },

  renderHole() {
    const box = document.getElementById("sixesBox2");
    if(!box) return;
    box.innerHTML = "";

    const { teamA, teamB, segment } = sixesGame.getTeams(hole, this.players);
    const segLen   = holeLimit === 18 ? 6 : 3;
    const segHole  = ((hole - 1) % segLen) + 1;
    const status   = sixesGame.getSegmentStatus(hole);

    // Segment header
    const segHeader = document.createElement("div");
    segHeader.style.cssText = "background:rgba(255,255,255,.08);border-radius:12px;padding:10px 14px;margin-bottom:14px;font-size:13px;";
    segHeader.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px;">Segment ${segment} — Hole ${segHole} of ${segLen}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#2ecc71;font-weight:700;font-size:15px;">${teamA.join(" & ")}</span>
        <span style="font-size:18px;font-weight:800;letter-spacing:2px;">${status.winsA} – ${status.winsB}</span>
        <span style="color:#3498db;font-weight:700;font-size:15px;">${teamB.join(" & ")}</span>
      </div>
    `;
    box.appendChild(segHeader);

    // Score inputs — one per player, grouped by team
    const buildTeamInputs = (team, color, label) => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "margin-bottom:14px;";
      const lbl = document.createElement("div");
      lbl.style.cssText = `font-size:12px;font-weight:700;color:${color};margin-bottom:8px;`;
      lbl.textContent = label;
      wrap.appendChild(lbl);
      team.forEach(p => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:8px;";
        row.innerHTML = `
          <div style="flex:1;font-weight:600;font-size:14px;">${p}</div>
          <input id="sixes_${p}" type="number" inputmode="numeric"
            class="score-input" placeholder="Score"
            style="width:80px;text-align:center;">
        `;
        wrap.appendChild(row);
      });
      return wrap;
    };

    box.appendChild(buildTeamInputs(teamA, "#2ecc71", teamA.join(" & ")));
    box.appendChild(buildTeamInputs(teamB, "#3498db", teamB.join(" & ")));

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
    const { teamA, teamB } = sixesGame.getTeams(hole, this.players);

    const getScore = (team) => {
      const scores = team.map(p => +document.getElementById(`sixes_${p}`)?.value || 0);
      if(scores.some(s => s === 0)) return null;
      return Math.min(...scores); // best ball
    };

    const scoreA = getScore(teamA);
    const scoreB = getScore(teamB);
    if(scoreA === null || scoreB === null) return;

    saveState();

    const result = sixesGame.recordHole(
      hole, scoreA, scoreB, this.players, baseWager, ledger
    );

    if(result.segmentDone && hole < holeLimit){
      this.showSegmentResult(result, teamA, teamB);
    }

    nextHole();
  },

  showSegmentResult(result, teamA, teamB) {
    const winner = result.segWinner === "A" ? teamA.join(" & ") :
                   result.segWinner === "B" ? teamB.join(" & ") : null;
    if(winner){
      // Brief flash — non-blocking
      const msg = document.createElement("div");
      msg.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a7a4f,#2ecc71);color:#fff;font-weight:800;font-size:18px;padding:20px 30px;border-radius:16px;z-index:9999;text-align:center;";
      msg.textContent = `${winner} win the segment! 🏆`;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    }
  },

  onHoleChange() { this.renderHole(); updateUI(); },
  update() {}

});