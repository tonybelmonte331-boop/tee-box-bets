import * as skins from "./games/skins.js";
import * as vegas from "./games/vegas.js";

let currentGame=null;

let players=["Player 1","Player 2","Player 3","Player 4"];
let ledger={};

let hole=1;
let wager=10;

/* ---------- CORE ---------- */

players.forEach(p=>ledger[p]=0);

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

window.startGame = function(type){

hideAll();
document.getElementById("game-screen").classList.remove("hidden");

hole=1;
players.forEach(p=>ledger[p]=0);

if(type==="skins"){
currentGame=skins;
document.getElementById("vegasRules").classList.add("hidden");
}

if(type==="vegas"){
currentGame=vegas;
document.getElementById("vegasRules").classList.remove("hidden");
}

document.getElementById("gameTitle").textContent=type.toUpperCase();

buildUI();
updateUI();
};

/* ---------- UI ---------- */

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

window.play=function(result){
currentGame.play(result, players, ledger, wager);
hole++;
updateUI();
};

document.getElementById("actionBtn").onclick=()=>{
if(currentGame.type==="vegas"){

const rules={
flip:document.getElementById("flipBirdie").checked,
double:document.getElementById("doubleEagle").checked,
carry:document.getElementById("carryTies").checked
};

const scores={
a1:+document.getElementById("a1").value,
a2:+document.getElementById("a2").value,
b1:+document.getElementById("b1").value,
b2:+document.getElementById("b2").value
};

currentGame.play(scores,players,ledger,wager,rules);
hole++;
updateUI();
}
};

function updateUI(){
document.getElementById("holeDisplay").textContent=`Hole ${hole}`;
document.getElementById("potDisplay").textContent=`$${wager} per point`;

const l=document.getElementById("ledger");
l.innerHTML="";
players.forEach(p=>{
l.innerHTML+=`<div>${p}: $${ledger[p]}</div>`;
});
}