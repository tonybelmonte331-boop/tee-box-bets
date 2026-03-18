registerGameUI("wolf", {

build({ players, teams, ledger, baseWager }) {
console.log("WOLF BUILD RUNNING");
this.players = players;
this.ledger = ledger;
this.baseWager = baseWager;

this.renderWolfInfo();
this.renderChoices();

document.getElementById("wolfScores").classList.add("hidden");

},

renderWolfInfo() {

const wolfIndex = wolfGame.wolfIndex % this.players.length;
const wolf = this.players[wolfIndex];
const nextWolf = this.players[(wolfIndex + 1) % this.players.length];

const el = document.getElementById("wolfPlayer");

if(!el) return;

el.innerHTML = `
Wolf: <strong>${wolf}</strong><br>

<span style="font-size:12px;opacity:.85">
Next Wolf: ${nextWolf}
</span>

<br>

<span style="font-size:11px;opacity:.65">
Rotation: ${this.players.join(" → ")}
</span>
`;

},

renderChoices() {

const wolfIndex = wolfGame.wolfIndex % this.players.length;
const wolf = this.players[wolfIndex];

const box = document.getElementById("wolfChoices");
box.innerHTML = "";

this.players
.filter(p => p !== wolf)
.forEach(p => {

const btn = document.createElement("button");
btn.textContent = "Partner: " + p;

btn.onclick = () => {
wolfGame.choosePartner(p);
this.renderScoreInputs();
};

box.appendChild(btn);

});

const lone = document.createElement("button");
lone.textContent = "Lone Wolf (2x)";

lone.onclick = () => {
wolfGame.chooseLone();
this.renderScoreInputs();
};

box.appendChild(lone);

},

renderScoreInputs() {

const box = document.getElementById("wolfScores");
box.classList.remove("hidden");
box.innerHTML = "";

this.players.forEach(p => {

const row = document.createElement("div");

row.innerHTML = `
<input
class="score-input"
inputmode="numeric"
type="number"
placeholder="${p}"
id="wolf_${p}"
>
`;

box.appendChild(row);

});

const btn = document.createElement("button");
btn.textContent = "Finish Hole";

btn.onclick = () => this.finishHole();

box.appendChild(btn);

},

finishHole() {

saveState();

const scores = {};

this.players.forEach(p => {
scores[p] = +document.getElementById(`wolf_${p}`).value || 0;
});

// 🔥 ALWAYS USE GLOBAL LEDGER (NOT STALE REFERENCE)
GAME_ENGINES.wolf.resolve(
scores,
players,
baseWager,
ledger
);

// 🔥 FORCE UI TO REBIND AFTER RESOLVE
this.players = players;
this.ledger = ledger;

document.getElementById("wolfScores").classList.add("hidden");

nextHole();

},

onHoleChange() {

this.renderWolfInfo();
this.renderChoices();

document.getElementById("wolfScores").classList.add("hidden");

},

update() {
// nothing needed here yet
}

});