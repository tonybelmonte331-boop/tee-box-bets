/* ---------- DOM BINDINGS ---------- */

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

/* ---------- STATE ---------- */

let currentGame;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};
let hole=1, holeLimit=9, baseWager=0;

/* ---------- NAV ---------- */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goHome = ()=>show("step-home");
window.goGameSelect = ()=>show("step-game");
window.showRules = ()=>show("rules-screen");

/* ---------- SETUP ---------- */

window.selectGame = (game)=>{
 currentGame = game;
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

window.nextSettings = ()=>show("step-settings");

/* ---------- START ROUND ---------- */

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

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS ---------- */

function buildWinnerButtons(){
 winnerButtons.innerHTML="";
 if(playStyle==="teams"){
 winnerButtons.innerHTML += `
 <button onclick="handleTeamWin('A')">${teamAName}</button>
 <button onclick="handleTeamWin('B')">${teamBName}</button>`;
 } else {
 players.forEach(p=>{
 winnerButtons.innerHTML += `<button onclick="handlePlayerWin('${p}')">${p}</button>`;
 });
 }
}

function applyBonus(){
 if(birdieToggle.checked) skinsGame.applyBonus("birdie", baseWager);
 if(eagleToggle.checked) skinsGame.applyBonus("eagle", baseWager);
}

window.handlePlayerWin = p=>{
 applyBonus();
 skinsGame.winPlayer(p, players, ledger, baseWager);
 resetBonuses();
 nextHole();
};

window.handleTeamWin = t=>{
 applyBonus();
 skinsGame.winTeam(t, teams, ledger, baseWager);
 resetBonuses();
 nextHole();
};

document.addEventListener("click", e=>{
 if(e.target.id === "tieBtn"){
 applyBonus();
 skinsGame.tie();
 resetBonuses();
 nextHole();
 }
});

function resetBonuses(){
 birdieToggle.checked = false;
 eagleToggle.checked = false;
 skinsGame.clearBonus();
}

/* ---------- VEGAS (UNCHANGED) ---------- */

window.finishVegasHole = ()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);
 const swing = vegasGame.calculate(a[0],a[1],b[0],b[1],baseWager,birdieFlip.checked);
 if(swing){
 const win = vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose = win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }
 nextHole();
};

/* ---------- FLOW ---------- */

function nextHole(){
 updateUI();
 if(hole>=holeLimit){ showEndModal(); return; }
 hole++;
 updateUI();
}

function updateUI(){
 holeDisplay.textContent = `Hole ${hole}`;
 potDisplay.textContent = `$${skinsGame.currentPot()}/player`;
 leaderboard.innerHTML = players.map(p=>`${p}: $${ledger[p]}`).join("<br>");
}

function showEndModal(){
 leaderboardModalList.innerHTML = leaderboard.innerHTML;
 leaderboardModal.classList.remove("hidden");
 leaderboardFinishBtn.onclick = ()=>{
 leaderboardModal.classList.add("hidden");
 show("step-home");
 };
}