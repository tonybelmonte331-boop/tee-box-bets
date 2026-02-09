/* ---------- DOM BINDINGS (CRITICAL) ---------- */

const winnerButtons = document.getElementById("winnerButtons");
const skinsBox = document.getElementById("skinsBox");
const vegasBox = document.getElementById("vegasBox");

const teamAInputs = document.getElementById("teamAInputs");
const teamBInputs = document.getElementById("teamBInputs");

const birdieToggle = document.getElementById("birdieToggle");
const eagleToggle = document.getElementById("eagleToggle");

const holeDisplay = document.getElementById("holeDisplay");
const potDisplay = document.getElementById("potDisplay");
const leaderboard = document.getElementById("leaderboard");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardModalList = document.getElementById("leaderboardModalList");
const leaderboardFinishBtn = document.getElementById("leaderboardFinishBtn");
let currentGame;
let wagerMode;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

/* NAV */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goHome = ()=> show("step-home");
window.goGameSelect = ()=> show("step-game");
window.showRules = ()=> show("rules-screen");

/* SETUP */

window.selectGame = (game,mode)=>{
 currentGame = game;
 wagerMode = mode;
 document.getElementById("wagerLabel").textContent =
 mode==="player" ? "Wager per player" : "Wager per point";
 show("step-style");
};

window.nextTeams = ()=>{
 playStyle = document.getElementById("playStyle").value;
 playerCount = parseInt(document.getElementById("playerCount").value);
 playStyle==="teams" ? show("step-teams") : buildPlayers();
};

window.nextPlayers = ()=>{
 teamAName = document.getElementById("teamAName").value || "Team 1";
 teamBName = document.getElementById("teamBName").value || "Team 2";
 buildPlayers();
};

function buildPlayers(){
 teamAInputs.innerHTML="";
 teamBInputs.innerHTML="";

 if(playStyle==="teams"){
 for(let i=0;i<playerCount/2;i++){
 teamAInputs.innerHTML+=`<input>`;
 teamBInputs.innerHTML+=`<input>`;
 }
 } else {
 for(let i=0;i<playerCount;i++){
 teamAInputs.innerHTML+=`<input>`;
 }
 }
 show("step-players");
}

window.nextSettings = ()=> show("step-settings");

/* START ROUND */

window.startRound = ()=>{
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value);
 ledger[i.value]=0;
 if(playStyle==="teams") teams.A.push(i.value);
 });

 if(playStyle==="teams"){
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value);
 ledger[i.value]=0;
 teams.B.push(i.value);
 });
 }

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 skinsGame.reset(baseWager);

 show("game-screen");

 skinsBox.classList.toggle("hidden", currentGame==="vegas");
 vegasBox.classList.toggle("hidden", currentGame!=="vegas");

 teamABox.textContent = teamAName;
 teamBBox.textContent = teamBName;

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS (EVENT LISTENER VERSION — STABLE) ---------- */

function buildWinnerButtons(){
winnerButtons.innerHTML = "";

if(playStyle === "teams"){

const btnA = document.createElement("button");
btnA.textContent = teamAName;
btnA.addEventListener("click", () => handleTeamWin("A"));

const btnB = document.createElement("button");
btnB.textContent = teamBName;
btnB.addEventListener("click", () => handleTeamWin("B"));

winnerButtons.appendChild(btnA);
winnerButtons.appendChild(btnB);

} else {

players.forEach(player=>{
const btn = document.createElement("button");
btn.textContent = player;
btn.addEventListener("click", () => handlePlayerWin(player));
winnerButtons.appendChild(btn);
});

}
}

function handlePlayerWin(player){
skinsGame.winPlayer(player, players, ledger);
resetHoleBonuses();
nextHole();
}

function handleTeamWin(team){
skinsGame.winTeam(team, teams, ledger);
resetHoleBonuses();
nextHole();
}

/* Tie button */

document.getElementById("tieBtn").addEventListener("click", ()=>{
skinsGame.tie();
resetHoleBonuses();
nextHole();
});

/* Birdie / Eagle toggles */

window.toggleBirdie = ()=>{
if(birdieToggle.checked){
eagleToggle.checked = false;
skinsGame.applyBonus("birdie", baseWager);
} else {
skinsGame.clearBonus();
}
};

window.toggleEagle = ()=>{
if(eagleToggle.checked){
birdieToggle.checked = false;
skinsGame.applyBonus("eagle", baseWager);
} else {
skinsGame.clearBonus();
}
};

function resetHoleBonuses(){
birdieToggle.checked = false;
eagleToggle.checked = false;
skinsGame.clearBonus();
}

/* VEGAS (UNCHANGED) */

window.finishVegasHole = ()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

 const swing = vegasGame.calculate(
 a[0],a[1],b[0],b[1],
 baseWager,
 birdieFlip.checked
 );

 if(swing){
 const win = vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose = win==="A"?"B":"A";
 teams[lose].forEach(p=> ledger[p]-=swing);
 teams[win].forEach(p=> ledger[p]+=swing);
 }

 nextHole();
};

/* ROUND FLOW */

function nextHole(){
 updateUI();

 if(hole===9 && holeLimit===18){
 showEndModal("Continue to Back 9");
 return;
 }

 if(hole>=holeLimit){
 showEndModal("Finish Round");
 return;
 }

 hole++;
 updateUI();
}

function updateUI(){
 holeDisplay.textContent = `Hole ${hole}`;
 potDisplay.textContent =
 currentGame==="skins"
 ? `$${skinsGame.currentPot(baseWager)}/player`
 : "";

 leaderboard.innerHTML="";
 players.forEach(p=>{
 leaderboard.innerHTML += `${p}: $${ledger[p]}<br>`;
 });
}

/* END ROUND MODAL */

function showEndModal(text){
 leaderboardModalList.innerHTML = leaderboard.innerHTML;
 leaderboardFinishBtn.textContent = text;

 leaderboardFinishBtn.onclick = ()=>{
 leaderboardModal.classList.add("hidden");

 if(text === "Continue to Back 9"){
 hole++;
 updateUI();
 return;
 }

 // Finish Round
 hole = 1;
 show("step-home");
 };

 leaderboardModal.classList.remove("hidden");
}