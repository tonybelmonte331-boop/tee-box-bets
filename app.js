let currentGame;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};
let hole=1, holeLimit=9, baseWager=0;

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

window.selectGame=(g)=>{
 currentGame=g;
 show("step-style");
};

window.nextTeams=()=>{
 playStyle = document.getElementById("playStyle").value;
 playerCount = parseInt(document.getElementById("playerCount").value);

 playStyle==="teams" ? show("step-teams") : nextPlayers();
};

window.nextPlayers=()=>{
 teamAName = document.getElementById("teamAName").value || "Team A";
 teamBName = document.getElementById("teamBName").value || "Team B";

 teamALabel.textContent=teamAName;
 teamBLabel.textContent=playStyle==="teams"?teamBName:"";

 teamAInputs.innerHTML="";
 teamBInputs.innerHTML="";

 if(playStyle==="teams"){
 for(let i=0;i<playerCount/2;i++){
 teamAInputs.innerHTML+=`<input>`;
 teamBInputs.innerHTML+=`<input>`;
 }
 } else {
 for(let i=0;i<playerCount;i++){
 teamAInputs.innerHTML+=`<input>`;
 }
 }

 show("step-players");
};

window.nextSettings=()=>show("step-settings");

/* START */

window.startRound=()=>{
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 if(playStyle==="teams"){
 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value); teams.A.push(i.value); ledger[i.value]=0;
 });
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value); teams.B.push(i.value); ledger[i.value]=0;
 });
 } else {
 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value); ledger[i.value]=0;
 });
 }

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 skinsGame.reset();

 show("game-screen");

 skinsBox.classList.toggle("hidden",currentGame==="vegas");
 vegasBox.classList.toggle("hidden",currentGame!=="vegas");

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
 finishHole();
};

window.winTeam=(t)=>{
 skinsGame.winTeam(t,teams,ledger,baseWager);
 finishHole();
};

window.tieHole=()=>{
 skinsGame.tie();
 finishHole();
};

window.openMultiplier=(m)=>{
 skinsGame.applyMultiplier(m);
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

 if(swing!==0){
 const win = vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose = win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }

 finishHole();
};

/* ROUND FLOW */

function finishHole(){

 updateUI();

 if(hole===9 && holeLimit===18){
 showEndModal("Continue to Back 9");
 return;
 }

 if(hole>=holeLimit){
 showEndModal("Finish Round");
 return;
 }

 hole++;
 updateUI();
}

function updateUI(){
 holeDisplay.textContent=`Hole ${hole}`;
 potDisplay.textContent =
 currentGame==="skins"
 ? `$${skinsGame.currentPot(baseWager)}/player`
 : "";

 leaderboard.innerHTML="";
 players.forEach(p=>{
 leaderboard.innerHTML+=`${p}: $${ledger[p]}<br>`;
 });
}

/* END MODAL */

function showEndModal(text){
 leaderboardModalList.innerHTML = leaderboard.innerHTML;
 leaderboardFinishBtn.textContent = text;

 leaderboardFinishBtn.onclick = ()=>{
 if(text==="Continue to Back 9"){
 leaderboardModal.classList.add("hidden");
 hole++;
 updateUI();
 } else {
 show("step-home");
 }
 };

 leaderboardModal.classList.remove("hidden");
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
 players.forEach(x=>x===p?ledger[x]+=amt*(players.length-1):ledger[x]-=amt);
 closeModals(); updateUI();
};

window.sideTeam=(t)=>{
 const amt=+sideAmount.value;
 teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=amt);
 teams[t].forEach(p=>ledger[p]+=amt);
 closeModals(); updateUI();
};

/* MODALS */

window.closeModals=()=>{
 document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
};