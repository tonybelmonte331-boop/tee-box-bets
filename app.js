/* ---------- DOM ---------- */

const winnerButtons = document.getElementById("winnerButtons");
const skinsBox = document.getElementById("skinsBox");
const vegasBox = document.getElementById("vegasBox");
const nassauBox = document.getElementById("nassauBox");
const nassauWinners = document.getElementById("nassauWinners");

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

const sideBetBtn = document.getElementById("sideBetBtn");
const sideBetModal = document.getElementById("sideBetModal");
const sideAmount = document.getElementById("sideAmount");
const sideMode = document.getElementById("sideMode");
const sideWinners = document.getElementById("sideWinners");

/* Nassau wagers */
const frontWager = document.getElementById("frontWager");
const backWager = document.getElementById("backWager");
const totalWager = document.getElementById("totalWager");
const nassauWagers = document.getElementById("nassauWagers");
const holeLimitSelect = document.getElementById("holeLimit");

/* ---------- STATE ---------- */

let currentGame;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

/* ---------- SIDE BET ---------- */

sideBetBtn.onclick = ()=>{
 buildSideWinners();
 sideBetModal.classList.remove("hidden");
};

window.closeSideBet = ()=>{
 sideBetModal.classList.add("hidden");
};

sideMode.onchange = buildSideWinners;

function buildSideWinners(){
 sideWinners.innerHTML="";
 sideBets.setAmount(+sideAmount.value);
 sideBets.setMode(sideMode.value);

 if(sideMode.value==="player"){
 players.forEach(p=>{
 const btn=document.createElement("button");
 btn.textContent=p;
 btn.onclick=()=>{
 sideBets.applyPlayer(p,players,ledger);
 updateUI();
 closeSideBet();
 };
 sideWinners.appendChild(btn);
 });
 } else {
 ["A","B"].forEach(t=>{
 const btn=document.createElement("button");
 btn.textContent=t==="A"?teamAName:teamBName;
 btn.onclick=()=>{
 sideBets.applyTeam(t,teams,ledger);
 updateUI();
 closeSideBet();
 };
 sideWinners.appendChild(btn);
 });
 }
}

/* ---------- NAV ---------- */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goHome=()=>show("step-home");
window.goGameSelect=()=>show("step-game");
window.showRules=()=>show("rules-screen");

/* ---------- GAME SELECT ---------- */

window.selectGame = game =>{
 currentGame=game;

 if(game==="nassau"){
 nassauWagers.classList.remove("hidden");
 holeLimitSelect.classList.add("hidden");
 } else {
 nassauWagers.classList.add("hidden");
 holeLimitSelect.classList.remove("hidden");
 }

 document.getElementById("wagerLabel").textContent =
 game==="vegas" ? "Wager per point" : "Wager per player";

 show("step-style");
};

/* ---------- SETUP ---------- */

window.nextTeams = ()=>{
 if(currentGame==="vegas" || currentGame==="nassau"){
 playStyle="teams";
 playerCount=4;
 show("step-teams");
 return;
 }

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

 teamALabel.textContent=playStyle==="teams"?teamAName:"Players";
 teamBLabel.textContent=playStyle==="teams"?teamBName:"";

 if(playStyle==="teams"){
 for(let i=0;i<2;i++){
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
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value);
 ledger[i.value]=0;
 teams.A.push(i.value);
 });

 if(playStyle==="teams"){
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value);
 ledger[i.value]=0;
 teams.B.push(i.value);
 });
 }

 baseWager=+document.getElementById("baseWager").value;

 holeLimit = currentGame==="nassau" ? 18 : +holeLimitSelect.value;

 if(currentGame==="skins") skinsGame.reset(baseWager);
 if(currentGame==="nassau") nassauGame.reset();

 show("game-screen");

 skinsBox.classList.toggle("hidden",currentGame!=="skins");
 vegasBox.classList.toggle("hidden",currentGame!=="vegas");
 nassauBox.classList.toggle("hidden",currentGame!=="nassau");

 if(currentGame==="vegas"){
 teamAPlayers.textContent=teams.A.join(" & ");
 teamBPlayers.textContent=teams.B.join(" & ");
 }

 if(currentGame==="nassau") buildNassauButtons();

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS ---------- */

function buildWinnerButtons(){
 winnerButtons.innerHTML="";
 if(playStyle==="teams"){
 ["A","B"].forEach(t=>{
 const btn=document.createElement("button");
 btn.textContent=t==="A"?teamAName:teamBName;
 btn.onclick=()=>handleTeamWin(t);
 winnerButtons.appendChild(btn);
 });
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
 if(birdieToggle.checked){
 eagleToggle.checked=false;
 skinsGame.applyBonus("birdie");
 } else if(eagleToggle.checked){
 birdieToggle.checked=false;
 skinsGame.applyBonus("eagle");
 }
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

window.finishVegasHole=()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

 const swing=vegasGame.calculate(a[0],a[1],b[0],b[1],baseWager,birdieFlip.checked);

 if(swing){
 const win=vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose=win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }
 nextHole();
};

/* ---------- NASSAU ---------- */

function buildNassauButtons(){
 nassauWinners.innerHTML="";
 ["A","B"].forEach(t=>{
 const btn=document.createElement("button");
 btn.textContent=t==="A"?teamAName:teamBName;
 btn.onclick=()=>winNassauHole(t);
 nassauWinners.appendChild(btn);
 });
}

function winNassauHole(team){
 nassauGame.recordHole(team,hole);

 if(hole===9){
 nassauGame.settleFront(+frontWager.value,teams,ledger);
 }

 if(hole===18){
 nassauGame.settleBack(+backWager.value,teams,ledger);
 nassauGame.settleOverall(+totalWager.value,teams,ledger);
 }

 nextHole();
}
/*—————-NASSAU TIE ————-*/const nassauTieBtn = document.getElementById("nassauTieBtn");

nassauTieBtn.onclick = ()=>{
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

 if(currentGame==="skins"){
 potDisplay.textContent=`$${skinsGame.currentPot()}/player`;
 }

 if(currentGame==="nassau"){
 const s=nassauGame.getStatus();
 potDisplay.textContent=`Front ${s.frontA}-${s.frontB} | Back ${s.backA}-${s.backB} | Total ${s.totalA}-${s.totalB}`;
 }

 leaderboard.innerHTML=players.map(p=>`${p}: $${ledger[p]}`).join("<br>");
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