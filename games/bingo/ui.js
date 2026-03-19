registerGameUI("bingo", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.ledger    = ledger;
    this.baseWager = baseWager;

    bingoGame.initPlayers(players);
    this.renderFull();
  },

  renderFull() {
    const box = document.getElementById("bingoBox");
    if (!box) return;
    box.innerHTML = "";

    box.appendChild(this.buildTally());

    const pointDefs = [
      { label: "🟢 Bingo", sub: "First player to reach the green" },
      { label: "📍 Bango", sub: "Closest to the pin once all are on the green" },
      { label: "🏆 Bongo", sub: "First player to hole out" },
    ];

    pointDefs.forEach(({ label, sub }) => {
      box.appendChild(this.buildPointSection(label, sub));
    });

    const actions = document.createElement("div");
    actions.className = "hole-actions";
    actions.style.marginTop = "16px";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Hole";
    nextBtn.onclick = () => {
      // Scroll to top before advancing
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
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

  buildPointSection(label, sub) {
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

    // Track selected button per section so only one can be highlighted at a time
    let selectedBtn = null;

    this.players.forEach(p => {
      const btn = document.createElement("button");
      btn.textContent = p;
      btn.style.cssText = "flex:1;min-width:80px;";
      btn.dataset.player = p;

      btn.onclick = () => {
        // Deselect previous in this section
        if (selectedBtn && selectedBtn !== btn) {
          selectedBtn.classList.remove("bingo-selected");
          // Undo the previous award for this section
          const prev = selectedBtn.dataset.player;
          const opponents = players.filter(op => op !== prev);
          opponents.forEach(op => ledger[op] += baseWager);
          ledger[prev] -= baseWager * opponents.length;
          bingoGame.getPoints()[prev] = Math.max(0, (bingoGame.getPoints()[prev] || 0) - 1);
        }

        if (selectedBtn === btn) {
          // Clicking same button again deselects
          btn.classList.remove("bingo-selected");
          const opponents = players.filter(op => op !== p);
          opponents.forEach(op => ledger[op] += baseWager);
          ledger[p] -= baseWager * opponents.length;
          bingoGame.getPoints()[p] = Math.max(0, (bingoGame.getPoints()[p] || 0) - 1);
          selectedBtn = null;
          this.updateTally();
          return;
        }

        saveState();
        bingoGame.awardPoint(p, players, baseWager, ledger);
        btn.classList.add("bingo-selected");
        selectedBtn = btn;
        this.updateTally();
        // Don't call updateUI() — leaderboard updates on Next Hole
      };

      btnRow.appendChild(btn);
    });

    const noneBtn = document.createElement("button");
    noneBtn.textContent = "No Award";
    noneBtn.style.cssText = "flex:1;min-width:80px;background:rgba(255,255,255,.1);";
    noneBtn.onclick = () => {
      // Deselect any selected button in this section
      if (selectedBtn) {
        selectedBtn.classList.remove("bingo-selected");
        const prev = selectedBtn.dataset.player;
        const opponents = players.filter(op => op !== prev);
        opponents.forEach(op => ledger[op] += baseWager);
        ledger[prev] -= baseWager * opponents.length;
        bingoGame.getPoints()[prev] = Math.max(0, (bingoGame.getPoints()[prev] || 0) - 1);
        selectedBtn = null;
        this.updateTally();
      }
    };
    btnRow.appendChild(noneBtn);

    section.appendChild(btnRow);
    return section;
  },

  onHoleChange() {
    this.renderFull();
    // Now update leaderboard after hole advances
    updateUI();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  },

  update() {
    // Only update tally, not full leaderboard during hole
    this.updateTally();
  }

});