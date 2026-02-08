let currentGame;
let playStyle = "teams";
let playerCount = 4;

let teamAName = "";
let teamBName = "";

let players = [];
let teams = { A: [], B: [] };
let ledger = {};

let hole = 1;
let holeLimit = 9;
let baseWager = 0;

let pendingMulti = 1;

/* ========= CORE NAV ========= */

function hideAll() {
 document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
}

function show(id) {
 hideAll();
 document.getElementById(id).classList.remove("hidden");
}

window.goHome = () => show("step-home");
window.goGameSelect = () => show("step-game");
window.showRules = () => show("rules-screen");

/* ========= SETUP ========= */

window.selectGame = (g) => {
 currentGame = g;
 show("step-style");
};

window.nextTeams = () => {
 playStyle = document.getElementById("playStyle").value;
 playerCount = parseInt(document.getElementById("playerCount").value);
 show("step-teams");
};

window.nextPlayers = () => {
 teamAName = document.getElementById("teamAName").value || "Team A";
 teamBName = document.getElementById("teamBName").value || "Team B";

 document.getElementById("teamALabel").textContent = teamAName;
 document.getElementById("teamBLabel").textContent = teamBName;

 const a = document.getElementById("teamAInputs");
 const b = document.getElementById("teamBInputs");
 a.innerHTML = "";
 b.innerHTML = "";

 for (let i = 0; i < 2; i++) {
 a.innerHTML += `<input>`;
 b.innerHTML += `<input>`;
 }

 show("step-players");
};

window.nextSettings = () => show("step-settings");

/* ========= START ROUND ========= */

window.startRound = () => {
 players = [];
 teams = { A: [], B: [] };
 ledger = {};
 hole = 1;

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

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 show("game-screen");

 document.getElementById("skinsBox").classList.toggle("hidden", currentGame === "vegas");
 document.getElementById("vegasBox").classList.toggle("hidden", currentGame !== "vegas");

 document.getElementById("teamABox").textContent = teamAName;
 document.getElementById("teamBBox").textContent = teamBName;

 buildWinnerButtons();
 updateUI();
};

/* ========= SKINS ========= */

function buildWinnerButtons() {
 const wrap = document.getElementById("winnerButtons");
 wrap.innerHTML = "";
 players.forEach(p => {
 wrap.innerHTML += `<button onclick="winPlayer('${p}')">${p}</button>`;
 });
}

window.winPlayer = (p) => {
 skinsGame.winPlayer(p, players, ledger, baseWager);
 nextHole();
};

window.tieHole = () => {
 skinsGame.tie();
 nextHole();
};

/* ========= VEGAS ========= */

window.finishVegasHole = () => {

 const a1 = parseInt(document.getElementById("a1").value);
 const a2 = parseInt(document.getElementById("a2").value);
 const b1 = parseInt(document.getElementById("b1").value);
 const b2 = parseInt(document.getElementById("b2").value);

 const swing = vegasGame.calculate(
 a1, a2, b1, b2, baseWager,
 document.getElementById("birdieFlip").checked
 );

 if (swing === 0) {
 nextHole();
 return;
 }

 const win = vegasGame.winner(a1, a2, b1, b2);
 const lose = win === "A" ? "B" : "A";

 teams[lose].forEach(p => ledger[p] -= swing);
 teams[win].forEach(p => ledger[p] += swing);

 nextHole();
};

/* ========= COMMON ========= */

function nextHole() {
 if (hole >= holeLimit) {
 show("step-home");
 return;
 }
 hole++;
 updateUI();
}

function updateUI() {
 document.getElementById("holeDisplay").textContent = `Hole ${hole}`;

 const l = document.getElementById("ledger");
 l.innerHTML = "";
 players.forEach(p => {
 l.innerHTML += `${p}: $${ledger[p]}<br>`;
 });
}

/* ========= SIDE BET ========= */

window.openSideBet = () => {
 const wrap = document.getElementById("sideWinners");
 wrap.innerHTML = `
 <button onclick="sideTeam('A')">${teamAName}</button>
 <button onclick="sideTeam('B')">${teamBName}</button>
 `;
 document.getElementById("sideBetModal").classList.remove("hidden");
};

window.sideTeam = (t) => {
 const amt = parseFloat(document.getElementById("sideAmount").value);
 teams[t === "A" ? "B" : "A"].forEach(p => ledger[p] -= amt);
 teams[t].forEach(p => ledger[p] += amt);
 closeModals();
 updateUI();
};

/* ========= MULTIPLIER ========= */

window.openMultiplier = (m) => {
 pendingMulti = m;
 document.getElementById("multiplierModal").classList.remove("hidden");
};

window.applyMultiplier = (mode) => {
 skinsGame.applyMultiplier(pendingMulti, mode);
 closeModals();
};

/* ========= MODALS ========= */

window.closeModals = () => {
 document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
};