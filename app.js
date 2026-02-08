let currentGame;
let playStyle, playerCount;
let teamAName = "", teamBName = "";
let players = [], teams = { A: [], B: [] }, ledger = {};
let hole = 1, holeLimit = 9, baseWager = 0;
let pendingMulti = 1;

/* ===== GLOBAL NAV (FIXED) ===== */

window.goHome = () => {
 hideAll();
 document.getElementById("step-home").classList.remove("hidden");
};

window.goGameSelect = () => {
 hideAll();
 document.getElementById("step-game").classList.remove("hidden");
};

window.showRules = () => {
 hideAll();
 document.getElementById("rules-screen").classList.remove("hidden");
};

window.selectGame = (g) => {
 currentGame = g === "skins" ? skinsGame : vegasGame;
 hideAll();
 document.getElementById("step-style").classList.remove("hidden");
};

/* ===== CORE ===== */

function hideAll() {
 document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
}

/* ===== SETUP FLOW ===== */

window.nextTeams = () => {
 playStyle = document.getElementById("playStyle").value;
 playerCount = parseInt(document.getElementById("playerCount").value);

 if (playStyle === "teams") {
 hideAll();
 document.getElementById("step-teams").classList.remove("hidden");
 } else {
 teamAName = "Players";
 nextPlayers();
 }
};

window.nextPlayers = () => {
 teamAName = document.getElementById("teamAName")?.value || "Players";
 teamBName = document.getElementById("teamBName")?.value || "Team 2";

 hideAll();
 document.getElementById("step-players").classList.remove("hidden");

 document.getElementById("teamALabel").textContent = teamAName;
 document.getElementById("teamBLabel").textContent =
 playStyle === "teams" ? teamBName : "";

 const a = document.getElementById("teamAInputs");
 const b = document.getElementById("teamBInputs");
 a.innerHTML = "";
 b.innerHTML = "";

 if (playStyle === "teams") {
 const half = playerCount / 2;
 for (let i = 0; i < half; i++) {
 a.innerHTML += `<input>`;
 b.innerHTML += `<input>`;
 }
 } else {
 for (let i = 0; i < playerCount; i++) {
 a.innerHTML += `<input>`;
 }
 }
};

window.nextSettings = () => {
 hideAll();
 document.getElementById("step-settings").classList.remove("hidden");
};

/* ===== START ROUND ===== */

window.startRound = () => {
 players = [];
 teams = { A: [], B: [] };
 ledger = {};
 hole = 1;

 if (playStyle === "teams") {
 document.querySelectorAll("#teamAInputs input").forEach(i => {
 players.push(i.value);
 teams.A.push(i.value);
 ledger[i.value] = 0;
 });
 document.querySelectorAll("#teamBInputs input").forEach(i => {
 players.push(i.value);
 teams.B.push(i.value);
 ledger[i.value] = 0;
 });
 } else {
 document.querySelectorAll("#teamAInputs input").forEach(i => {
 players.push(i.value);
 ledger[i.value] = 0;
 });
 }

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 currentGame.reset();

 hideAll();
 document.getElementById("game-screen").classList.remove("hidden");

 buildWinnerButtons();
 buildVegasInputs();
 updateUI();
};

/* ===== GAME ===== */

function buildWinnerButtons() {
 const wrap = document.getElementById("winnerButtons");
 wrap.innerHTML = "";

 if (playStyle === "ffa") {
 players.forEach(p => {
 wrap.innerHTML += `<button onclick="winPlayer('${p}')">${p}</button>`;
 });
 } else {
 wrap.innerHTML += `
 <button onclick="winTeam('A')">${teamAName}</button>
 <button onclick="winTeam('B')">${teamBName}</button>
 `;
 }
}

function buildVegasInputs() {
 const v = document.getElementById("vegasInputs");
 v.innerHTML = "";

 if (currentGame !== vegasGame) return;

 teams.A.forEach(() => v.innerHTML += `<input type="number">`);
 teams.B.forEach(() => v.innerHTML += `<input type="number">`);
}

window.winPlayer = (p) => {
 currentGame.winPlayer(p, players, ledger, baseWager);
 nextHole();
};

window.winTeam = (t) => {
 currentGame.winTeam(t, teams, ledger, baseWager);
 nextHole();
};

window.tieHole = () => {
 if (currentGame.tie) currentGame.tie();
 nextHole();
};

function nextHole() {
 if (hole >= holeLimit) {
 goHome();
 return;
 }
 hole++;
 updateUI();
}

function updateUI() {
 document.getElementById("holeDisplay").textContent = `Hole ${hole}`;
 document.getElementById("potDisplay").textContent =
 currentGame.currentPot(baseWager) || "";

 const l = document.getElementById("ledger");
 l.innerHTML = "";

 players.forEach(p => l.innerHTML += `${p}: $${ledger[p]}<br>`);
}

/* ===== SIDE BET ===== */

window.buildSideWinners = () => {
 const wrap = document.getElementById("sideWinners");
 wrap.innerHTML = "";

 if (
 document.getElementById("sideMode").value === "team" &&
 playStyle === "teams"
 ) {
 wrap.innerHTML += `
 <button onclick="sideTeam('A')">${teamAName}</button>
 <button onclick="sideTeam('B')">${teamBName}</button>
 `;
 } else {
 players.forEach(p => {
 wrap.innerHTML += `<button onclick="sidePlayer('${p}')">${p}</button>`;
 });
 }
};

window.openSideBet = () => {
 buildSideWinners();
 document.getElementById("sideBetModal").classList.remove("hidden");
};

window.sidePlayer = (p) => {
 const a = parseFloat(document.getElementById("sideAmount").value);
 players.forEach(x =>
 x === p ? ledger[x] += a * (players.length - 1) : ledger[x] -= a
 );
 closeModals();
 updateUI();
};

window.sideTeam = (t) => {
 const a = parseFloat(document.getElementById("sideAmount").value);
 teams[t === "A" ? "B" : "A"].forEach(p => ledger[p] -= a);
 teams[t].forEach(p => ledger[p] += a);
 closeModals();
 updateUI();
};

/* ===== MULTIPLIER ===== */

window.openMultiplier = (m) => {
 pendingMulti = m;
 document.getElementById("multiplierModal").classList.remove("hidden");
};

window.applyMultiplier = (mode) => {
 currentGame.applyMultiplier(pendingMulti, mode);
 closeModals();
};

/* ===== MODALS ===== */

window.closeModals = () => {
 document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
};