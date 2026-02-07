let gameType;
let currentGame;

let playStyle;
let playerCount;

let teamAName = "";
let teamBName = "";

let players = [];
let teams = { A: [], B: [] };
let ledger = {};

let hole = 1;
let holeLimit = 9;
let baseWager = 0;

let history = [];

/* ---------------- CORE NAV ---------------- */

function hideAll() {
 document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
}

function selectGame(g) {
 gameType = g;
 currentGame = g === "skins" ? skinsGame : vegasGame;
 hideAll();
 document.getElementById("step-style").classList.remove("hidden");
}

/* ---------------- SETUP FLOW ---------------- */

function nextTeams() {
 playStyle = document.getElementById("playStyle").value;
 playerCount = parseInt(document.getElementById("playerCount").value);

 if (playStyle === "teams") {
 hideAll();
 document.getElementById("step-teams").classList.remove("hidden");
 } else {
 teamAName = "Players";
 nextPlayers();
 }
}

function nextPlayers() {
 teamAName = document.getElementById("teamAName")?.value || "Players";
 teamBName = document.getElementById("teamBName")?.value || "Team 2";

 hideAll();
 document.getElementById("step-players").classList.remove("hidden");

 document.getElementById("teamALabel").textContent = teamAName;
 document.getElementById("teamBLabel").textContent = playStyle === "teams" ? teamBName : "";

 buildPlayerInputs();
}

function buildPlayerInputs() {
 const a = document.getElementById("teamAInputs");
 const b = document.getElementById("teamBInputs");

 a.innerHTML = "";
 b.innerHTML = "";

 if (playStyle === "teams") {
 const half = playerCount / 2;

 for (let i = 0; i < half; i++) {
 a.innerHTML += `<input placeholder="${teamAName} Player ${i + 1}">`;
 b.innerHTML += `<input placeholder="${teamBName} Player ${i + 1}">`;
 }
 } else {
 for (let i = 0; i < playerCount; i++) {
 a.innerHTML += `<input placeholder="Player ${i + 1}">`;
 }
 }
}

function nextSettings() {
 hideAll();
 document.getElementById("step-settings").classList.remove("hidden");
}

/* ---------------- START ROUND ---------------- */

function startRound() {
 players = [];
 teams = { A: [], B: [] };
 ledger = {};
 history = [];
 hole = 1;

 if (playStyle === "teams") {
 document.querySelectorAll("#teamAInputs input").forEach(i => {
 const name = i.value || "Player";
 players.push(name);
 teams.A.push(name);
 ledger[name] = 0;
 });

 document.querySelectorAll("#teamBInputs input").forEach(i => {
 const name = i.value || "Player";
 players.push(name);
 teams.B.push(name);
 ledger[name] = 0;
 });
 } else {
 document.querySelectorAll("#teamAInputs input").forEach(i => {
 const name = i.value || "Player";
 players.push(name);
 ledger[name] = 0;
 });
 }

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 currentGame.reset();

 hideAll();
 document.getElementById("game-screen").classList.remove("hidden");

 buildWinnerButtons();
 updateUI();
}

/* ---------------- GAME BUTTONS ---------------- */

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

/* ---------------- GAMEPLAY ---------------- */

function winPlayer(p) {
 currentGame.winPlayer(p, players, ledger, baseWager);
 history.push(`Hole ${hole}: ${p} won`);
 nextHole();
}

function winTeam(t) {
 currentGame.winTeam(t, teams, ledger, baseWager);
 history.push(`Hole ${hole}: ${t === "A" ? teamAName : teamBName} won`);
 nextHole();
}

function tieHole() {
 if (currentGame.tie) currentGame.tie();
 history.push(`Hole ${hole}: Tie`);
 nextHole();
}

function nextHole() {

 if (hole === 9 && holeLimit === 18) {
 showLeaderboard("Continue to Back 9");
 return;
 }

 if (hole >= holeLimit) {
 showLeaderboard("Finish Round");
 return;
 }

 hole++;
 updateUI();
}

/* ---------------- UI ---------------- */

function updateUI() {
 document.getElementById("holeDisplay").textContent = `Hole ${hole} of ${holeLimit}`;
 document.getElementById("potDisplay").textContent =
 `$${currentGame.currentPot(baseWager)}/player`;

 const l = document.getElementById("ledger");
 l.innerHTML = "";

 players.forEach(p => {
 l.innerHTML += `<div>${p}: $${ledger[p]}</div>`;
 });
}

/* ---------------- MULTIPLIERS ---------------- */

let pendingMulti = 1;

function openMultiplier(m) {
 pendingMulti = m;
 document.getElementById("multiplierModal").classList.remove("hidden");
}

function applyMultiplier(mode) {
 currentGame.applyMultiplier(pendingMulti, mode);
 closeModals();
}

/* ---------------- SIDE BETS ---------------- */

function openSideBet() {
 const wrap = document.getElementById("sideWinners");
 wrap.innerHTML = "";

 if (document.getElementById("sideMode").value === "team" && playStyle === "teams") {
 wrap.innerHTML += `
 <button onclick="sideTeam('A')">${teamAName}</button>
 <button onclick="sideTeam('B')">${teamBName}</button>
 `;
 } else {
 players.forEach(p => {
 wrap.innerHTML += `<button onclick="sidePlayer('${p}')">${p}</button>`;
 });
 }

 document.getElementById("sideBetModal").classList.remove("hidden");
}

function sidePlayer(p) {
 const amt = parseFloat(document.getElementById("sideAmount").value);

 players.forEach(x => {
 if (x === p) ledger[x] += amt * (players.length - 1);
 else ledger[x] -= amt;
 });

 closeModals();
 updateUI();
}

function sideTeam(t) {
 const amt = parseFloat(document.getElementById("sideAmount").value);

 const winners = teams[t];
 const losers = teams[t === "A" ? "B" : "A"];

 losers.forEach(p => ledger[p] -= amt);
 winners.forEach(p => ledger[p] += amt * losers.length / winners.length);

 closeModals();
 updateUI();
}

/* ---------------- MODALS ---------------- */

function openHistory() {
 document.getElementById("historyList").innerHTML =
 history.join("<br>") || "No holes yet";
 document.getElementById("historyModal").classList.remove("hidden");
}

function closeModals() {
 document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
}

/* ---------------- LEADERBOARD ---------------- */

function showLeaderboard(text) {
 const board = document.getElementById("leaderboard");

 board.innerHTML = [...players]
 .sort((a, b) => ledger[b] - ledger[a])
 .map(p => `${p}: $${ledger[p]}`)
 .join("<br>");

 const btn = document.querySelector("#leaderboardModal button");
 btn.textContent = text;

 btn.onclick = () => {
 if (text === "Continue to Back 9") {
 document.getElementById("leaderboardModal").classList.add("hidden");
 hole++;
 updateUI();
 } else {
 location.reload();
 }
 };

 document.getElementById("leaderboardModal").classList.remove("hidden");
}

/* ---------------- INFO BUTTON ---------------- */

function showInfo(game) {
 const text = {
 skins:
 "Skins: Each hole has a wager. Ties carry forward. Birdie doubles and Eagle triples. Winner takes the pot.",
 vegas:
 "Vegas: Team scores combine into a two-digit number. Difference swings the wager. Optional birdie flips, eagle doubles, and carry ties."
 };

 document.getElementById("infoText").textContent = text[game];
 document.getElementById("infoModal").classList.remove("hidden");
}