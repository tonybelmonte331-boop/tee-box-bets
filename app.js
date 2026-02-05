let gameType;
let playStyle;
let playerCount;

let players=[];
let teams={A:[],B:[]};
let ledger={};

let hole=1;
let holeLimit=9;
let baseWager=0;
let carryCount=1;
let history=[];

/* --------- STEP FLOW --------- */

function hideSteps(){
  document.querySelectorAll("section").forEach(s=>s.classList.add("hidden"));
}

function selectGame(type){
  gameType=type;
  hideSteps();
  document.getElementById("step-style").classList.remove("hidden");
}

function prevStep(){
  location.reload();
}

function nextToPlayers(){
  playStyle=document.getElementById("playStyle").value;
  playerCount=parseInt(document.getElementById("playerCount").value);

  hideSteps();
  document.getElementById("step-players").classList.remove("hidden");

  buildPlayerInputs();
}

function buildPlayerInputs(){
  const wrap=document.getElementById("playerInputs");
  const teamWrap=document.getElementById("teamAssign");

  wrap.innerHTML="";
  teamWrap.innerHTML="";

  for(let i=0;i<playerCount;i++){
    wrap.innerHTML+=`<input placeholder="Player ${i+1}">`;

    if(playStyle==="teams"){
      teamWrap.innerHTML+=`
        Player ${i+1}
        <select>
          <option value="A">Team A</option>
          <option value="B">Team B</option>
        </select><br>`;
      teamWrap.classList.remove("hidden");
    }
  }
}

function nextToSettings(){
  hideSteps();
  document.getElementById("step-settings").classList.remove("hidden");
}

/* --------- START GAME --------- */

function startGame(){
  players=[];
  ledger={};
  teams={A:[],B:[]};

  const inputs=document.querySelectorAll("#playerInputs input");
  inputs.forEach(i=>{
    players.push(i.value||"Player");
    ledger[i.value||"Player"]=0;
  });

  baseWager=parseFloat(document.getElementById("baseWager").value);
  holeLimit=parseInt(document.getElementById("holeLimit").value);

  if(playStyle==="teams"){
    document.querySelectorAll("#teamAssign select")
      .forEach((s,i)=>teams[s.value].push(players[i]));
  }

  hideSteps();
  document.getElementById("game-screen").classList.remove("hidden");

  buildWinnerButtons();
  updateUI();
}

/* --------- BUTTONS --------- */

function buildWinnerButtons(){
  const wrap=document.getElementById("winnerButtons");
  wrap.innerHTML="";

  if(playStyle==="ffa"){
    players.forEach(p=>{
      wrap.innerHTML+=`<button onclick="playerWin('${p}')">${p}</button>`;
    });
  }else{
    wrap.innerHTML+=`
      <button onclick="teamWin('A')">Team A Wins</button>
      <button onclick="teamWin('B')">Team B Wins</button>`;
  }
}

/* --------- GAME LOGIC --------- */

function log(text){ history.push(`Hole ${hole}: ${text}`); }

function playerWin(p){
  const total=baseWager*(players.length-1)*carryCount;
  players.forEach(x=>{
    if(x===p) ledger[x]+=total;
    else ledger[x]-=baseWager*carryCount;
  });
  carryCount=1;
  log(p+" won");
  nextHole();
}

function teamWin(t){
  const winners=teams[t];
  const losers=teams[t==="A"?"B":"A"];

  losers.forEach(p=>ledger[p]-=baseWager*carryCount);
  winners.forEach(p=>ledger[p]+=baseWager*carryCount*losers.length/winners.length);

  carryCount=1;
  log("Team "+t+" won");
  nextHole();
}

function tieHole(){
  carryCount++;
  log("Tie");
  nextHole(false);
}

function nextHole(reset=true){
  if(hole>=holeLimit){
    showLeaderboard();
    return;
  }
  hole++;
  if(reset) carryCount=1;
  updateUI();
}

/* --------- UI --------- */

function updateUI(){
  document.getElementById("holeDisplay").textContent=`Hole ${hole} of ${holeLimit}`;
  document.getElementById("potDisplay").textContent=`$${baseWager*carryCount}/player`;

  const l=document.getElementById("ledger");
  l.innerHTML="";
  players.forEach(p=>{
    l.innerHTML+=`<div class="ledger-row"><span>${p}</span><span>$${ledger[p]}</span></div>`;
  });
}

/* --------- SIDE BET --------- */

function openSideBet(){
  const wrap=document.getElementById("sideWinners");
  wrap.innerHTML="";
  players.forEach(p=>{
    wrap.innerHTML+=`<button onclick="sideWin('${p}')">${p}</button>`;
  });
  document.getElementById("sideBetModal").classList.remove("hidden");
}

function sideWin(p){
  const amt=parseFloat(document.getElementById("sideAmount").value);
  players.forEach(x=>{
    if(x===p) ledger[x]+=amt*(players.length-1);
    else ledger[x]-=amt;
  });
  log(p+" side bet");
  closeModals();
  updateUI();
}

/* --------- MODALS --------- */

function openHistory(){
  document.getElementById("historyList").innerHTML=
    history.map(h=>`<div>${h}</div>`).join("")||"No holes yet";
  document.getElementById("historyModal").classList.remove("hidden");
}

function closeModals(){
  document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
}

/* --------- LEADERBOARD --------- */

function showLeaderboard(){
  document.getElementById("leaderboard").innerHTML=[...players]
    .sort((a,b)=>ledger[b]-ledger[a])
    .map(p=>`<div class="leader-row"><span>${p}</span><span>$${ledger[p]}</span></div>`)
    .join("");

  document.getElementById("leaderboardModal").classList.remove("hidden");
}

function finishGame(){
  location.reload();
}
