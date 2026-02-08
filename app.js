
let currentGame;
let playStyle = "teams";
let playerCount = 4;

let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1, holeLimit=9, baseWager=0;
let pendingMulti=1;

/* NAV */

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}
function show(id){
hideAll();
document.getElementById(id).classList.remove("hidden");
}
window.goHome=()=>show("step-home");
window.goGameSelect=()=>show("step-game");
window.showRules=()=>show("rules-screen");

/* SETUP */

window.selectGame=(g)=>{currentGame=g;show("step-style");};

window.nextTeams=()=>{
playStyle=document.getElementById("playStyle").value;
playerCount=parseInt(document.getElementById("playerCount").value);
show("step-teams");
};

window.nextPlayers=()=>{
teamAName=teamAName.value||"Team A";
teamBName=teamBName.value||"Team B";

teamALabel.textContent=teamAName;
teamBLabel.textContent=teamBName;

teamAInputs.innerHTML="";
teamBInputs.innerHTML="";

for(let i=0;i<2;i++){
teamAInputs.innerHTML+=`<input>`;
teamBInputs.innerHTML+=`<input>`;
}
show("step-players");
};

window.nextSettings=()=>show("step-settings");

/* START */

window.startRound=()=>{
players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

document.querySelectorAll("#teamAInputs input").forEach(i=>{
players.push(i.value); teams.A.push(i.value); ledger[i.value]=0;
});
document.querySelectorAll("#teamBInputs input").forEach(i=>{
players.push(i.value); teams.B.push(i.value); ledger[i.value]=0;
});

baseWager=parseFloat(baseWager.value);
holeLimit=parseInt(holeLimit.value);

show("game-screen");

skinsBox.classList.toggle("hidden", currentGame==="vegas");
vegasBox.classList.toggle("hidden", currentGame!=="vegas");

teamABox.textContent=teamAName;
teamBBox.textContent=teamBName;

buildWinnerButtons();
updateUI();
};

/* SKINS */

function buildWinnerButtons(){
winnerButtons.innerHTML="";
if(playStyle==="teams"){
winnerButtons.innerHTML+=`
<button onclick="winTeam('A')">${teamAName}</button>
<button onclick="winTeam('B')">${teamBName}</button>
`;
} else {
players.forEach(p=>{
winnerButtons.innerHTML+=`<button onclick="winPlayer('${p}')">${p}</button>`;
});
}
}

window.winPlayer=(p)=>{
skinsGame.winPlayer(p,players,ledger,baseWager);
nextHole();
};

window.winTeam=(t)=>{
skinsGame.winTeam(t,teams,ledger,baseWager);
nextHole();
};

window.tieHole=()=>{
skinsGame.tie();
nextHole();
};

/* VEGAS */

window.finishVegasHole=()=>{

let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

const swing = vegasGame.calculate(
a[0],a[1],b[0],b[1],
baseWager,
birdieFlip.checked
);

if(swing===0){ nextHole(); return; }

const win = vegasGame.winner(a[0],a[1],b[0],b[1]);
const lose = win==="A"?"B":"A";

teams[lose].forEach(p=>ledger[p]-=swing);
teams[win].forEach(p=>ledger[p]+=swing);

nextHole();
};

/* COMMON */

function nextHole(){
if(hole>=holeLimit){show("step-home");return;}
hole++; updateUI();
}

function updateUI(){
holeDisplay.textContent=`Hole ${hole}`;
potDisplay.textContent=
currentGame==="skins"
? `$${skinsGame.currentPot(baseWager)}/player`
: "";

ledger.innerHTML="";
players.forEach(p=>ledger.innerHTML+=`${p}: $${ledger[p]}<br>`);
}

/* SIDE BET */

window.openSideBet=()=>{
buildSideWinners();
sideBetModal.classList.remove("hidden");
};

function buildSideWinners(){
sideWinners.innerHTML="";
if(sideMode.value==="player"){
players.forEach(p=>{
sideWinners.innerHTML+=`<button onclick="sidePlayer('${p}')">${p}</button>`;
});
} else {
sideWinners.innerHTML+=`
<button onclick="sideTeam('A')">${teamAName}</button>
<button onclick="sideTeam('B')">${teamBName}</button>
`;
}
}

window.sidePlayer=(p)=>{
const amt=+sideAmount.value;
players.forEach(x=>{
x===p ? ledger[x]+=amt*(players.length-1) : ledger[x]-=amt;
});
closeModals(); updateUI();
};

window.sideTeam=(t)=>{
const amt=+sideAmount.value;
teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=amt);
teams[t].forEach(p=>ledger[p]+=amt);
closeModals(); updateUI();
};

/* MULTI */

window.openMultiplier=(m)=>{
pendingMulti=m;
multiplierModal.classList.remove("hidden");
};

window.applyMultiplier=(mode)=>{
skinsGame.applyMultiplier(pendingMulti,mode);
closeModals();
};

/* MODAL */

window.closeModals=()=>{
document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
};