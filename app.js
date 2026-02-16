/* ================= STATE ================= */

let userProfile = JSON.parse(localStorage.getItem("userProfile"));

let currentGame;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

let historyStack=[];
let screenHistory=[];


/* ================= DOM ================= */

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

const lockedNotice = document.getElementById("lockedNotice");
const baseWagerWrapper = document.getElementById("baseWagerWrapper");

const playStyleBox = document.getElementById("playStyle");
const playerCountBox = document.getElementById("playerCount");
const playStyleLabel = document.getElementById("playStyleLabel");
const playerCountLabel = document.getElementById("playerCountLabel");


/* ================= PROFILE CHECK ================= */

document.addEventListener("DOMContentLoaded", () => {
 if(!userProfile){
 show("profile-setup");
 }
});


/* ================= UI TOGGLES ================= */

birdieToggle.onchange = () => {
 if (birdieToggle.checked) eagleToggle.checked = false;
};

eagleToggle.onchange = () => {
 if (eagleToggle.checked) birdieToggle.checked = false;
};

/* ================= NAV ================= */

function show(id){
const current=document.querySelector("section:not(.hidden)");
if(current) screenHistory.push(current.id);

document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
document.getElementById(id).classList.remove("hidden");
}

window.goBack=()=>{
if(!screenHistory.length) return;
const prev=screenHistory.pop();
document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
document.getElementById(prev).classList.remove("hidden");
};

window.goHome=()=>show("step-home");
window.goGameSelect=()=>show("step-game");
window.showRules=()=>show("rules-screen");

/* ================= GAME SELECT ================= */

window.selectGame=game=>{
currentGame=game;

if(game==="vegas"||game==="nassau"){
lockedNotice.classList.remove("hidden");

playStyleBox.classList.add("hidden");
playerCountBox.classList.add("hidden");
playStyleLabel.classList.add("hidden");
playerCountLabel.classList.add("hidden");

playStyle="teams";
playerCount=4;
}else{
lockedNotice.classList.add("hidden");

playStyleBox.classList.remove("hidden");
playerCountBox.classList.remove("hidden");
playStyleLabel.classList.remove("hidden");
playerCountLabel.classList.remove("hidden");
}

if(game==="nassau"){
document.getElementById("nassauWagers").classList.remove("hidden");
holeLimitSelect.classList.add("hidden");
baseWagerWrapper.classList.add("hidden");
}else{
document.getElementById("nassauWagers").classList.add("hidden");
holeLimitSelect.classList.remove("hidden");
baseWagerWrapper.classList.remove("hidden");
}

document.getElementById("wagerLabel").textContent=
game==="vegas"?"Wager per point":"Wager per player";

show("step-style");
};

/* ================= SETUP ================= */

window.nextTeams=()=>{
if(currentGame==="vegas"||currentGame==="nassau"){
show("step-teams");
return;
}

playStyle=playStyleBox.value;
playerCount=parseInt(playerCountBox.value);

playStyle==="teams"?show("step-teams"):buildPlayers();
};

window.nextPlayers=()=>{
teamAName=document.getElementById("teamAName").value||"Team 1";
teamBName=document.getElementById("teamBName").value||"Team 2";
buildPlayers();
};

function buildPlayers(){
teamAInputs.innerHTML="";
teamBInputs.innerHTML="";

teamALabel.textContent = playStyle==="teams" ? teamAName : "Players";
teamBLabel.textContent = playStyle==="teams" ? teamBName : "";

const userName = userProfile ? userProfile.name : "";

if(playStyle==="teams"){

// TEAM A
teamAInputs.innerHTML += `<input value="${userName}">`; // Player 1 auto-fill
teamAInputs.innerHTML += `<input placeholder="Player 2 name">`; // Player 2 blank

// TEAM B (both blank)
teamBInputs.innerHTML += `<input placeholder="Player 1 name">`;
teamBInputs.innerHTML += `<input placeholder="Player 2 name">`;

}else{

// FFA mode
for(let i=0;i<playerCount;i++){
if(i===0 && userName){
teamAInputs.innerHTML += `<input value="${userName}">`;
}else{
teamAInputs.innerHTML += `<input placeholder="Player ${i+1} name">`;
}
}
}

show("step-players");
}


window.nextSettings=()=>show("step-settings");

/* ================= HISTORY ================= */

function saveState(){
historyStack.push({
hole,
ledger:JSON.parse(JSON.stringify(ledger)),
skins:currentGame==="skins"?skinsGame.getState():null,
nassau:currentGame==="nassau"?nassauGame.getState():null
});
}

window.undoHole=()=>{
if(!historyStack.length) return;

const prev=historyStack.pop();
hole=prev.hole;
ledger=prev.ledger;

if(prev.skins) skinsGame.setState(prev.skins);
if(prev.nassau) nassauGame.setState(prev.nassau);

updateUI();
};

/* ================= START ROUND ================= */

window.startRound=()=>{
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

baseWager=+document.getElementById("baseWager").value;
holeLimit=currentGame==="nassau"?18:+holeLimitSelect.value;

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
show("game-screen");
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
}else if(eagleToggle.checked){
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

/* ================= SIDE BET ================= */

sideBetBtn.onclick=()=>{
sideWinners.innerHTML="";
sideBetModal.classList.remove("hidden");
};

sideMode.onchange=buildSideButtons;
sideAmount.oninput=buildSideButtons;

function buildSideButtons(){

const amount=+sideAmount.value;
if(!amount||amount<=0){
sideWinners.innerHTML="<p>Enter wager first</p>";
return;
}

sideWinners.innerHTML="";
sideBets.setAmount(amount);
sideBets.setMode(sideMode.value);

if(sideMode.value==="player"){
players.forEach(p=>{
const btn=document.createElement("button");
btn.textContent=p;
btn.onclick=()=>{
saveState();
sideBets.applyPlayer(p,players,ledger);
sideAmount.value="";
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
saveState();
sideBets.applyTeam(t,teams,ledger);
sideAmount.value="";
updateUI();
sideBetModal.classList.add("hidden");
};
sideWinners.appendChild(btn);
});
}
}

/* ================= FLOW ================= */

function nextHole(){
if(hole>=holeLimit){
updateUI();
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

/* ================= END ROUND ================= */

window.endRoundNow=()=>{
leaderboardModalList.innerHTML=leaderboard.innerHTML;
leaderboardModal.classList.remove("hidden");
};

leaderboardFinishBtn.onclick=()=>{
leaderboardModal.classList.add("hidden");
show("step-home");
};

window.saveProfile = ()=>{
    const name = document.getElementById("profileName").value.trim();
    const handicap = parseFloat(document.getElementById("profileHandicap").value) || 0;

    if(!name){
        alert("Please enter your name");
        return;
    }
    userProfile = {
        name,
        startingHandicap: handicap,
        currentHandicap: handicap,
        rounds: [],
        bettingStats: {
            totalWon: 0,
            totalLost: 0,
            totalPlayed: 0,
        }
    };
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    show("step-home");
};