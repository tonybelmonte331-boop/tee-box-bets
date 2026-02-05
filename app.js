let gameType;
let playStyle;
let playerCount;

let teamAName="";
let teamBName="";

let players=[];
let teams={A:[],B:[]};
let ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;
let carryCount=1;

let history=[];
let multiplier=1;
let pendingMulti=1;

/* ---------- NAV ---------- */

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

function selectGame(t){
gameType=t;
hideAll();
document.getElementById("step-style").classList.remove("hidden");
}

function goBack(){ location.reload(); }

/* ---------- SETUP ---------- */

function nextTeams(){
playStyle=document.getElementById("playStyle").value;
playerCount=parseInt(document.getElementById("playerCount").value);

if(playStyle==="teams"){
hideAll();
document.getElementById("step-teams").classList.remove("hidden");
}else{
buildFFAInputs();
}
}

function nextPlayers(){
teamAName=document.getElementById("teamAName").value||"Team A";
teamBName=document.getElementById("teamBName").value||"Team B";

hideAll();
document.getElementById("step-players").classList.remove("hidden");

document.getElementById("teamALabel").textContent=teamAName;
document.getElementById("teamBLabel").textContent=teamBName;

buildTeamInputs();
}

function buildTeamInputs(){
const half=playerCount/2;
const a=document.getElementById("teamAInputs");
const b=document.getElementById("teamBInputs");

a.innerHTML="";
b.innerHTML="";

for(let i=0;i<half;i++){
a.innerHTML+=`<input placeholder="${teamAName} Player ${i+1}">`;
b.innerHTML+=`<input placeholder="${teamBName} Player ${i+1}">`;
}
}

function nextSettings(){
hideAll();
document.getElementById("step-settings").classList.remove("hidden");
}

function buildFFAInputs(){
hideAll();
document.getElementById("step-players").classList.remove("hidden");

const wrap=document.getElementById("teamAInputs");
wrap.innerHTML="";
document.getElementById("teamBInputs").innerHTML="";
document.getElementById("teamALabel").textContent="Players";

for(let i=0;i<playerCount;i++){
wrap.innerHTML+=`<input placeholder="Player ${i+1}">`;
}
}

/* ---------- START ---------- */

function startGame(){
players=[];
ledger={};
teams={A:[],B:[]};

if(playStyle==="teams"){
document.querySelectorAll("#teamAInputs input").forEach(i=>{
players.push(i.value||"Player");
teams.A.push(i.value||"Player");
ledger[i.value||"Player"]=0;
});
document.querySelectorAll("#teamBInputs input").forEach(i=>{
players.push(i.value||"Player");
teams.B.push(i.value||"Player");
ledger[i.value||"Player"]=0;
});
}else{
document.querySelectorAll("#teamAInputs input").forEach(i=>{
players.push(i.value||"Player");
ledger[i.value||"Player"]=0;
});
}

baseWager=parseFloat(document.getElementById("baseWager").value);
holeLimit=parseInt(document.getElementById("holeLimit").value);

hideAll();
document.getElementById("game-screen").classList.remove("hidden");

buildWinnerButtons();
updateUI();
}

/* ---------- BUTTONS ---------- */

function buildWinnerButtons(){
const wrap=document.getElementById("winnerButtons");
wrap.innerHTML="";

if(playStyle==="ffa"){
players.forEach(p=>{
wrap.innerHTML+=`<button onclick="playerWin('${p}')">${p}</button>`;
});
}else{
wrap.innerHTML+=`
<button onclick="teamWin('A')">${teamAName} Wins</button>
<button onclick="teamWin('B')">${teamBName} Wins</button>`;
}
}

/* ---------- GAME LOGIC ---------- */

function log(t){ history.push(`Hole ${hole}: ${t}`); }

function resetMultiplier(){
multiplier=1;
pendingMulti=1;
}

function playerWin(p){
const amt=baseWager*(players.length-1)*carryCount*multiplier;

players.forEach(x=>{
if(x===p) ledger[x]+=amt;
else ledger[x]-=baseWager*carryCount*multiplier;
});

log(p+" won");
resetMultiplier();
carryCount=1;
nextHole();
}

function teamWin(t){
const winners=teams[t];
const losers=teams[t==="A"?"B":"A"];

losers.forEach(p=>ledger[p]-=baseWager*carryCount*multiplier);
winners.forEach(p=>ledger[p]+=baseWager*carryCount*multiplier*losers.length/winners.length);

log((t==="A"?teamAName:teamBName)+" won");
resetMultiplier();
carryCount=1;
nextHole();
}

function tieHole(){
carryCount++;
log("Tie");
resetMultiplier();   // 🔥 FIX — multiplier resets even on tie
nextHole(false);
}

/* ---------- HOLE FLOW ---------- */

function nextHole(reset=true){

if(hole===9 && holeLimit===18){
showLeaderboard("Continue to Back 9");
return;
}

if(hole>=holeLimit){
showLeaderboard("Finish Round");
return;
}

hole++;
if(reset) carryCount=1;
updateUI();
}

/* ---------- UI ---------- */

function updateUI(){
document.getElementById("holeDisplay").textContent=`Hole ${hole} of ${holeLimit}`;
document.getElementById("potDisplay").textContent=
`$${baseWager*carryCount*multiplier}/player`;

const l=document.getElementById("ledger");
l.innerHTML="";
players.forEach(p=>{
l.innerHTML+=`
<div class="ledger-row">
<span>${p}</span>
<span>$${ledger[p]}</span>
</div>`;
});
}

/* ---------- SIDE BET ---------- */

function openSideBet(){
const wrap=document.getElementById("sideWinners");
wrap.innerHTML="";

if(document.getElementById("sideMode").value==="team" && playStyle==="teams"){
wrap.innerHTML+=`
<button onclick="sideTeam('A')">${teamAName}</button>
<button onclick="sideTeam('B')">${teamBName}</button>`;
}else{
players.forEach(p=>{
wrap.innerHTML+=`<button onclick="sidePlayer('${p}')">${p}</button>`;
});
}

document.getElementById("sideBetModal").classList.remove("hidden");
}

function sidePlayer(p){
const amt=parseFloat(document.getElementById("sideAmount").value);
players.forEach(x=>{
if(x===p) ledger[x]+=amt*(players.length-1);
else ledger[x]-=amt;
});
log(p+" side bet");
closeModals();
updateUI();
}

function sideTeam(t){
const amt=parseFloat(document.getElementById("sideAmount").value);
const winners=teams[t];
const losers=teams[t==="A"?"B":"A"];

losers.forEach(p=>ledger[p]-=amt);
winners.forEach(p=>ledger[p]+=amt*losers.length/winners.length);

log("Side bet won by "+(t==="A"?teamAName:teamBName));
closeModals();
updateUI();
}

/* ---------- MULTIPLIER ---------- */

function openMultiplier(m){
pendingMulti=m;
document.getElementById("multiplierModal").classList.remove("hidden");
}

function applyMultiplier(mode){
if(mode==="hole") multiplier=pendingMulti;
else multiplier*=pendingMulti;

closeModals();
updateUI();
}

/* ---------- MODALS ---------- */

function openHistory(){
document.getElementById("historyList").innerHTML=
history.map(h=>`<div>${h}</div>`).join("")||"No holes yet";

document.getElementById("historyModal").classList.remove("hidden");
}

function closeModals(){
document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

/* ---------- LEADERBOARD ---------- */

function showLeaderboard(buttonText){
document.getElementById("leaderboard").innerHTML=[...players]
.sort((a,b)=>ledger[b]-ledger[a])
.map(p=>`<div class="leader-row"><span>${p}</span><span>$${ledger[p]}</span></div>`)
.join("");

const btn=document.querySelector("#leaderboardModal button");
btn.textContent=buttonText;

btn.onclick=()=>{
if(buttonText==="Continue to Back 9"){
document.getElementById("leaderboardModal").classList.add("hidden");
hole++;
updateUI();
}else{
location.reload();
}
};

document.getElementById("leaderboardModal").classList.remove("hidden");
}

function finishRound(){ location.reload(); }
