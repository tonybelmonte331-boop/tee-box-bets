registerGameUI("dots", {

  build({ players, teams, ledger, baseWager }) {
    this.players   = players;
    this.ledger    = ledger;
    this.baseWager = baseWager;
    this.renderHole();
  },

  renderHole() {
    const box = document.getElementById("dotsBox");
    if (!box) return;
    box.innerHTML = "";

    box.appendChild(this.buildTally());

    const activeDots = dotsGame.getActiveDots();
    const par        = this.getHolePar();

    // selections: single-winner dots store a string, multi-winner dots store a Set
    const selections = {};
    activeDots.forEach(d => {
      selections[d.key] = d.single ? null : new Set();
    });

    if(par !== null){
      const parEl = document.createElement("div");
      parEl.style.cssText = "font-size:12px;opacity:.5;margin-bottom:12px;";
      parEl.textContent   = `Hole ${hole} — Par ${par}`;
      box.appendChild(parEl);
    }

    activeDots.forEach(dot => {
      if(dot.key === "fir" && par !== null && par === 3)  return;
      if(dot.key === "ctp" && par !== null && par !== 3)  return;
      box.appendChild(this.buildDotSection(dot, selections));
    });

    const actions = document.createElement("div");
    actions.className    = "hole-actions";
    actions.style.marginTop = "16px";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = hole >= holeLimit ? "Finish Round" : "Next Hole";
    nextBtn.onclick = () => {
      activeDots.forEach(dot => {
        if(dot.single){
          const w = selections[dot.key];
          if(w && w !== "none") dotsGame.awardDot(w, players, dot.value, ledger);
        } else {
          selections[dot.key].forEach(w => {
            dotsGame.awardDot(w, players, dot.value, ledger);
          });
        }
      });
      if(hole >= holeLimit) dotsGame.settleAll(players, ledger);
      nextHole();
    };

    const undoBtn = document.createElement("button");
    undoBtn.className   = "undo-btn";
    undoBtn.textContent = "Undo";
    undoBtn.onclick     = () => undoHole();

    actions.appendChild(nextBtn);
    actions.appendChild(undoBtn);
    box.appendChild(actions);
  },

  getHolePar() {
    if(typeof currentRound !== "undefined" && currentRound &&
       currentRound.loadedPars && currentRound.loadedPars.length){
      return currentRound.loadedPars[hole - 1] || null;
    }
    return null;
  },

  buildTally() {
    const dots  = dotsGame.getDots();
    const tally = document.createElement("div");
    tally.className  = "dots-tally";
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
        <div style="font-size:26px;font-weight:800;line-height:1.1;">${dots[p] || 0}</div>
        <div style="font-size:10px;opacity:.5;">dots</div>
      `;
      tally.appendChild(col);
    });
    return tally;
  },

  updateTally() {
    const box = document.getElementById("dotsBox");
    if(!box) return;
    const existing = box.querySelector(".dots-tally");
    if(existing) existing.replaceWith(this.buildTally());
  },

  buildDotSection(dot, selections) {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom:14px;";

    const heading = document.createElement("div");
    heading.style.cssText = "font-size:14px;font-weight:700;margin-bottom:6px;";
    heading.textContent   = `${dot.label}  ·  ${dot.value} dot${dot.value > 1 ? "s" : ""}`;
    if(dot.single){
      const badge = document.createElement("span");
      let badgeText = " · 1 winner";
      if(dot.key === "ctp")       badgeText += " · Par 3 only";
      if(dot.key === "longdrive") badgeText += " · Par 4 & 5 only";
      badge.textContent   = badgeText;
      badge.style.cssText = "font-size:10px;opacity:.5;font-weight:400;margin-left:4px;";
      heading.appendChild(badge);
    }
    section.appendChild(heading);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;";

    if(dot.single){
      // Radio-style: only one winner
      const allBtns = [];
      const select  = (btn, value) => {
        allBtns.forEach(b => b.classList.remove("bingo-selected"));
        btn.classList.add("bingo-selected");
        selections[dot.key] = value;
      };
      this.players.forEach(p => {
        const btn = document.createElement("button");
        btn.textContent     = p;
        btn.style.cssText   = "flex:1;min-width:80px;";
        btn.onclick         = () => select(btn, p);
        allBtns.push(btn);
        btnRow.appendChild(btn);
      });
      const noneBtn = document.createElement("button");
      noneBtn.textContent   = "No Award";
      noneBtn.style.cssText = "flex:1;min-width:80px;";
      noneBtn.onclick       = () => select(noneBtn, "none");
      allBtns.push(noneBtn);
      btnRow.appendChild(noneBtn);

    } else {
      // Toggle-style: multiple winners allowed
      this.players.forEach(p => {
        const btn = document.createElement("button");
        btn.textContent   = p;
        btn.style.cssText = "flex:1;min-width:80px;";
        btn.onclick       = () => {
          if(selections[dot.key].has(p)){
            selections[dot.key].delete(p);
            btn.classList.remove("bingo-selected");
          } else {
            selections[dot.key].add(p);
            btn.classList.add("bingo-selected");
          }
        };
        btnRow.appendChild(btn);
      });
    }

    section.appendChild(btnRow);
    return section;
  },

  onHoleChange() {
    this.renderHole();
    updateUI();
  },

  update() {
    this.updateTally();
  }

});