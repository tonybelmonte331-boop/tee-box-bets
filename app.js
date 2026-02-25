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

let currentRound = null;

/* ================= HAPTIC ================= */
function haptic(){
    if (navigator.vibrate){
        navigator.vibrate(10);
    }
}

/* ================= AUTO DECIMAL ================= */
function autoDecimal(el){
el.addEventListener("input",()=>{
let v = el.value.replace(/\D/g,"");

if(v.length <= 2){
el.value = v;
return;
}

el.value = v.slice(0,2) + "." + v.slice(2,4);
});
}

function numericOnly(el){
el.addEventListener("input",()=>{
el.value = el.value.replace(/\D/g,"");
});
}

/* ================= HANDICAP MATH ================= */

function calculateDifferential(strokes, rating, slope){
return Number(
((strokes - rating) * 113 / slope).toFixed(1)
);
}

function calculateHandicapIndex(rounds){

// only rounds that have differentials
const diffs = rounds
.filter(r => r.differential !== undefined)
.map(r => r.differential)
.slice(-20); // most recent 20

if(diffs.length < 3) return null; // USGA minimum safety

// take lowest 8
const lowest = diffs
.sort((a,b)=>a-b)
.slice(0, Math.min(8, diffs.length));

// average
const avg = lowest.reduce((a,b)=>a+b,0) / lowest.length;

// round to 1 decimal
return Number(avg.toFixed(1));
}

function calculateHandicapFromDiffs(diffs){

const recent = diffs.slice(-20).sort((a,b)=>a-b);
const count = recent.length;

if(count < 3) return null;

let use = 1;
if(count >= 6) use = 2;
if(count >= 9) use = 3;
if(count >= 12) use = 4;
if(count >= 15) use = 5;
if(count >= 17) use = 6;
if(count >= 19) use = 7;
if(count >= 20) use = 8;

const selected = recent.slice(0,use);
const avg = selected.reduce((a,b)=>a+b,0) / use;

return Number((avg * 0.96).toFixed(1));
}

function updateHandicap(){

const diffs = userProfile.rounds
.map(r => r.differential)
.filter(d => d !== undefined);

const newHdcp = calculateHandicapFromDiffs(diffs);

if(newHdcp !== null){
userProfile.currentHandicap = newHdcp;
}else{
    userProfile.currentHandicap = 0;
}
}

/* ================= BETTING STATS ================= */

function updateBettingStats(){

const myName = userProfile.name;
const myNet = ledger[myName] || 0;

if(myNet > 0){
userProfile.bettingStats.totalWon += myNet;
}
if(myNet < 0){
userProfile.bettingStats.totalLost += Math.abs(myNet);
}

userProfile.bettingStats.totalPlayed += 1;

}


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


/* ================= UI TOGGLES ================= */

birdieToggle.onchange = () => {
 if (birdieToggle.checked) eagleToggle.checked = false;
};

eagleToggle.onchange = () => {
 if (eagleToggle.checked) birdieToggle.checked = false;
};

function applyBonus(){
if(birdieToggle.checked){
skinsGame.applyBonus("birdie");
}
if(eagleToggle.checked){
skinsGame.applyBonus("eagle");
}
}

function setPar(value, el){

document.getElementById("holePar").value = value;

document.querySelectorAll(".par-btn").forEach(b=>{
b.classList.remove("active");
});

el.classList.add("active");
}

["firToggle","girToggle"].forEach(id=>{
const btn = document.getElementById(id);

btn.onclick = ()=>{
btn.classList.toggle("active");
};
});

window.toggleManualRound = () => {
document.getElementById("manualRoundBox")
.classList.toggle("hidden");
};

/* ================= NAV ================= */

const headerMap = {
"step-home": "Tee Box Bets",

"step-game": "Select Game",
"rules-screen": "Game Rules",

"step-style": "Play Style",
"step-teams": "Teams",
"step-players": "Players",
"step-settings": "Wager Settings",

"game-screen": "Live Game",

"round-setup": "Round Setup",
"round-play": "Round In Progress",

"profile-screen": "Your Profile",
"profile-setup": "Edit Profile"
};

function updateHeader(id){
const title = document.getElementById("appTitle");
title.classList.add("title-swap");

setTimeout(()=>{

/* Live betting game */
if(id === "game-screen"){
const gameName =
currentGame === "skins" ? "Skins" :
currentGame === "vegas" ? "Vegas" :
currentGame === "nassau" ? "Nassau" :
"Game";

title.textContent = `${gameName} – Hole ${hole}`;
title.classList.remove("title-swap");
return;
}

/* Round tracking */
if(id === "round-play" && currentRound){
title.textContent =
`Round – Hole ${currentRound.currentHole} of ${currentRound.holes}`;
title.classList.remove("title-swap");
return;
}

/* Default */
title.textContent = headerMap[id] || "Tee Box Bets";
title.classList.remove("title-swap");

},120);
}

let screenHistory = [];

function show(id){
haptic();

const current = document.querySelector("section:not(.hidden)");

if (current && current.id !== id) {
screenHistory.push(current.id);
}

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

document.getElementById(id).classList.remove("hidden");

// ✅ Side bet ONLY during live game
if(id === "game-screen"){
sideBetBtn.classList.remove("hidden");
}else{
sideBetBtn.classList.add("hidden");
}

updateHeader(id);
syncBackButton();
}


function syncBackButton(){
const btn = document.getElementById("navBack");
const current = document.querySelector("section:not(.hidden)");

// Screens where back should be disabled
const lockScreens = ["round-play", "game-screen"];

if (!current || lockScreens.includes(current.id)) {
btn.style.display = "none";
return;
}

btn.style.display = screenHistory.length ? "flex" : "none";
}

window.goBack = () => {
 haptic();

 if (!screenHistory.length) return;

 const prev = screenHistory.pop();

 document.querySelectorAll("section").forEach(s =>
 s.classList.add("hidden")
 );

 document.getElementById(prev).classList.remove("hidden");

 syncBackButton();
 updateHeader(prev);
};

function goHomeClean(){
screenHistory = [];

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

document.getElementById("step-home").classList.remove("hidden");

updateHeader("step-home"); // ✅ reset title
syncBackButton();
}

window.toggleManualRound = () => {
const box = document.getElementById("manualRoundBox");
const btn = document.getElementById("manualToggleBtn");

const open = box.classList.contains("hidden");

box.classList.toggle("hidden");

btn.textContent = open
? "Cancel Previous Round"
: "Add Previous Round";
};

window.goHome = goHomeClean;
window.goGameSelect = () => show("step-game");
window.showRules = () => show("rules-screen");

/* ================= PROFILE CHECK ================= */


document.addEventListener("DOMContentLoaded", () => {

const ratingInput = document.getElementById("courseRating");
const slopeInput = document.getElementById("courseSlope");
const manualRating = document.getElementById("manualRating");
const manualSlope = document.getElementById("manualSlope");

if(ratingInput) autoDecimal(ratingInput);
if(manualRating) autoDecimal(manualRating);

if(slopeInput) numericOnly(slopeInput);
if(manualSlope) numericOnly(manualSlope);

if(!userProfile){
show("profile-setup");
}
sideBetBtn.classList.add("hidden");

document.getElementById("manualSaveBtn").onclick = addManualRound;
});


/* ================= GAME SELECT ================= */

window.selectGame=game=>{
currentGame=game;

if(game==="vegas" || game==="nassau"){
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

if(game === "skins"){
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

playStyle = playStyleBox.value;

if(playStyle === "teams"){
playerCount = 4;
}else{
playerCount = parseInt(playerCountBox.value);
}


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

if(playStyle === "ffa"){
teams.A = [...players];
teams.B = [];
}

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

if(playStyle === "ffa"){

players.forEach(p=>{
const btn = document.createElement("button");
btn.textContent = p;
btn.onclick = ()=>{
saveState();
applyBonus();
skinsGame.winPlayer(p, players, ledger);
nextHole();
};
winnerButtons.appendChild(btn);
});

}

else{

["A","B"].forEach(t=>{
const btn=document.createElement("button");
btn.textContent=t==="A"?teamAName:teamBName;
btn.onclick=()=>handleTeamWin(t);
winnerButtons.appendChild(btn);
});

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

/* ===== ENHANCED LEADERBOARD ===== */

const sorted = [...players].sort((a,b)=>ledger[b]-ledger[a]);

leaderboard.innerHTML = "";

sorted.forEach((p,i)=>{

const value = ledger[p];
const row = document.createElement("div");

row.style.display = "flex";
row.style.justifyContent = "space-between";
row.style.padding = "8px 12px";
row.style.marginBottom = "6px";
row.style.borderRadius = "10px";
row.style.fontWeight = "600";

if(i === 0){
row.style.background = "#0f5132"; // leader highlight
}

if(value > 0){
row.style.color = "#2ecc71";
}else if(value < 0){
row.style.color = "#e74c3c";
}else{
row.style.color = "#ffffff";
}

row.innerHTML = `
<span>${p}</span>
<span>${value>=0?"+":""}$${value.toFixed(2)}</span>
`;

leaderboard.appendChild(row);

});

updateHeader("game-screen");
}

/* ================= END ROUND ================= */

window.endRoundNow = () =>{
if(!confirm("End round? Progress will be lost.")) return;

currentRound = null;
historyStack = [];
goHomeClean();
};

leaderboardFinishBtn.onclick = () => {

updateBettingStats();
trackOpponents();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

leaderboardModal.classList.add("hidden");
goHomeClean();

};

/* ================= ROUND TRACKING ================= */

let roundHistory = [];

window.startRoundTracking = () => {

currentRound = {
course: document.getElementById("courseName").value || "Unknown Course",
rating: +document.getElementById("courseRating").value || 72,
slope: +document.getElementById("courseSlope").value || 113,
holes: +document.getElementById("roundHoles").value,
currentHole: 1,
scores: [],
pars: [],
putts: [],
penalties: [],
gir: [],
fir: [],
totalStrokes: 0,
totalPar: 0
};

roundHistory = [];
updateRoundUI();
show("round-play");
};

function updateRoundUI(){

if(!currentRound) return;

document.getElementById("roundHoleDisplay").textContent =
`Hole ${currentRound.currentHole} of ${currentRound.holes}`;

document.getElementById("roundCourseInfo").textContent =
`${currentRound.course} | Rating ${currentRound.rating} | Slope ${currentRound.slope}`;

const toPar = currentRound.totalStrokes - currentRound.totalPar;

const courseHandicap = Math.round(
(userProfile.currentHandicap * currentRound.slope) / 113
);

const net = currentRound.totalStrokes - courseHandicap;

document.getElementById("roundLiveStats").textContent =
`Total ${currentRound.totalStrokes} | To Par ${toPar>=0?"+":""}${toPar} | Net ${net}`;

updateHeader("round-play");
}

function setScore(val){

const input = document.getElementById("holeScore");

if(val === 8){
input.classList.remove("hidden");
input.focus();
input.value = "";
}else{
input.value = val;
submitHoleScore();
}
}

window.submitHoleScore = () => {

if(!currentRound) return;

const score = +document.getElementById("holeScore").value;
const par = +document.getElementById("holePar").value;
if(!score) return;

roundHistory.push(JSON.parse(JSON.stringify(currentRound)));

currentRound.scores.push(score);
currentRound.pars.push(par);
currentRound.putts.push(+document.getElementById("holePutts").value || 0);
currentRound.penalties.push(+document.getElementById("holePenalties").value || 0);

currentRound.gir.push(
document.getElementById("girToggle").classList.contains("active")
);

currentRound.fir.push(
document.getElementById("firToggle").classList.contains("active")
);
currentRound.totalStrokes += score;
currentRound.totalPar += par;

document.getElementById("holeScore").value = "";
document.getElementById("holePutts").value = "";
document.getElementById("holePenalties").value = "";

document.getElementById("firToggle").classList.remove("active");
document.getElementById("girToggle").classList.remove("active");

if(currentRound.currentHole >= currentRound.holes){
finishTrackedRound();
return;
}

currentRound.currentHole++;
updateRoundUI();
};

window.undoRoundHole = () => {
if(!roundHistory.length) return;
currentRound = roundHistory.pop();
updateRoundUI();
};

function finishTrackedRound(){

if(!currentRound) return;

const toPar = currentRound.totalStrokes - currentRound.totalPar;
let adjustedStrokes = currentRound.totalStrokes;

if(currentRound.holes === 9){
adjustedStrokes = currentRound.totalStrokes * 2;
}

const differential = calculateDifferential(
adjustedStrokes,
currentRound.rating,
currentRound.slope
);

userProfile.rounds.push({
date: new Date().toISOString(),
course: currentRound.course,
strokes: currentRound.totalStrokes,
rating: currentRound.rating,
slope: currentRound.slope,
toPar,
holes: currentRound.holes,
differential,

scores: currentRound.scores,
pars: currentRound.pars,
putts: currentRound.putts,
penalties: currentRound.penalties,
gir: currentRound.gir,
fir: currentRound.fir
});

updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

currentRound = null;
alert("Round Saved!");
goHomeClean();
}

window.cancelTrackedRound = () => {
if(!confirm("End round without saving?")) return;

currentRound = null;
roundHistory = [];
goHomeClean();
};

window.openScorecard = () => {

if(!currentRound) return;

let html = `
<table style="width:100%;border-collapse:collapse;text-align:center">
<tr style="border-bottom:1px solid rgba(255,255,255,.15);height:48px;line-height:44px;">
<th>Hole</th>
<th>Par</th>
<th>Score</th>
<th>+/-</th>
</tr>
`;

let frontScore = 0;
let backScore = 0;

let frontPar = 0;
let backPar = 0;

let frontDiff = 0;
let backDiff = 0;

for(let i=0;i<currentRound.scores.length;i++){

const score = currentRound.scores[i];
const par = currentRound.pars[i];
const diff = score - par;

if(i < 9){
frontScore += score;
frontPar += par;
frontDiff += diff;
}else{
backScore += score;
backPar += par;
backDiff += diff;
}

let scoreStyle = "color:#fff;font-weight:700;";
let scoreWrapStart = "";
let scoreWrapEnd = "";

/* 🟢 EAGLE OR BETTER — GOLD DOUBLE CIRCLE */
if(diff <= -2){
scoreStyle = "color:#ffd700;font-weight:800;";
scoreWrapStart = `<span style="border:2px solid #ffd700;border-radius:50%;padding:4px 10px;box-shadow:0 0 0 2px #ffd700 inset;">`;
scoreWrapEnd = `</span>`;
}

/* 🔴 BIRDIE — RED CIRCLE */
else if(diff === -1){
scoreStyle = "color:#ff4d4d;font-weight:800;";
scoreWrapStart = `<span style="border:2px solid #ff4d4d;border-radius:50%;padding:4px 10px;">`;
scoreWrapEnd = `</span>`;
}

/* ⬛ BOGEY OR WORSE — BOX */
else if(diff >= 1){
scoreWrapStart = `<span style="border:2px solid #ffffff;padding:4px 10px;">`;
scoreWrapEnd = `</span>`;
}

html += `
<tr style="border-bottom:1px solid rgba(255,255,255,.15)">
<td>${i+1}</td>
<td>${par}</td>
<td style="${scoreStyle};padding:10px 0;">
${scoreWrapStart}${score}${scoreWrapEnd}
</td>
<td>${diff>=0?"+":""}${diff}</td>
</tr>
`;

if(i === 8){
html += `
<tr style="font-weight:700;border-top:2px solid rgba(255,255,255,.4)">
<td>Front 9</td>
<td>${frontPar}</td>
<td>${frontScore}</td>
<td>${frontDiff>=0?"+":""}${frontDiff}</td>
</tr>
`;
}

}

if(currentRound.scores.length > 9){
html += `
<tr style="font-weight:700;border-top:2px solid rgba(255,255,255,.4)">
<td>Back 9</td>
<td>${backPar}</td>
<td>${backScore}</td>
<td>${backDiff>=0?"+":""}${backDiff}</td>
</tr>
`;
}

html += "</table>";

document.getElementById("scorecardTable").innerHTML = html;
document.getElementById("scorecardModal").classList.remove("hidden");
};

window.closeScorecard = () => {
document.getElementById("scorecardModal").classList.add("hidden");
};

window.addManualRound = () => {

const date = document.getElementById("manualDate").value;
const course = document.getElementById("manualCourse").value || "Manual Entry";
const rating = +document.getElementById("manualRating").value || 72;
const slope = +document.getElementById("manualSlope").value || 113;
const strokes = +document.getElementById("manualStrokes").value;
const holes = +document.getElementById("manualHoles").value;

if(!date || !strokes || !holes){
alert("Fill all required fields");
return;
}

// Estimate par for manual entry (simple average)
const par = holes === 9 ? 36 : 72;
const toPar = strokes - par;
let adjustedStrokes = strokes;

if(holes === 9){
adjustedStrokes = strokes * 2;
}

const differential = calculateDifferential(adjustedStrokes, rating, slope);

userProfile.rounds.push({
date: new Date(date).toISOString(),
course,
rating,
slope,
strokes,
toPar,
holes,
differential
});

updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));
renderProfile();

// clear fields

// Clear ALL fields
[
"manualDate",
"manualCourse",
"manualRating",
"manualSlope",
"manualStrokes"
].forEach(id=>{
const el = document.getElementById(id);
if(el) el.value = "";
});

// Reset holes dropdown
document.getElementById("manualHoles").value = "9";

// Close manual entry box
const box = document.getElementById("manualRoundBox");
const btn = document.getElementById("manualToggleBtn");

box.classList.add("hidden");
btn.textContent = "Add Previous Round";

};


/* ================= PROFILE ================= */

function showProfileTab(tabId){

document.querySelectorAll(".profile-tab").forEach(btn=>{
btn.classList.remove("active");
});

document.querySelectorAll(".profile-tab-content").forEach(tab=>{
tab.classList.add("hidden");
});

document.getElementById(tabId).classList.remove("hidden");

const buttons = document.querySelectorAll(".profile-tab");
buttons.forEach(b=>{
if(b.textContent.toLowerCase().includes(tabId.replace("Tab","").toLowerCase())){
b.classList.add("active");
}
});

}

window.openProfile = () =>{
renderProfile();
show("profile-screen");
};

function renderProfile(){

if(!userProfile) return;

document.getElementById("profileNameDisplay").textContent = userProfile.name;

const handicap = userProfile.currentHandicap ?? 0;
document.getElementById("profileHandicapDisplay").textContent = handicap.toFixed(1);
document.getElementById("profileRounds").textContent = userProfile.rounds.length;

const avg = userProfile.rounds.length
? Math.round(userProfile.rounds.reduce((a,b)=>a+b.strokes,0) / userProfile.rounds.length)
: "--";

document.getElementById("profileAvg").textContent = avg;

const net =
userProfile.bettingStats.totalWon - userProfile.bettingStats.totalLost;

document.getElementById("betNet").textContent =
`${net>=0?"+":""}$${net.toFixed(2)}`;

document.getElementById("betGames").textContent =
userProfile.bettingStats.totalPlayed;

const oppBox = document.getElementById("opponentList");
oppBox.innerHTML = "";

const opponents = userProfile.bettingStats.opponents || {};

const sortedOpps = Object.entries(opponents)
.sort((a,b)=>b[1]-a[1]);

if(!sortedOpps.length){
oppBox.innerHTML = "<p>No opponents yet</p>";
}else{
sortedOpps.slice(0,5).forEach(([name,count])=>{
const row = document.createElement("div");

row.style.display = "flex";
row.style.justifyContent = "space-between";
row.style.padding = "6px 10px";
row.style.marginBottom = "6px";
row.style.borderRadius = "10px";
row.style.background = "rgba(255,255,255,.08)";

row.innerHTML = `
<span>${name}</span>
<span>${count} games</span>
`;

oppBox.appendChild(row);
});
}


/* ===== ROUND HISTORY TABLE ===== */

const table = document.getElementById("roundHistoryTable");
table.innerHTML = "";

[...userProfile.rounds].reverse().forEach((r, index) =>{

const d = new Date(r.date);
const date = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;

const par = r.holes === 9 ? 36 : 72;
const diff = r.strokes - par;

const row = document.createElement("tr");
row.onclick = () => openRoundDetails(index);


row.innerHTML = `
<td style="padding:8px 10px;">${date}</td>
<td style="padding:8px 10px;">${r.course}</td>
<td style="padding:8px 10px;">${par}</td>
<td style="padding:8px 10px;">${r.strokes}</td>
<td style="padding:8px 10px;border-left:1px solid rgba(255,255,255,.15);">
${diff>=0?"+":""}${diff}
</td>
<td style="padding:8px 10px;border-left:1px solid rgba(255,255,255,.15);">
${r.differential ?? "-"}
</td>
<td style="padding:8px 6px;text-align:center;">
<button class="delete-round-btn" onclick="deleteRound(${index})">✕</button>
</td>
`;

table.appendChild(row);
});

/* Default tab */
showProfileTab("summaryTab");
}

function openRoundDetails(index){

const r = [...userProfile.rounds].reverse()[index];

let html = `
<table style="width:100%;text-align:center;border-collapse:collapse">
<tr>
<th>Hole</th><th>Par</th><th>Score</th><th>+/-</th>
</tr>
`;

for(let i=0;i<r.scores.length;i++){

const score = r.scores[i];
const par = r.pars[i];
const diff = score - par;

let wrapStart="", wrapEnd="";

if(diff <= -2){
wrapStart=`<span style="border:2px solid gold;border-radius:50%;padding:4px 10px;">`;
wrapEnd="</span>";
}
else if(diff === -1){
wrapStart=`<span style="border:2px solid red;border-radius:50%;padding:4px 10px;">`;
wrapEnd="</span>";
}
else if(diff >= 1){
wrapStart=`<span style="border:2px solid white;padding:4px 10px;">`;
wrapEnd="</span>";
}

html += `
<tr>
<td>${i+1}</td>
<td>${par}</td>
<td>${wrapStart}${score}${wrapEnd}</td>
<td>${diff>=0?"+":""}${diff}</td>
</tr>
<tr style="font-size:12px;color:#ccc">
<td colspan="4">
Putts ${r.putts[i]} | Pen ${r.penalties[i]} |
GIR ${r.gir[i]?"✔":""} | FIR ${r.fir[i]?"✔":""}
</td>
</tr>
`;
}

html += "</table>";

document.getElementById("roundDetailContent").innerHTML = html;
document.getElementById("roundDetailModal").classList.remove("hidden");
}

window.editProfile = () => {

document.getElementById("profileName").value = userProfile.name;
document.getElementById("profileHandicap").value = userProfile.currentHandicap;
document.getElementById("profileSaveBtn").textContent = "Save Profile";

show("profile-setup");

};
window.saveProfileChanges = () => {

const name = document.getElementById("profileName").value.trim();
const handicap = parseFloat(document.getElementById("profileHandicap").value) || 0;

if(!name){
alert("Please enter your name");
return;
}

if(!userProfile){
userProfile = {
name,
startingHandicap: handicap,
currentHandicap: handicap,
rounds: [],
bettingStats:{
totalWon:0,
totalLost:0,
totalPlayed:0
}
};
}else{
userProfile.name = name;
userProfile.currentHandicap = handicap;
}

localStorage.setItem("userProfile", JSON.stringify(userProfile));

renderProfile();
goHomeClean(); // 👈 THIS is the important part
};

function deleteRound(displayIndex){

if(!confirm("Delete this round permanently?")) return;

// Correct index from reversed display
const realIndex = userProfile.rounds.length - 1 - displayIndex;

if(realIndex < 0 || realIndex >= userProfile.rounds.length) return;

userProfile.rounds.splice(realIndex,1);

// Recalculate handicap safely
updateHandicap();

localStorage.setItem("userProfile", JSON.stringify(userProfile));

renderProfile();
}

/* ================= RESET BETTING ================= */

document.getElementById("resetBettingBtn").onclick = () => {

if(!confirm("Reset all betting stats? This cannot be undone.")) return;

userProfile.bettingStats = {
totalWon:0,
totalLost:0,
totalPlayed:0
};

localStorage.setItem("userProfile", JSON.stringify(userProfile));
renderProfile();

};

/* ================= OPPONENT TRACKING ================= */

function trackOpponents(){

if(!userProfile.bettingStats.opponents){
userProfile.bettingStats.opponents = {};
}

players.forEach(p=>{
if(p === userProfile.name) return;

userProfile.bettingStats.opponents[p] =
(userProfile.bettingStats.opponents[p] || 0) + 1;
});

localStorage.setItem("userProfile", JSON.stringify(userProfile));
}

function closeRoundDetail(){
document.getElementById("roundDetailModal").classList.add("hidden");
}