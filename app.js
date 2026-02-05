let gameType=null;
let playStyle="ffa";
let players=[];
let teams={A:[],B:[]};
let ledger={};
let hole=1;
let baseWager=0;
let carryCount=1;
let holeLimit=9;
let history=[];

const SAVE_KEY="teeboxbets_game";

/* ---------- SAVE SYSTEM ---------- */

function saveGame(){
localStorage.setItem(SAVE_KEY,JSON.stringify({
gameType,playStyle,players,teams,ledger,hole,baseWager,carryCount,holeLimit,history
}));
}

function resumeGame(){
const data=JSON.parse(localStorage.getItem(SAVE_KEY));
if(!data) return alert("No saved game found");

({gameType,playStyle,players,teams,ledger,hole,baseWager,carryCount,holeLimit,history}=data);

document.getElementById("select-screen").classList.add("hidden");
document.getElementById("game-screen").classList.remove("hidden");

buildWinnerButtons();
updateUI();
}

/* ---------- GAME SELECT ---------- */

function selectGame(type){
gameType=type;
document.getElementById("select-screen").classList.add("hidden");
document.getElementById("setup-screen").classList.remove("hidden");
}

/* ---------- SETUP ---------- */

const playersDiv=document.getElementById("players");

document.getElementById("addPlayerBtn").onclick=()=>{
if(playersDiv.children.length>=8) return;
playersDiv.innerHTML+=`<input placeholder="Player Name">`;
};

function toggleTeams(){
playStyle=document.getElementById("playStyle").value;
document.getElementById("teamAssign").classList.toggle("hidden",playStyle!=="teams");
}

document.getElementById("startGameBtn").onclick=()=>{
players=[];
ledger={};
teams={A:[],B:[]};
history=[];
hole=1;
carryCount=1;

document.querySelectorAll("#players input").forEach(i=>{
if(i.value.trim()){
players.push(i.value.trim());
ledger[i.value.trim()]=0;
}
});

baseWager=parseFloat(document.getElementById("baseWager").value);
holeLimit=parseInt(document.getElementById("holeLimit").value);

document.getElementById("setup-screen").classList.add("hidden");
document.getElementById("game-screen").classList.remove("hidden");

buildWinnerButtons();
updateUI();
saveGame();
};

/* ---------- BUTTONS ---------- */

function buildWinnerButtons(){
const wrap=document.getElementById("winnerButtons");
wrap.innerHTML="";

if(playStyle==="ffa"){
players.forEach(p=>{
wrap.innerHTML+=`<button onclick="holeWinner('${p}')">${p}</button>`;
});
}else{
wrap.innerHTML+=`
<button onclick="teamWinner('A')">Team A Wins</button>
<button onclick="teamWinner('B')">Team B Wins</button>`;
}
}

/* ---------- GAME LOGIC ---------- */

function logHistory(text){
history.push(`Hole ${hole}: ${text}`);
saveGame();
}

function holeWinner(player){
const total=baseWager*(players.length-1)*carryCount;

players.forEach(p=>{
if(p===player) ledger[p]+=total;
else ledger[p]-=baseWager*carryCount;
});

logHistory(`${player} won ($${baseWager*carryCount}/player)`);
carryCount=1;
advanceHole();
}

function teamWinner(team){
const winners=teams[team];
const losers=teams[team==="A"?"B":"A"];

losers.forEach(p=>ledger[p]-=baseWager*carryCount);
winners.forEach(p=>ledger[p]+=baseWager*carryCount*losers.length/winners.length);

logHistory(`Team ${team} won ($${baseWager*carryCount}/player)`);
carryCount=1;
advanceHole();
}

function tieHole(){
carryCount++;
logHistory("Tie – carry over");
advanceHole(false);
}

function advanceHole(reset=true){
if(hole>=holeLimit){
showLeaderboard("Finish Round");
return;
}
hole++;
if(reset) carryCount=1;
updateUI();
saveGame();
}

/* ---------- UI ---------- */

function updateUI(){
document.getElementById("holeDisplay").textContent=`Hole ${hole} of ${holeLimit}`;
document.getElementById("potDisplay").textContent=`$${(baseWager*carryCount).toFixed(2)} / player`;

const l=document.getElementById("ledger");
l.innerHTML="";
players.forEach(p=>{
l.innerHTML+=`<div class="ledger-row"><span>${p}</span><span>$${ledger[p].toFixed(2)}</span></div>`;
});
}

/* ---------- HISTORY ---------- */

function openHistory(){
const list=document.getElementById("historyList");
list.innerHTML=history.map(h=>`<div>${h}</div>`).join("");
document.getElementById("historyModal").classList.remove("hidden");
}

function closeHistory(){
document.getElementById("historyModal").classList.add("hidden");
}

/* ---------- SIDE BET ---------- */

let sideWinner=null;

function openSideBet(){
document.getElementById("sideBetModal").classList.remove("hidden");
const wrap=document.getElementById("sideWinners");
wrap.innerHTML="";

players.forEach(p=>{
wrap.innerHTML+=`<button onclick="sideWinner='${p}'">${p}</button>`;
});
}

function confirmSideBet(){
const amt=parseFloat(document.getElementById("sideAmount").value);
if(!amt||!sideWinner) return alert("Pick winner & amount");

players.forEach(p=>{
if(p===sideWinner) ledger[p]+=amt*(players.length-1);
else ledger[p]-=amt;
});

logHistory(`${sideWinner} won side bet ($${amt}/player)`);
closeSideBet();
updateUI();
}

function closeSideBet(){
document.getElementById("sideBetModal").classList.add("hidden");
document.getElementById("sideAmount").value="";
sideWinner=null;
}

/* ---------- LEADERBOARD ---------- */

function showLeaderboard(text){
const modal=document.getElementById("leaderboardModal");
const board=document.getElementById("leaderboard");

board.innerHTML=players
.sort((a,b)=>ledger[b]-ledger[a])
.map(p=>`<div class="leader-row"><span>${p}</span><span>$${ledger[p].toFixed(2)}</span></div>`)
.join("");

const btn=document.getElementById("continueBtn");
btn.textContent=text;

btn.onclick=()=>{
modal.classList.add("hidden");
localStorage.removeItem(SAVE_KEY);
location.reload();
};

modal.classList.remove("hidden");
}
