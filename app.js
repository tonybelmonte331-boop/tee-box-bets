let currentGame=null;
let players=["P1","P2","P3","P4"];
let ledger={};
let hole=1;
let wager=10;

players.forEach(p=>ledger[p]=0);

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

function startGame(type){

hideAll();
document.getElementById("game-screen").classList.remove("hidden");

players.forEach(p=>ledger[p]=0);
hole=1;

if(type==="skins"){
currentGame=window.skinsGame;
document.getElementById("skinsMultipliers").classList.remove("hidden");
document.getElementById("vegasRules").classList.add("hidden");
}

if(type==="vegas"){
currentGame=window.vegasGame;
document.getElementById("skinsMultipliers").classList.add("hidden");
document.getElementById("vegasRules").classList.remove("hidden");
}

document.getElementById("gameTitle").textContent=type.toUpperCase();
buildUI();
updateUI();
}

function buildUI(){
const wrap=document.getElementById("gameInputs");
wrap.innerHTML="";

if(currentGame.type==="skins"){
players.forEach(p=>{
wrap.innerHTML+=`<button onclick="play('${p}')">${p} Wins</button>`;
});
wrap.innerHTML+=`<button onclick="play('tie')">Tie</button>`;
}

if(currentGame.type==="vegas"){
wrap.innerHTML=`
<h4>Team A</h4>
<input id="a1" type="number">
<input id="a2" type="number">

<h4>Team B</h4>
<input id="b1" type="number">
<input id="b2" type="number">
`;
}
}

function play(result){
currentGame.play(result,players,ledger,wager);
hole++;
updateUI();
}

document.getElementById("actionBtn").onclick=()=>{
if(currentGame.type==="vegas"){

const rules={
flip:flipBirdie.checked,
double:doubleEagle.checked,
carry:carryTies.checked
};

const scores={
a1:+a1.value,
a2:+a2.value,
b1:+b1.value,
b2:+b2.value
};

currentGame.play(scores,players,ledger,wager,rules);
hole++;
updateUI();
}
};

function updateUI(){
holeDisplay.textContent=`Hole ${hole}`;
potDisplay.textContent=`$${wager}`;

ledgerDiv=document.getElementById("ledger");
ledgerDiv.innerHTML="";
players.forEach(p=>{
ledgerDiv.innerHTML+=`<div>${p}: $${ledger[p]}</div>`;
});
}

/* ---------- MODALS ---------- */

function showInfo(game){
const text={
skins:"Skins: Each hole has a wager. Ties carry. Birdie doubles and Eagle triples. Winner takes the pot.",
vegas:"Vegas: Team scores combine into a two-digit number. Difference swings the wager. Optional flips, doubles, and carries."
};
infoText.textContent=text[game];
infoModal.classList.remove("hidden");
}

function closeModal(){
document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

let pendingMulti=1;

function openMultiplier(m){
pendingMulti=m;
multiplierModal.classList.remove("hidden");
}

function applyMultiplier(mode){
currentGame.applyMultiplier(pendingMulti,mode);
closeModal();
}