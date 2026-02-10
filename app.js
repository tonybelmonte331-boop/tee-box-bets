/* ---------- DOM ---------- */

const winnerButtons = document.getElementById("winnerButtons");
const skinsBox = document.getElementById("skinsBox");
const vegasBox = document.getElementById("vegasBox");

const teamAInputs = document.getElementById("teamAInputs");
const teamBInputs = document.getElementById("teamBInputs");

const teamALabel = document.getElementById("teamALabel");
const teamBLabel = document.getElementById("teamBLabel");

const birdieToggle = document.getElementById("birdieToggle");
const eagleToggle = document.getElementById("eagleToggle");

const holeDisplay = document.getElementById("holeDisplay");
const potDisplay = document.getElementById("potDisplay");
const leaderboard = document.getElementById("leaderboard");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardModalList = document.getElementById("leaderboardModalList");
const leaderboardFinishBtn = document.getElementById("leaderboardFinishBtn");

const teamAPlayers = document.getElementById("teamAPlayers");
const teamBPlayers = document.getElementById("teamBPlayers");

const tieBtn = document.getElementById("tieBtn");

/* ---------- STATE ---------- */

let currentGame;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

/* ---------- NAV ---------- */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goHome=()=>show("step-home");
window.goGameSelect=()=>show("step-game");
window.showRules=()=>show("rules-screen");

/* ---------- SETUP ---------- */

window.selectGame = game =>{
 currentGame = game;
 document.getElementById("wagerLabel").textContent =
 game==="skins" ? "Wager per player" : "Wager per point";
 show("step-style");
};

window.nextTeams = ()=>{
 playStyle=document.getElementById("playStyle").value;
 playerCount=parseInt(document.getElementById("playerCount").value);
 playStyle==="teams"?show("step-teams"):buildPlayers();
};

window.nextPlayers = ()=>{
 teamAName=document.getElementById("teamAName").value||"Team 1";
 teamBName=document.getElementById("teamBName").value||"Team 2";
 buildPlayers();
};

function buildPlayers(){
 teamAInputs.innerHTML="";
 teamBInputs.innerHTML="";

 teamALabel.textContent = playStyle==="teams" ? teamAName : "Players";
 teamBLabel.textContent = playStyle==="teams" ? teamBName : "";

 if(playStyle==="teams"){
 for(let i=0;i<playerCount/2;i++){
 teamAInputs.innerHTML+=`<input placeholder="Player ${i+1} name">`;
 teamBInputs.innerHTML+=`<input placeholder="Player ${i+1} name">`;
 }
 } else {
 for(let i=0;i<playerCount;i++){
 teamAInputs.innerHTML+=`<input placeholder="Player ${i+1} name">`;
 }
 }
 show("step-players");
}

window.nextSettings=()=>show("step-settings");

/* ---------- START ROUND ---------- */

window.startRound = ()=>{
 players=[];
 teams={A:[],B:[]};
 ledger={};
 hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 const n=i.value;
 players.push(n);
 ledger[n]=0;
 if(playStyle==="teams") teams.A.push(n);
 });

 if(playStyle==="teams"){
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 const n=i.value;
 players.push(n);
 ledger[n]=0;
 teams.B.push(n);
 });
 }

 baseWager=parseFloat(document.getElementById("baseWager").value);
 holeLimit=parseInt(document.getElementById("holeLimit").value);

 skinsGame.reset(baseWager);

 show("game-screen");

 skinsBox.classList.toggle("hidden",currentGame==="vegas");
 vegasBox.classList.toggle("hidden",currentGame!=="vegas");

 if(currentGame==="vegas"){
 teamAPlayers.textContent = teams.A.join(" & ");
 teamBPlayers.textContent = teams.B.join(" & ");
 }

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS ---------- */

function buildWinnerButtons(){
 winnerButtons.innerHTML="";

 if(playStyle==="teams"){
 const a=document.createElement("button");
 a.textContent=teamAName;
 a.onclick=()=>handleTeamWin("A");

 const b=document.createElement("button");
 b.textContent=teamBName;
 b.onclick=()=>handleTeamWin("B");

 winnerButtons.appendChild(a);
 winnerButtons.appendChild(b);
 } else {
 players.forEach(p=>{
 const btn=document.createElement("button");
 btn.textContent=p;
 btn.onclick=()=>handlePlayerWin(p);
 winnerButtons.appendChild(btn);
 });
 }
}

function applyBonus(){
 if(birdieToggle.checked) skinsGame.applyBonus("birdie");
 if(eagleToggle.checked) skinsGame.applyBonus("eagle");
}

function clearBonus(){
 birdieToggle.checked=false;
 eagleToggle.checked=false;
 skinsGame.clearBonus();
}

function handlePlayerWin(p){
 applyBonus();
 skinsGame.winPlayer(p,players,ledger);
 clearBonus();
 nextHole();
}

function handleTeamWin(t){
 applyBonus();
 skinsGame.winTeam(t,teams,ledger);
 clearBonus();
 nextHole();
}

tieBtn.onclick=()=>{
 applyBonus();
 skinsGame.tie();
 nextHole();
};

/* ---------- VEGAS ---------- */

window.finishVegasHole = ()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

 const swing=vegasGame.calculate(
 a[0],a[1],b[0],b[1],
 baseWager,
 birdieFlip.checked
 );

 if(swing){
 const win=vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose=win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }

 nextHole();
};

/* ---------- FLOW ---------- */

function nextHole(){
 updateUI();

 if(hole>=holeLimit){
 showEndModal();
 return;
 }

 hole++;
 updateUI();
}

function updateUI(){
 holeDisplay.textContent=`Hole ${hole}`;

 potDisplay.textContent =
 currentGame==="skins"
 ? `$${skinsGame.currentPot()}/player`
 : "";

 leaderboard.innerHTML =
 players.map(p=>`${p}: $${ledger[p]}`).join("<br>");
}

/* ---------- END ROUND ---------- */

function showEndModal(){
 leaderboardModalList.innerHTML=leaderboard.innerHTML;
 leaderboardModal.classList.remove("hidden");

 leaderboardFinishBtn.onclick=()=>{
 leaderboardModal.classList.add("hidden");
 show("step-home");
 };
}