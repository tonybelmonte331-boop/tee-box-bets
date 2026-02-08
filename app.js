let currentGame;let playStyle="teams";
let playerCount=4;

let teamAName="",teamBName="";
let players=[],teams={A:[],B:[]},ledger={};

let hole=1,holeLimit=9,baseWager=0;
let pendingMulti=1;

/* NAV */

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

function goHome(){ hideAll(); step-home.classList.remove("hidden"); }
function goGameSelect(){ hideAll(); step-game.classList.remove("hidden"); }
function showRules(){ hideAll(); rules-screen.classList.remove("hidden"); }

/* SETUP */

function selectGame(g){
currentGame=g;
hideAll(); step-style.classList.remove("hidden");
}

function nextTeams(){
playerCount=parseInt(playerCount.value);
hideAll(); step-teams.classList.remove("hidden");
}

function nextPlayers(){
teamAName=teamAName.value;
teamBName=teamBName.value;

hideAll(); step-players.classList.remove("hidden");

teamALabel.textContent=teamAName;
teamBLabel.textContent=teamBName;

teamAInputs.innerHTML="";
teamBInputs.innerHTML="";

for(let i=0;i<2;i++){
teamAInputs.innerHTML+=`<input>`;
teamBInputs.innerHTML+=`<input>`;
}
}

function nextSettings(){ hideAll(); step-settings.classList.remove("hidden"); }

/* START */

function startRound(){
players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

[...teamAInputs.children].forEach(i=>{
players.push(i.value); teams.A.push(i.value); ledger[i.value]=0;
});
[...teamBInputs.children].forEach(i=>{
players.push(i.value); teams.B.push(i.value); ledger[i.value]=0;
});

baseWager=parseFloat(baseWager.value);
holeLimit=parseInt(holeLimit.value);

hideAll(); game-screen.classList.remove("hidden");

skinsBox.classList.toggle("hidden",currentGame==="vegas");
vegasBox.classList.toggle("hidden",currentGame!=="vegas");

teamABox.textContent=teamAName;
teamBBox.textContent=teamBName;

buildWinnerButtons();
updateUI();
}

/* SKINS */

function buildWinnerButtons(){
winnerButtons.innerHTML="";
players.forEach(p=>winnerButtons.innerHTML+=`<button onclick="winPlayer('${p}')">${p}</button>`);
}

function winPlayer(p){
skinsGame.winPlayer(p,players,ledger,baseWager);
nextHole();
}

function tieHole(){ skinsGame.tie(); nextHole(); }

/* VEGAS */

function finishVegasHole(){

const a1=parseInt(a1.value);
const a2=parseInt(a2.value);
const b1=parseInt(b1.value);
const b2=parseInt(b2.value);

const swing = vegasGame.calculate(
a1,a2,b1,b2,baseWager,birdieFlip.checked
);

if(swing===0){ nextHole(); return; }

const win = vegasGame.winner(a1,a2,b1,b2);
const lose = win==="A"?"B":"A";

teams[lose].forEach(p=>ledger[p]-=swing);
teams[win].forEach(p=>ledger[p]+=swing);

nextHole();
}

/* COMMON */

function nextHole(){
if(hole>=holeLimit){ goHome(); return; }
hole++; updateUI();
}

function updateUI(){
holeDisplay.textContent=`Hole ${hole}`;
ledger.innerHTML="";
players.forEach(p=>ledger.innerHTML+=`${p}: $${ledger[p]}<br>`);
}

/* SIDE BET */

function buildSideWinners(){
sideWinners.innerHTML="";
sideWinners.innerHTML+=`
<button onclick="sideTeam('A')">${teamAName}</button>
<button onclick="sideTeam('B')">${teamBName}</button>`;
}

function openSideBet(){
buildSideWinners();
sideBetModal.classList.remove("hidden");
}

function sideTeam(t){
let amt=parseFloat(sideAmount.value);
teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=amt);
teams[t].forEach(p=>ledger[p]+=amt);
closeModals(); updateUI();
}

/* MULTI */

function openMultiplier(m){
pendingMulti=m;
multiplierModal.classList.remove("hidden");
}

function applyMultiplier(mode){
skinsGame.applyMultiplier(pendingMulti,mode);
closeModals();
}

/* MODAL */

function closeModals(){
document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}