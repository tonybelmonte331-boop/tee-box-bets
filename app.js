/* ================= GAME ENGINE REGISTRY ================= */

window.GAME_ENGINES = {};

window.registerGame = function(name, engine){
GAME_ENGINES[name] = engine;
};

/* ================= STATE ================= */

let userProfile = JSON.parse(localStorage.getItem("userProfile"));

let currentGame = null;

/* ==== REGISTER GAMES ==== */
registerGame("skins", skinsGame);
registerGame("vegas", vegasGame);
registerGame("nassau", nassauGame);
registerGame("wolf", wolfGame);
registerGame("baseball", baseballGame);

let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;

let historyStack=[];

let currentRound = null;

/* ================= COURSE STORAGE ================= */


let savedCourses = JSON.parse(localStorage.getItem("savedCourses")) || [];

function refreshCourseDropdown(){

const dropdown = document.getElementById("courseDropdown");
const search = document.getElementById("courseSearch");

if(!dropdown || !search) return;

dropdown.innerHTML = "";

savedCourses.forEach(course=>{

const row = document.createElement("div");
row.className = "course-row";

const name = document.createElement("span");

name.textContent = (course.favorite ? "⭐ " : "") + course.name;

name.onclick = ()=>{
search.value = course.name;
dropdown.classList.add("hidden");

const teeSelect = document.getElementById("teeSelect");
teeSelect.innerHTML = "";

const tees = course.tees || { Default: { rating:72, slope:113, pars:course.pars } };

Object.keys(tees).forEach(t=>{
const opt = document.createElement("option");
opt.value = t;
opt.textContent = t;
teeSelect.appendChild(opt);
});
};

const del = document.createElement("span");
del.textContent = "✕";
del.className = "course-delete";

del.onclick = (e)=>{
e.stopPropagation();

if(!confirm(`Delete ${course.name}?`)) return;

savedCourses = savedCourses.filter(c=>c.name !== course.name);

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

/* 🔥 CLEAR SELECTION IF THIS COURSE WAS SELECTED */
const search = document.getElementById("courseSearch");

if(search && search.value === course.name){
search.value = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}
}

refreshCourseDropdown();
};

const star = document.createElement("span");
star.textContent = "⭐";
star.style.cursor = "pointer";

star.onclick = (e)=>{

e.stopPropagation();

course.favorite = !course.favorite;

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();

};

row.appendChild(name);
row.appendChild(del);
row.appendChild(star);

dropdown.appendChild(row);

});

}

/*
Course Structure:

{
name: "Pine Valley",
pars: [4,4,3,5,4,4,3,4,5, 4,5,3,4,4,5,3,4,4],
}
*/

window.saveCourse = () => {

const name = document.getElementById("newCourseName").value.trim();
if(!name) return alert("Enter course name");

if(savedCourses.some(c => c.name.toLowerCase() === name.toLowerCase())){
return alert("Course already exists");
}

let pars = [];

for(let i=1;i<=18;i++){
const val = +document.getElementById(`par${i}`).value;
if(!val) return alert("Enter all 18 pars");
pars.push(val);
}

const teeName = document.getElementById("newTeeName").value.trim() || "Default";

savedCourses.push({
name,
favorite:false,
tees: {
[teeName]: {
rating: +document.getElementById("newTeeRating").value || 72,
slope: +document.getElementById("newTeeSlope").value || 113,
pars
}
}
});

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

closeCourseModal();

resetAddCourseModal();

refreshCourseDropdown();
};

function resetAddCourseModal(){

const name = document.getElementById("newCourseName");
if(name) name.value = "";

const tee = document.getElementById("newTeeName");
if(tee) tee.value = "";

const rating = document.getElementById("newTeeRating");
if(rating) rating.value = "";

const slope = document.getElementById("newTeeSlope");
if(slope) slope.value = "";

for(let i=1;i<=18;i++){
const par = document.getElementById(`par${i}`);
if(par) par.value = "";
}

}

/* ================= TEE MANAGER ================= */
function openTeeManager(){

document.body.classList.add("modal-open");

const courseName = document.getElementById("courseSearch").value;

const course = savedCourses.find(c => c.name === courseName);

if(!course){
alert("Select a course first");
return;
}

const teeList = document.getElementById("teeList");
teeList.innerHTML = "";

Object.keys(course.tees).forEach(name=>{

const tee = course.tees[name];

const row = document.createElement("div");
row.className = "tee-row";

row.innerHTML = `

<div>

<strong>${name}</strong>

<div style="font-size:12px;opacity:.8">
Rating
<input value="${tee.rating}"
class="tee-edit-rating"
inputmode="decimal"
onchange="editTee('${course.name}','${name}','rating',this.value)">

Slope
<input value="${tee.slope}"
class="tee-edit-slope"
inputmode="numeric"
onchange="editTee('${course.name}','${name}','slope',this.value)">
</div>

</div>

<button onclick="deleteTee('${course.name}','${name}')">✕</button>

`;

teeList.appendChild(row);

});

document.getElementById("teeManagerModal").classList.remove("hidden");

}

function closeTeeManager(){

document.body.classList.remove("modal-open");

document.getElementById("teeManagerModal").classList.add("hidden");

/* clear add tee inputs */

document.getElementById("teeNameInput").value = "";
document.getElementById("teeRatingInput").value = "";
document.getElementById("teeSlopeInput").value = "";

}

function addTeeToCourse(){

const courseName = document.getElementById("courseSearch").value;

const course = savedCourses.find(c => c.name === courseName);

if(!course){
alert("Select course first");
return;
}

const name = document.getElementById("teeNameInput").value.trim();
const rating = +document.getElementById("teeRatingInput").value || 72;
const slope = +document.getElementById("teeSlopeInput").value || 113;

if(!name){
alert("Enter tee name");
return;
}

if(course.tees[name]){
alert("Tee already exists");
return;
}

const basePars = Object.values(course.tees)[0].pars;

course.tees[name] = {
rating,
slope,
pars: [...basePars]
};

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();
openTeeManager();

document.getElementById("teeNameInput").value = "";
document.getElementById("teeRatingInput").value = "";
document.getElementById("teeSlopeInput").value = "";

}

function deleteTee(courseName, teeName){

const course = savedCourses.find(c => c.name === courseName);

if(!course) return;

if(Object.keys(course.tees).length <= 1){
alert("Cannot delete the last tee");
return;
}

if(!confirm(`Delete ${teeName} tee?`)) return;

delete course.tees[teeName];

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();
openTeeManager();

}

function editTee(courseName, teeName, field, value){

const course = savedCourses.find(c=>c.name===courseName);

if(!course) return;

if(field === "rating"){
course.tees[teeName].rating = +value;
}

if(field === "slope"){
course.tees[teeName].slope = +value;
}

localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

refreshCourseDropdown();

}

/* ================= HAPTIC ================= */
function tapHaptic(){
    if (navigator.vibrate){
        navigator.vibrate(10);
    }
}

/* ================= AUTO DECIMAL ================= */
function autoDecimal(el){

el.addEventListener("beforeinput", (e)=>{
// Prevent second decimal
if(e.data === "." && el.value.includes(".")){
e.preventDefault();
}
});

el.addEventListener("input", ()=>{

let val = el.value.replace(/[^\d.]/g,"");

// Auto insert decimal after 2 digits if none exists
if(!val.includes(".") && val.length > 2){
val = val.slice(0,2) + "." + val.slice(2);
}

// Ensure only one decimal
const parts = val.split(".");
if(parts.length > 2){
val = parts[0] + "." + parts[1];
}

el.value = val;

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

    tapHaptic();

document.getElementById("holePar").value = value;

document.querySelectorAll(".par-btn").forEach(b=>{
b.classList.remove("active");
});

el.classList.add("active");
}

["firToggle","girToggle"].forEach(id=>{


const btn = document.getElementById(id);

btn.onclick = ()=>{
    tapHaptic();
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
currentGame === "wolf" ? "Wolf" :
currentGame === "baseball" ? "Baseball" :
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
tapHaptic();

const current = document.querySelector("section:not(.hidden)");

/* 🔥 Reset round setup if leaving it */
if(current && current.id === "round-setup" && id !== "round-setup"){
resetRoundSetup();
}

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
 tapHaptic();

 if (!screenHistory.length) return;

const prev = screenHistory.pop();

/* If leaving round setup, reset the fields */
const current = document.querySelector("section:not(.hidden)");

if(current && current.id === "round-setup"){
resetRoundSetup();
}

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

 document.getElementById(prev).classList.remove("hidden");

 syncBackButton();
 updateHeader(prev);
};

function resetRoundSetup(){

const search = document.getElementById("courseSearch");
if(search) search.value = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}

const rating = document.getElementById("courseRating");
if(rating) rating.value = "";

const slope = document.getElementById("courseSlope");
if(slope) slope.value = "";

const holes = document.getElementById("roundHoles");
if(holes) holes.value = "9";

const nineType = document.getElementById("nineType");
if(nineType) nineType.value = "front";

}

function goHomeClean(){

    userProfile = JSON.parse(localStorage.getItem("userProfile"));

screenHistory = [];

resetRoundSetup();
document.getElementById("baseWager").value = "";
document.getElementById("frontWager").value = "";
document.getElementById("backWager").value = "";
document.getElementById("totalWager").value = "";

document.querySelectorAll("section").forEach(s =>
s.classList.add("hidden")
);

document.getElementById("step-home").classList.remove("hidden");

updateHeader("step-home");
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

window.openCourseModal = () =>{
document.getElementById("courseModal").classList.remove("hidden");
};

window.closeCourseModal = () =>{
document.getElementById("courseModal").classList.add("hidden");
resetAddCourseModal();
};

function startGame(game){

currentGame = game;

if(game === "skins"){
document.getElementById("skinsBox").classList.remove("hidden");
}

if(game === "vegas"){
document.getElementById("vegasBox").classList.remove("hidden");
}

if(game === "nassau"){
document.getElementById("nassauBox").classList.remove("hidden");
}

if(game === "wolf"){
document.getElementById("wolfBox").classList.remove("hidden");
}

if(game === "baseball"){
document.getElementById("baseballBox").classList.remove("hidden");
}

show("game-screen");

}

/* ================= PROFILE CHECK ================= */


document.addEventListener("DOMContentLoaded", () => {

const ratingInput = document.getElementById("courseRating");
const slopeInput = document.getElementById("courseSlope");
const manualRating = document.getElementById("manualRating");
const manualSlope = document.getElementById("manualSlope");
const newTeeRating = document.getElementById("newTeeRating");
const newTeeSlope = document.getElementById("newTeeSlope");
const teeRatingInput = document.getElementById("teeRatingInput");
const teeSlopeInput = document.getElementById("teeSlopeInput");

if(ratingInput) autoDecimal(ratingInput);
if(manualRating) autoDecimal(manualRating);
if(teeRatingInput) autoDecimal(teeRatingInput);
if(newTeeRating) autoDecimal(newTeeRating);

if(slopeInput) numericOnly(slopeInput);
if(manualSlope) numericOnly(manualSlope);
if(newTeeSlope) numericOnly(newTeeSlope);
if(teeSlopeInput) numericOnly(teeSlopeInput);

if(!userProfile){
show("profile-setup");
}
sideBetBtn.classList.add("hidden");

document.getElementById("manualSaveBtn").onclick = addManualRound;

const roundHoles = document.getElementById("roundHoles");
const nineType = document.getElementById("nineType");

if(roundHoles && nineType){

roundHoles.addEventListener("change", ()=>{

if(roundHoles.value === "18"){
nineType.classList.add("hidden");
}else{
nineType.classList.remove("hidden");
}

});

}
refreshCourseDropdown();

const search = document.getElementById("courseSearch");
const dropdown = document.getElementById("courseDropdown");

if(search && dropdown){

search.addEventListener("focus", ()=>{
dropdown.classList.remove("hidden");
});

search.addEventListener("input", ()=>{

const term = search.value.trim().toLowerCase();

dropdown.innerHTML = "";

/* ===== SAVED COURSES ===== */

savedCourses
.filter(c=>c.name.toLowerCase().includes(term))
.forEach(course=>{

const row = document.createElement("div");
row.className = "course-row";

const name = document.createElement("span");
name.textContent = course.name;

name.onclick = ()=>{
search.value = course.name;
dropdown.classList.add("hidden");
};

const del = document.createElement("span");
del.textContent = "✕";
del.className = "course-delete";

del.onclick = (e)=>{
e.stopPropagation();

if(!confirm(`Delete ${course.name}?`)) return;

savedCourses = savedCourses.filter(c=>c.name !== course.name);
localStorage.setItem("savedCourses", JSON.stringify(savedCourses));

if(search.value === course.name){

search.value = "";

const teeSelect = document.getElementById("teeSelect");

if(teeSelect){
teeSelect.innerHTML = `<option value="Default">Default</option>`;
teeSelect.value = "Default";
}

}

refreshCourseDropdown();
search.dispatchEvent(new Event("input"));

};

row.appendChild(name);
row.appendChild(del);

dropdown.appendChild(row);

});



});

document.addEventListener("click",(e)=>{
if(!e.target.closest(".course-select-wrapper")){
dropdown.classList.add("hidden");
}
});

}

/* ===== HOME DASHBOARD ===== */

if(userProfile){

/* DASH ROUNDS */

const dashRounds = document.getElementById("dashRounds");
if(dashRounds){
const rounds = userProfile.rounds ? userProfile.rounds.length : 0;
dashRounds.textContent = rounds;
}

/* DASH HANDICAP */

const dashHandicap = document.getElementById("dashHandicap");
if(dashHandicap){
const handicap = userProfile.currentHandicap || 0;
dashHandicap.textContent = handicap.toFixed(1);
}

/* DASH BETTING */

const dashBetting = document.getElementById("dashBetting");
if(dashBetting){

const totalWon = userProfile.bettingStats ? userProfile.bettingStats.totalWon : 0;
const totalLost = userProfile.bettingStats ? userProfile.bettingStats.totalLost : 0;

const net = totalWon - totalLost;

dashBetting.textContent =
(net >= 0 ? "+" : "") + "$" + net.toFixed(2);

}

}

});
/* ================= GAME SELECT ================= */

window.selectGame=game=>{
document.getElementById("skinsBox").classList.add("hidden");
document.getElementById("vegasBox").classList.add("hidden");
document.getElementById("nassauBox").classList.add("hidden");
document.getElementById("wolfBox").classList.add("hidden");
document.getElementById("baseballBox").classList.add("hidden");
currentGame=game;

if(game === "wolf"){
document.getElementById("wolfBox").classList.remove("hidden");
}

if(game === "baseball"){
document.getElementById("baseballBox").classList.remove("hidden");
}

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

if(game==="vegas"){
document.getElementById("wagerLabel").textContent="Wager per point";
}
else if(game==="baseball"){
document.getElementById("wagerLabel").textContent="Wager per Run";
}
else{
document.getElementById("wagerLabel").textContent="Wager per player";
}

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
gameState: GAME_ENGINES[currentGame]?.getState
? GAME_ENGINES[currentGame].getState()
: null
});
}

window.undoHole=()=>{
if(!historyStack.length) return;

const prev=historyStack.pop();
hole=prev.hole;
ledger=prev.ledger;

if(prev.gameState && GAME_ENGINES[currentGame]?.setState){
GAME_ENGINES[currentGame].setState(prev.gameState);
}

updateUI();
};

/* ================= START ROUND ================= */

window.startRound=()=>{
players=[]; teams={A:[],B:[]}; ledger={}; hole=1;
historyStack=[];
document.getElementById("a1").value="";
document.getElementById("a2").value="";
document.getElementById("b1").value="";
document.getElementById("b2").value="";
document.getElementById("birdieFlip").checked=false;

document.querySelectorAll("#teamAInputs input").forEach(i=>{
players.push(i.value);
ledger[i.value]=0;
teams.A.push(i.value);
});

if(playStyle === "ffa"){
teams.A = [players[0]];
teams.B = [players[1]];
}

document.querySelectorAll("#teamBInputs input").forEach(i=>{
players.push(i.value);
ledger[i.value]=0;
teams.B.push(i.value);
});

baseWager=+document.getElementById("baseWager").value;
holeLimit=currentGame==="nassau"?18:+holeLimitSelect.value;

if(GAME_ENGINES[currentGame]?.reset){
GAME_ENGINES[currentGame].reset(baseWager);
}

skinsBox.classList.toggle("hidden",currentGame!=="skins");
vegasBox.classList.toggle("hidden",currentGame!=="vegas");
nassauBox.classList.toggle("hidden",currentGame!=="nassau");
document.getElementById("wolfBox").classList.toggle("hidden",currentGame!=="wolf");
document.getElementById("baseballBox").classList.toggle("hidden",currentGame!=="baseball");

teamAPlayers.textContent=`${teamAName}: ${teams.A.join(" & ")}`;
teamBPlayers.textContent=`${teamBName}: ${teams.B.join(" & ")}`;

if(currentGame==="baseball"){

document.getElementById("baseballAwayLabel")
.textContent="Away: "+teams.A.join(" / ");

document.getElementById("baseballHomeLabel")
.textContent="Home: "+teams.B.join(" / ");

if(playStyle==="teams"){

document.getElementById("baseballAwayScore2").classList.remove("hidden");
document.getElementById("baseballHomeScore2").classList.remove("hidden");

}else{

document.getElementById("baseballAwayScore2").classList.add("hidden");
document.getElementById("baseballHomeScore2").classList.add("hidden");

}

}

if(currentGame==="nassau") buildNassauButtons();

buildWinnerButtons();
document.querySelectorAll("#game-screen input").forEach(i => i.value = "");
updateUI();
document.getElementById("leaderboardWrapper").classList.add("collapsed");
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

btn.textContent =
t==="A"
? `${teamAName}: ${teams.A.join(" & ")}`
: `${teamBName}: ${teams.B.join(" & ")}`;
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

/* ================= BASEBALL ================= */

window.finishBaseballHole=()=>{

saveState();

let scoreA1=+document.getElementById("baseballAwayScore1").value||0;
let scoreA2=+document.getElementById("baseballAwayScore2").value||0;

let scoreB1=+document.getElementById("baseballHomeScore1").value||0;
let scoreB2=+document.getElementById("baseballHomeScore2").value||0;

let scoreA=scoreA1;
let scoreB=scoreB1;

if(playStyle==="teams"){
scoreA=scoreA1+scoreA2;
scoreB=scoreB1+scoreB2;
}

const birdie=document.getElementById("baseballBirdie").checked;

if(scoreA===0&&scoreB===0){
alert("Enter scores");
return;
}

GAME_ENGINES.baseball.recordHole(
hole,
scoreA,
scoreB,
birdie,
baseWager,
teams,
ledger
);

document.getElementById("baseballAwayScore1").value="";
document.getElementById("baseballAwayScore2").value="";
document.getElementById("baseballHomeScore1").value="";
document.getElementById("baseballHomeScore2").value="";
document.getElementById("baseballBirdie").checked=false;

nextHole();
};

/* ================= NASSAU ================= */

function buildNassauButtons(){
nassauWinners.innerHTML="";
["A","B"].forEach(t=>{
const btn=document.createElement("button");
btn.textContent = 
t==="A"
? `${teamAName}: ${teams.A.join(" & ")}`
: `${teamBName}: ${teams.B.join(" & ")}`;
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
document.getElementById("leaderboardWrapper").classList.remove("collapsed");
updateUI();
}

function toggleLeaderboard(){

const wrap = document.getElementById("leaderboardWrapper");
const header = document.getElementById("leaderboardHeader");

wrap.classList.toggle("collapsed");

header.textContent =
wrap.classList.contains("collapsed")
? "▲ Leaderboard"
: "▼ Leaderboard";

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

if(currentGame==="baseball"){

const inning=Math.ceil(hole/2);
const isTop=hole%2===1;

const txt=(isTop?"Top":"Bottom")+" of "+inning;

const el=document.getElementById("baseballInning");
if(el) el.textContent=txt;

}

/* ===== ENHANCED LEADERBOARD ===== */

const sorted = [...players].sort((a,b)=>ledger[b]-ledger[a]);

leaderboard.innerHTML = "";

sorted.forEach((p,i)=>{

const value = ledger[p];
const row = document.createElement("div");
row.style.transition = "transform .25s ease, opacity .25s ease";
row.style.transform = "translateY(10px)";
row.style.opacity = "0";

row.style.display = "flex";
row.style.background = "rgba(255,255,255,.008)";
row.style.backdropFilter = "blur(6px)";
row.style.border = "1px solid rgba(255,255,255,.12)";
row.style.justifyContent = "space-between";
row.style.padding = "8px 12px";
row.style.marginBottom = "6px";
row.style.borderRadius = "10px";
row.style.fontWeight = "600";

if(i === 0){
row.style.background = "#0f5132"; // leader highlight
row.classList.add("leader-flash");
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

requestAnimationFrame(()=>{
row.style.transform = "translateY(0)";
row.style.opacity  = "1";
});

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

setTimeout(()=>{
goHomeClean();
},50);

}

/* ================= ROUND TRACKING ================= */

let roundHistory = [];

window.startRoundTracking = () => {

const selectedCourseName = document.getElementById("courseSearch")?.value;
const holesSelected = +document.getElementById("roundHoles").value;
const nineType = document.getElementById("nineType")?.value; // front/back

let selectedCourse = savedCourses.find(c => c.name === selectedCourseName);

let parArray = [];
let holeOffset = 0;
let rating = 72;
let slope = 113;

if(selectedCourse){

 const teeName = document.getElementById("teeSelect")?.value || "Default";
 const tee = selectedCourse.tees?.[teeName];

 if(tee){
 rating = tee.rating;
 slope = tee.slope;

 if(holesSelected === 18){
 parArray = tee.pars;
 }else if(nineType === "back"){
 parArray = tee.pars.slice(9,18);
 holeOffset = 9;
 }else{
 parArray = tee.pars.slice(0,9);
holeOffset = 0;
}
}

}else{
parArray = []; // manual mode
}

currentRound = {
course: selectedCourseName || document.getElementById("courseName").value || "Unknown Course",
rating,
slope,
holes: holesSelected,
currentHole: 1,
scores: [],
pars: [],
putts: [],
penalties: [],
gir: [],
fir: [],
totalStrokes: 0,
totalPar: 0,
loadedPars: parArray,
holeOffset,
};

roundHistory = [];
updateRoundUI();
show("round-play");
};

function updateRoundUI(){

if(!currentRound) return;

const parButtonContainer = document.getElementById("parButtonContainer");

const actualHoleNumber =
currentRound.currentHole + (currentRound.holeOffset || 0);

if(currentRound.loadedPars && currentRound.loadedPars.length){

parButtonContainer?.classList.add("hidden");

document.getElementById("roundHoleDisplay").textContent =
`Hole ${actualHoleNumber} (Par ${currentRound.loadedPars[currentRound.currentHole - 1]})`;

}else{

parButtonContainer?.classList.remove("hidden");

document.getElementById("roundHoleDisplay").textContent =
`Hole ${actualHoleNumber} of ${currentRound.holes}`;

}

let totalParDisplay = "";

if(currentRound.loadedPars && currentRound.loadedPars.length){

const totalPar = currentRound.loadedPars.reduce((a,b)=>a+b,0);
totalParDisplay = ` | Par ${totalPar}`;

}

const totalPar =currentRound.loadedPars && currentRound.loadedPars.length
? currentRound.loadedPars.reduce((a,b)=>a+b,0)
: currentRound.totalPar || "";

document.getElementById("roundCourseMain").innerHTML =
`${currentRound.course}${totalPar ? ` <span style="opacity:.75;font-weight:600;"> — Par ${totalPar}</span>` : ""}`;

document.getElementById("roundCourseSub").textContent =
`Rating ${currentRound.rating} • Slope ${currentRound.slope}`;

const toPar = currentRound.totalStrokes - currentRound.totalPar;

const courseHandicap = Math.round(
(userProfile.currentHandicap * currentRound.slope) / 113
);

const net = currentRound.totalStrokes - courseHandicap;

document.getElementById("roundLiveStats").textContent =
`Total ${currentRound.totalStrokes} | To Par ${toPar>=0?"+":""}${toPar} | Net ${net}`;

updateHeader("round-play");
}

function setScore(val, el){

    tapHaptic();

const input = document.getElementById("holeScore");

if(val === 8){
input.classList.remove("hidden");
input.focus();
input.value = "";
return;
}

input.value = val;

/* Remove active from all buttons */
document.querySelectorAll("#scoreButtons button").forEach(btn=>{
btn.classList.remove("active");
});

/* Add active to selected */
el.classList.add("active");
}


window.submitHoleScore = () => {

if(!currentRound) return;

const score = +document.getElementById("holeScore").value;
let par;

if(currentRound.loadedPars && currentRound.loadedPars.length){
par = currentRound.loadedPars[currentRound.currentHole - 1];
}else{
par = +document.getElementById("holePar").value;
}
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
document.querySelectorAll("#scoreButtons button").forEach(btn=>{
btn.classList.remove("active");
});
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
<td>${i + 1 + (currentRound.holeOffset || 0)}</td>
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

const totalPutts = currentRound.putts.reduce((a,b)=>a+b,0);
const totalPens = currentRound.penalties.reduce((a,b)=>a+b,0);

const girMade = currentRound.gir.filter(x=>x).length;
const girTotal = currentRound.gir.length;

let firMade = 0;
let firTotal = 0;

for(let i=0;i<currentRound.fir.length;i++){
    if(currentRound.pars[i] !== 3){
        firTotal++;
        if(currentRound.fir[i]) firMade++;
    }
}


html += `
</table>

<div style="margin-top:16px;text-align:left;font-size:15px;line-height:1.6">

<strong>Totals</strong><br>
Par: ${currentRound.totalPar}<br>
Score: ${currentRound.totalStrokes}<br>
+/-: ${currentRound.totalStrokes - currentRound.totalPar}<br><br>

GIR: ${girMade}/${girTotal} (${Math.round(girMade/girTotal*100)}%)<br>
FIR: ${firMade}/${firTotal} (${Math.round(firMade/firTotal*100)}%)<br><br>

Putts: ${totalPutts}<br>
Penalty Strokes: ${totalPens}

</div>
`;

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
<span>${count}</span>
`;

oppBox.appendChild(row);

});
}


/* ===== PREMIUM ROUND HISTORY ===== */

const container = document.getElementById("roundHistoryTable");
container.innerHTML = "";

if(!userProfile.rounds.length){
container.innerHTML = `<div style="opacity:.6;padding:12px 0;">No rounds yet</div>`;
}else{

[...userProfile.rounds].reverse().forEach((r, index) =>{

const d = new Date(r.date);
const shortDate = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;

const par = r.holes === 9 ? 36 : 72;
const diff = r.strokes - par;

const card = document.createElement("div");
card.className = "round-card";
card.onclick = () => openRoundDetails(index);

card.innerHTML = `
<div class="round-card-left">

<div class="round-card-title">
${shortDate} – ${r.course}
</div>

<div class="round-card-sub">
Par ${par} • Score ${r.strokes} • 
<span class="${diff<0?'score-under':diff>0?'score-over':'score-even'}">
${diff>=0?"+":""}${diff}
</span>
${r.differential !== undefined ? `• Diff ${r.differential}` : ""}
</div>

</div>

<button class="delete-round-btn"
onclick="event.stopPropagation(); deleteRound(${index})">
✕
</button>
`;

container.appendChild(card);

});

}

}

function openRoundDetails(index){

const r = [...userProfile.rounds].reverse()[index];

const d = new Date(r.date);
const shortDate = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;

let html = `
<div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.15);">
<strong style="font-size:15px;">${shortDate}</strong><br>
<span style="opacity:.85;">${r.course}</span>
</div>

<table style="width:100%;text-align:center;border-collapse:collapse">
<tr>
<th>Hole</th>
<th>Par</th>
<th>Score</th>
<th>+/-</th>
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

const totalPutts = r.putts.reduce((a,b)=>a+b,0);
const totalPens = r.penalties.reduce((a,b)=>a+b,0);

const girMade = r.gir.filter(x=>x).length;
const girTotal = r.gir.length;

let firMade = 0;
let firTotal = 0;

for(let i=0;i<r.fir.length;i++){
    if(r.pars[i] !== 3){
        firTotal++;
        if(r.fir[i]) firMade++;
    }
}

html += `
</table>

<div style="margin-top:18px;text-align:left;font-size:15px;line-height:1.7">

<strong>Round Summary</strong><br>

Par: ${r.pars.reduce((a,b)=>a+b,0)}<br>
Score: ${r.strokes}<br>
+/-: ${r.toPar>=0?"+":""}${r.toPar}<br><br>

GIR: ${girMade}/${girTotal} (${girTotal?Math.round(girMade/girTotal*100):0}%)<br>
FIR: ${firMade}/${firTotal} (${firTotal?Math.round(firMade/firTotal*100):0}%)<br><br>

Putts: ${totalPutts}<br>
Penalty Strokes: ${totalPens}

</div>
`;

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

event.stopPropagation();

const confirmed = confirm("Delete this round permanently?");
if(!confirmed) return;

const realIndex = userProfile.rounds.length - 1 - displayIndex;

if(realIndex < 0 || realIndex >= userProfile.rounds.length) return;

userProfile.rounds.splice(realIndex,1);

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

/* ================= BASEBALL SCOREBOARD ================= */

window.openBaseballScoreboard = () => {

const data = GAME_ENGINES.baseball.getScoreboard();

let awayTotal = data.away.reduce((a,b)=>a+b,0);
let homeTotal = data.home.reduce((a,b)=>a+b,0);

let html = `
<div class="mlb-scoreboard">

<div class="mlb-row header">
<div></div>
${[1,2,3,4,5,6,7,8,9].map(i=>`<div>${i}</div>`).join("")}
<div>R</div>
</div>

<div class="mlb-row">
<div class="team-name">${teams.A.join("/")}</div>
${data.away.map(r=>`<div>${r ?? 0}</div>`).join("")}
<div class="runs">${awayTotal}</div>
</div>

<div class="mlb-row">
<div class="team-name">${teams.B.join("/")}</div>
${data.home.map(r=>`<div>${r ?? 0}</div>`).join("")}
<div class="runs">${homeTotal}</div>
</div>

</div>
`;

document.getElementById("baseballScoreboardTable").innerHTML = html;

document.getElementById("baseballScoreboardModal")
.classList.remove("hidden");

};

window.closeBaseballScoreboard=()=>{

document.getElementById("baseballScoreboardModal")
.classList.add("hidden");

};