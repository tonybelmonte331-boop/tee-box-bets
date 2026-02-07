let currentGame;
let playStyle,playerCount;
let teamAName="",teamBName="";
let players=[],teams={A:[],B:[]},ledger={};
let hole=1,holeLimit=9,baseWager=0;
let pendingMulti=1;

/* ---------- NAV ---------- */

function hideAll(){
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

function goHome(){ hideAll(); step-home.classList.remove("hidden"); }
function goGameSelect(){ hideAll(); step-game.classList.remove("hidden"); }
function showRules(){ hideAll(); rules-screen.classList.remove("hidden"); }

/* ---------- SETUP ---------- */

function selectGame(g){
currentGame=g==="skins"?skinsGame:vegasGame;
hideAll(); step-style.classList.remove("hidden");
}

function nextTeams(){
playStyle=playStyle.value;
playerCount=parseInt(playerCount.value);
if(playStyle==="teams"){ hideAll(); step-teams.classList.remove("hidden"); }
else{ teamAName="Players"; nextPlayers(); }
}

function nextPlayers(){
teamAName=teamAName.value||"Players";
teamBName=teamBName.value||"Team 2";

hideAll(); step-players.classList.remove("hidden");

teamALabel.textContent=teamAName;
teamBLabel.textContent=playStyle==="teams"?teamBName:"";

teamAInputs.innerHTML=""; teamBInputs.innerHTML="";

if(playStyle==="teams"){
let half=playerCount/2;
for(let i=0;i<half;i++){
teamAInputs.innerHTML+=`<input>`;
teamBInputs.innerHTML+=`<input>`;
}
}else{
for(let i=0;i<playerCount;i++) teamAInputs.innerHTML+=`<input>`;
}
}

function nextSettings(){ hideAll(); step-settings.classList.remove("hidden"); }

/* ---------- START ---------- */

function startRound(){
players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

if(playStyle==="teams"){
[...teamAInputs.children].forEach(i=>{players.push(i.value);teams.A.push(i.value);ledger[i.value]=0;});
[...teamBInputs.children].forEach(i=>{players.push(i.value);teams.B.push(i.value);ledger[i.value]=0;});
}else{
[...teamAInputs.children].forEach(i=>{players.push(i.value);ledger[i.value]=0;});
}

baseWager=parseFloat(baseWager.value);
holeLimit=parseInt(holeLimit.value);

currentGame.reset();

hideAll(); game-screen.classList.remove("hidden");

buildWinnerButtons();
buildVegasInputs();
updateUI();
}

/* ---------- GAME ---------- */

function buildWinnerButtons(){
winnerButtons.innerHTML="";
if(playStyle==="ffa") players.forEach(p=>winnerButtons.innerHTML+=`<button onclick="winPlayer('${p}')">${p}</button>`);
else winnerButtons.innerHTML+=`<button onclick="winTeam('A')">${teamAName}</button><button onclick="winTeam('B')">${teamBName}</button>`;
}

function buildVegasInputs(){
vegasInputs.innerHTML="";
if(currentGame!==vegasGame) return;

teams.A.forEach(()=> vegasInputs.innerHTML+=`<input type="number">`);
teams.B.forEach(()=> vegasInputs.innerHTML+=`<input type="number">`);
}

function winPlayer(p){
currentGame.winPlayer(p,players,ledger,baseWager);
nextHole();
}

function winTeam(t){
currentGame.winTeam(t,teams,ledger,baseWager);
nextHole();
}

function tieHole(){ if(currentGame.tie) currentGame.tie(); nextHole(); }

function nextHole(){
if(hole>=holeLimit) return goHome();
hole++; updateUI();
}

function updateUI(){
holeDisplay.textContent=`Hole ${hole}`;
potDisplay.textContent=currentGame.currentPot(baseWager)||"";

ledger.innerHTML="";
players.forEach(p=>ledger.innerHTML+=`${p}: $${ledger[p]}<br>`);
}

/* ---------- SIDE BET ---------- */

function buildSideWinners(){
sideWinners.innerHTML="";
if(sideMode.value==="team" && playStyle==="teams"){
sideWinners.innerHTML+=`<button onclick="sideTeam('A')">${teamAName}</button><button onclick="sideTeam('B')">${teamBName}</button>`;
}else{
players.forEach(p=>sideWinners.innerHTML+=`<button onclick="sidePlayer('${p}')">${p}</button>`);
}
}

function openSideBet(){ buildSideWinners(); sideBetModal.classList.remove("hidden"); }

function sidePlayer(p){
let a=parseFloat(sideAmount.value);
players.forEach(x=>x===p?ledger[x]+=a*(players.length-1):ledger[x]-=a);
closeModals(); updateUI();
}

function sideTeam(t){
let a=parseFloat(sideAmount.value);
teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=a);
teams[t].forEach(p=>ledger[p]+=a);
closeModals(); updateUI();
}

/* ---------- MULTI ---------- */

function openMultiplier(m){ pendingMulti=m; multiplierModal.classList.remove("hidden"); }
function applyMultiplier(mode){ currentGame.applyMultiplier(pendingMulti,mode); closeModals(); }

/* ---------- MODAL ---------- */

function closeModals(){
document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}