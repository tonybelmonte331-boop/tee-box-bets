registerGameUI("bingo", {

  build({ players, teams, ledger, baseWager }) {
    this.players    = players;
    this.ledger     = ledger;
    this.baseWager  = baseWager;
    bingoGame.initPlayers(players);
    this.renderFull();
  },

  renderFull() {
    const box = document.getElementById("bingoBox");
    if (!box) return;
    box.innerHTML = "";

    box.appendChild(this.buildTally());

    const pointDefs = [
      { key: "bingo", label: "🟢 Bingo", sub: "First player to reach the green" },
      { key: "bango", label: "📍 Bango", sub: "Closest to the pin once all are on the green" },
      { key: "bongo", label: "🏆 Bongo", sub: "First player to hole out" },
    ];

    // selections = { bingo: playerName|"none"|null, bango: ..., bongo: ... }
    const selections = { bingo: null, bango: null, bongo: null };

    pointDefs.forEach(({ key, label, sub }) => {
      box.appendChild(this.buildPointSection(key, label, sub, selections));
    });

    const actions = document.createElement("div");
    actions.className = "hole-actions";
    actions.style.marginTop = "16px";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Hole";
    nextBtn.onclick = () => {
      saveState();

      // Apply all 3 selections to ledger at once
      Object.values(selections).forEach(winner => {
        if (winner && winner !== "none") {
          bingoGame.awardPoint(winner, players, baseWager, ledger);
        }
      });

      nextHole();
    };

    const undoBtn = document.createElement("button");
    undoBtn.className = "undo-btn";
    undoBtn.textContent = "Undo";
    undoBtn.onclick = () => undoHole();

    actions.appendChild(nextBtn);
    actions.appendChild(undoBtn);
    box.appendChild(actions);
  },

  updateTally() {
    const box = document.getElementById("bingoBox");
    if (!box) return;
    const existing = box.querySelector(".bingo-tally");
    if (existing) existing.replaceWith(this.buildTally());
  },

  buildTally() {
    const points = bingoGame.getPoints();
    const tally = document.createElement("div");
    tally.className = "bingo-tally";
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
      const col = document.createElement("div");
      col.style.cssText = "text-align:center;min-width:0;";
      col.innerHTML = `
        <div style="font-size:11px;opacity:.75;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p}</div>
        <div style="font-size:26px;font-weight:800;line-height:1.1;">${points[p] || 0}</div>
        <div style="font-size:10px;opacity:.5;">pts</div>
      `;
      tally.appendChild(col);
    });
    return tally;
  },

  buildPointSection(key, label, sub, selections) {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom:14px;";

    const heading = document.createElement("div");
    heading.style.cssText = "font-size:15px;font-weight:700;margin-bottom:2px;";
    heading.textContent = label;

    const subtext = document.createElement("div");
    subtext.style.cssText = "font-size:11px;opacity:.6;margin-bottom:8px;";
    subtext.textContent = sub;

    section.appendChild(heading);
    section.appendChild(subtext);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;";

    // All buttons in this section — used to clear highlights
    const allBtns = [];

    const selectBtn = (btn, value) => {
      allBtns.forEach(b => b.classList.remove("bingo-selected"));
      btn.classList.add("bingo-selected");
      selections[key] = value;
    };

    // Player buttons
    this.players.forEach(p => {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.style.cssText = "flex:1;min-width:80px;";
      btn.onclick = () => selectBtn(btn, p);
      allBtns.push(btn);
      btnRow.appendChild(btn);
    });

    // No Award button
    const noneBtn = document.createElement("button");
    noneBtn.textContent = "No Award";
    noneBtn.style.cssText = "flex:1;min-width:80px;";
    noneBtn.onclick = () => selectBtn(noneBtn, "none");
    allBtns.push(noneBtn);
    btnRow.appendChild(noneBtn);

    section.appendChild(btnRow);
    return section;
  },

  onHoleChange() {
    this.renderFull();
    updateUI();
  },

  update() {
    this.updateTally();
  }

});