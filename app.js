/* ================= DOM ================= */

const winnerButtons = document.getElementById("winnerButtons");
const skinsBox = document.getElementById("skinsBox");
const vegasBox = document.getElementById("vegasBox");
const nassauBox = document.getElementById("nassauBox");
const nassauWinners = document.getElementById("nassauWinners");

const teamAInputs = document.getElementById("teamAInputs");
const teamBInputs = document.getElementById("teamBInputs");

const birdieToggle = document.getElementById("birdieToggle");
const eagleToggle = document.getElementById("eagleToggle");

const holeDisplay = document.getElementById("holeDisplay");
const potDisplay = document.getElementById("potDisplay");
const leaderboard = document.getElementById("leaderboard");

const leaderboardModal = document.getElementById("leaderboardModal");
const leaderboardModalList = document.getElementById("leaderboardModalList");

const teamAPlayers = document.getElementById("teamAPlayers");
const teamBPlayers = document.getElementById("teamBPlayers");

const tieBtn = document.getElementById("tieBtn");
const nassauTieBtn = document.getElementById("nassauTieBtn");

const sideBetBtn = document.getElementById("sideBetBtn");
const sideBetModal = document.getElementById("sideBetModal");
const sideAmount = document.getElementById("sideAmount");
const sideMode = document.getElementById("sideMode");
const sideWinners = document.getElementById("sideWinners");

const frontWager = document.getElementById("frontWager");
const backWager = document.getElementById("backWager");
const totalWager = document.getElementById("totalWager");
const holeLimitSelect = document.getElementById("holeLimit");

/* ================= STATE ================= */

let currentGame;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

let historyStack=[];

/* ================= HISTORY ================= */

function saveState(){
historyStack.push({
hole,
ledger: JSON.parse(JSON.stringify(ledger)),
skins: currentGame==="skins" ? skinsGame.getState() : null,
nassau: currentGame==="nassau" ? nassauGame.getState() : null
});
}

window.undoHole = ()=>{
if(!historyStack.length) return;

const prev = historyStack.pop();
hole = prev.hole;
ledger = prev.ledger;

if(prev.skins) skinsGame.setState(prev.skins);
if(prev.nassau) nassauGame.setState(prev.nassau);

updateUI();
};

/* ================= START ROUND ================= */

window.startRound = ()=>{
players=[]; teams={A:[],B:[]}; ledger={}; hole=1;
historyStack=[];

document.querySelectorAll("#teamAInputs input").forEach(i=>{
players.push(i.value);
ledger[i.value]=0;
teams.A.push(i.value);
});

document.querySelectorAll("#teamBInputs input").forEach(i=>{
players.push(i.value);
ledger[i.value]=0;
teams.B.push(i.value);
});

baseWager = +document.getElementById("baseWager").value;
holeLimit = currentGame==="nassau" ? 18 : +holeLimitSelect.value;

if(currentGame==="skins") skinsGame.reset(baseWager);
if(currentGame==="nassau") nassauGame.reset();

skinsBox.classList.toggle("hidden",currentGame!=="skins");
vegasBox.classList.toggle("hidden",currentGame!=="vegas");
nassauBox.classList.toggle("hidden",currentGame!=="nassau");

teamAPlayers.textContent=`${teamAName}: ${teams.A.join(" & ")}`;
teamBPlayers.textContent=`${teamBName}: ${teams.B.join(" & ")}`;

if(currentGame==="nassau") buildNassauButtons();
buildWinnerButtons();
updateUI();
};

/* ================= SKINS ================= */

function buildWinnerButtons(){
winnerButtons.innerHTML="";
["A","B"].forEach(t=>{
const btn=document.createElement("button");
btn.textContent=t==="A"?teamAName:teamBName;
btn.onclick=()=>handleTeamWin(t);
winnerButtons.appendChild(btn);
});
}

function applyBonus(){
if(birdieToggle.checked){
eagleToggle.checked=false;
skinsGame.applyBonus("birdie");
}
else if(eagleToggle.checked){
birdieToggle.checked=false;
skinsGame.applyBonus("eagle");
}
}

function handleTeamWin(t){
saveState();
applyBonus();
skinsGame.winTeam(t,teams,ledger);
nextHole();
}

tieBtn.onclick=()=>{
saveState();
applyBonus();
skinsGame.tie();
nextHole();
};

/* ================= VEGAS ================= */

window.finishVegasHole=()=>{
saveState();

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

/* ================= NASSAU ================= */

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
saveState();
nassauGame.recordHole(team,hole);

if(hole===9) nassauGame.settleFront(+frontWager.value,teams,ledger);

if(hole===18){
nassauGame.settleBack(+backWager.value,teams,ledger);
nassauGame.settleOverall(+totalWager.value,teams,ledger);
}

nextHole();
}

nassauTieBtn.onclick=()=>{
saveState();
nextHole();
};

/* ================= SIDE BET (FIXED) ================= */

sideBetBtn.onclick = ()=>{
sideWinners.innerHTML="";
sideBets.setAmount(+sideAmount.value);
sideBets.setMode(sideMode.value);

saveState(); // ← THIS FIXES THE GLITCH

if(sideMode.value==="player"){
players.forEach(p=>{
const btn=document.createElement("button");
btn.textContent=p;
btn.onclick=()=>{
sideBets.applyPlayer(p,players,ledger);
updateUI();
sideBetModal.classList.add("hidden");
};
sideWinners.appendChild(btn);
});
}else{
["A","B"].forEach(t=>{
const btn=document.createElement("button");
btn.textContent=t==="A"?teamAName:teamBName;
btn.onclick=()=>{
sideBets.applyTeam(t,teams,ledger);
updateUI();
sideBetModal.classList.add("hidden");
};
sideWinners.appendChild(btn);
});
}

sideBetModal.classList.remove("hidden");
};

/* ================= FLOW ================= */

function nextHole(){
if(hole>=holeLimit){
leaderboardModalList.innerHTML=leaderboard.innerHTML;
leaderboardModal.classList.remove("hidden");
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