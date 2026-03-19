window.GameRouter = {

start(game){

currentGame = game;

const boxes = {
skins:"skinsBox",
vegas:"vegasBox",
nassau:"nassauBox",
wolf:"wolfBox",
baseball:"baseballBox"
};

Object.values(boxes).forEach(id=>{
document.getElementById(id)?.classList.add("hidden");
});

const box = boxes[game];
if(box) document.getElementById(box).classList.remove("hidden");

// Pass baseWager so engines like skins can set their base pot correctly
if(GAME_ENGINES[game]?.reset){
GAME_ENGINES[game].reset(baseWager);
}

if(GAME_UI[game]?.build){
GAME_UI[game].build({
players,
teams,
ledger,
baseWager
});
}

show("game-screen");

}

};
