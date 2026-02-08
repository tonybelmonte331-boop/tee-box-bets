let currentGame;
let playStyle="teams";

let teamAName="", teamBName="";
let players=[], teams={A:[],B:[]}, ledger={};

let hole=1, holeLimit=9, baseWager=0;
let pendingMulti=1;

/* ---------- NAV ---------- */

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

/* ---------- SETUP ---------- */

window.selectGame=(g)=>{ currentGame=g; show("step-style"); };

window.nextTeams=()=> show("step-teams");

window.nextPlayers=()=>{
 teamAName=document.getElementById("teamAName").value||"Team A";
 teamBName=document.getElementById("teamBName").value||"Team B";

 teamALabel.textContent=teamAName;
 teamBLabel.textContent=teamBName;

 teamAInputs.innerHTML="";
 teamBInputs.innerHTML="";

 for(let i=0;i<2;i++){
 teamAInputs.innerHTML+=`<input>`;
 teamBInputs.innerHTML+=`<input>`;
 }
 show("step-players");
};

window.nextSettings=()=>show("step-settings");

/* ---------- START ROUND ---------- */

window.startRound=()=>{
 players=[]; teams={A:[],B:[]}; ledger={}; hole=1;

 document.querySelectorAll("#teamAInputs input").forEach(i=>{
 players.push(i.value); teams.A.push(i.value); ledger[i.value]=0;
 });

 document.querySelectorAll("#teamBInputs input").forEach(i=>{
 players.push(i.value); teams.B.push(i.value); ledger[i.value]=0;
 });

 baseWager = parseFloat(document.getElementById("baseWager").value);
 holeLimit = parseInt(document.getElementById("holeLimit").value);

 skinsGame.reset?.();

 show("game-screen");

 skinsBox.classList.toggle("hidden", currentGame==="vegas");
 vegasBox.classList.toggle("hidden", currentGame!=="vegas");

 teamABox.textContent=teamAName;
 teamBBox.textContent=teamBName;

 buildWinnerButtons();
 updateUI();
};

/* ---------- SKINS ---------- */

function buildWinnerButtons(){
 winnerButtons.innerHTML=`
 <button onclick="winTeam('A')">${teamAName}</button>
 <button onclick="winTeam('B')">${teamBName}</button>
 `;
}

window.winTeam=(t)=>{
 skinsGame.winTeam(t,teams,ledger,baseWager);
 finishHole();
};

window.tieHole=()=>{
 skinsGame.tie();
 finishHole();
};

/* ---------- VEGAS ---------- */

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

/* ---------- ROUND FLOW ---------- */

function finishHole(){

 if(hole===9 && holeLimit===18){
 showLeaderboard("Continue to Back 9");
 return;
 }

 if(hole>=holeLimit){
 showLeaderboard("Finish Round");
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

 ledger.innerHTML="";
 players.forEach(p=>{
 ledger.innerHTML+=`${p}: $${ledger[p]}<br>`;
 });
}

/* ---------- LEADERBOARD ---------- */

function showLeaderboard(text){

 const modal=document.getElementById("leaderboardModal");
 const board=document.getElementById("leaderboard");
 const btn=modal.querySelector("button");

 board.innerHTML=[...players]
 .sort((a,b)=>ledger[b]-ledger[a])
 .map(p=>`${p}: $${ledger[p]}`)
 .join("<br>");

 btn.textContent=text;

 btn.onclick=()=>{
 if(text==="Continue to Back 9"){
 modal.classList.add("hidden");
 hole++;
 updateUI();
 } else {
 show("step-home");
 }
 };

 modal.classList.remove("hidden");
}

/* ---------- SIDE BET ---------- */

window.openSideBet=()=>{
 buildSideWinners();
 sideBetModal.classList.remove("hidden");
};

function buildSideWinners(){
 sideWinners.innerHTML=`
 <button onclick="sideTeam('A')">${teamAName}</button>
 <button onclick="sideTeam('B')">${teamBName}</button>
 `;
}

window.sideTeam=(t)=>{
 const amt=+sideAmount.value;
 teams[t==="A"?"B":"A"].forEach(p=>ledger[p]-=amt);
 teams[t].forEach(p=>ledger[p]+=amt);
 closeModals(); updateUI();
};

/* ---------- MULTIPLIERS ---------- */

window.openMultiplier=(m)=>{
 pendingMulti=m;
 multiplierModal.classList.remove("hidden");
};

window.applyMultiplier=(mode)=>{
 skinsGame.applyMultiplier(pendingMulti,mode);
 closeModals();
};

/* ---------- MODALS ---------- */

window.closeModals=()=>{
 document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
};