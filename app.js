let currentGame;
let wagerMode;
let playStyle, playerCount;
let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};
let hole=1, holeLimit=9, baseWager=0;

/* NAV */

function show(id){
 document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
}

window.goHome=()=>show("step-home");
window.goGameSelect=()=>show("step-game");
window.showRules=()=>show("rules-screen");

/* SETUP */

window.selectGame=(game,mode)=>{
 currentGame=game;
 wagerMode=mode;
 document.getElementById("wagerLabel").textContent =
 mode==="player"?"Wager per player":"Wager per point";
 show("step-style");
};

window.nextTeams=()=>{
 playStyle=document.getElementById("playStyle").value;
 playerCount=parseInt(document.getElementById("playerCount").value);
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

 teamALabel.textContent=playStyle==="teams"?teamAName:"Players";
 teamBLabel.textContent=playStyle==="teams"?teamBName:"";

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
}

window.nextSettings=()=>show("step-settings");

/* START */

window.startRound=()=>{
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value); ledger[i.value]=0;
 if(playStyle==="teams") teams.A.push(i.value);
 });

 if(playStyle==="teams"){
 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value); ledger[i.value]=0; teams.B.push(i.value);
 });
 }

 baseWager=parseFloat(document.getElementById("baseWager").value);
 holeLimit=parseInt(document.getElementById("holeLimit").value);

 skinsGame.reset();

 show("game-screen");

 skinsBox.classList.toggle("hidden",currentGame==="vegas");
 vegasBox.classList.toggle("hidden",currentGame!=="vegas");

 teamABox.textContent=teamAName;
 teamBBox.textContent=teamBName;

 buildWinnerButtons();
 updateUI();
};

/* SKINS */

function buildWinnerButtons(){
 winnerButtons.innerHTML="";
 if(playStyle==="teams"){
 winnerButtons.innerHTML+=`<button onclick="winTeam('A')">${teamAName}</button>
 <button onclick="winTeam('B')">${teamBName}</button>`;
 } else {
 players.forEach(p=>{
 winnerButtons.innerHTML+=`<button onclick="winPlayer('${p}')">${p}</button>`;
 });
 }
}

window.winPlayer=p=>{
 skinsGame.winPlayer(p,players,ledger,baseWager);
 nextHole();
};

window.winTeam=t=>{
 skinsGame.winTeam(t,teams,ledger,baseWager);
 nextHole();
};

window.tieHole=()=>{
 skinsGame.tie();
 nextHole();
};

/* multipliers now persist until hole is won */

window.openMultiplier = m=>{
 skinsGame.applyMultiplier(m);
};

/* ---------- SIDE BET (FULLY WORKING) ---------- */

window.openSideBet = ()=>{
 sideBetModal.classList.remove("hidden");
 buildSideWinners();
};

window.buildSideWinners = ()=>{
 sideWinners.innerHTML="";

 if(sideMode.value==="player"){
 players.forEach(p=>{
 sideWinners.innerHTML += `<button onclick="sidePlayer('${p}')">${p}</button>`;
 });
 } else {
 sideWinners.innerHTML += `
 <button onclick="sideTeam('A')">${teamAName}</button>
 <button onclick="sideTeam('B')">${teamBName}</button>
 `;
 }
};

window.sidePlayer = p=>{
 const amt = +sideAmount.value;

 players.forEach(x=>{
 if(x===p) ledger[x]+=amt*(players.length-1);
 else ledger[x]-=amt;
 });

 sideBetModal.classList.add("hidden");
 updateUI();
};

window.sideTeam = t=>{
 const amt = +sideAmount.value;

 teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=amt);
 teams[t].forEach(p=>ledger[p]+=amt);

 sideBetModal.classList.add("hidden");
 updateUI();
};

/* VEGAS (UNCHANGED — WORKING) */

window.finishVegasHole=()=>{
 let a=[+a1.value,+a2.value].sort((x,y)=>x-y);
 let b=[+b1.value,+b2.value].sort((x,y)=>x-y);

 const swing = vegasGame.calculate(
 a[0],a[1],b[0],b[1],
 baseWager,
 birdieFlip.checked
 );

 if(swing){
 const win=vegasGame.winner(a[0],a[1],b[0],b[1]);
 const lose=win==="A"?"B":"A";
 teams[lose].forEach(p=>ledger[p]-=swing);
 teams[win].forEach(p=>ledger[p]+=swing);
 }

 nextHole();
};

/* ROUND FLOW */

function nextHole(){
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
 potDisplay.textContent=currentGame==="skins"
 ? `$${skinsGame.currentPot(baseWager)}/player`
 : "";

 leaderboard.innerHTML="";
 players.forEach(p=>{
 leaderboard.innerHTML+=`${p}: $${ledger[p]}<br>`;
 });
}

/* END ROUND */

function showEndModal(text){
 leaderboardModalList.innerHTML=leaderboard.innerHTML;
 leaderboardFinishBtn.textContent=text;

 leaderboardFinishBtn.onclick=()=>{
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

/* ---------- FINISH ROUND BUTTON ---------- */

window.finishRound = ()=>{
 show("step-home");
};