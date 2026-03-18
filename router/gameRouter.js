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

if(box){
document.getElementById(box).classList.remove("hidden");
}

/* build UI */

if(GAME_UI[game]?.build){
GAME_UI[game].build();
}

/* reset engine */

if(GAME_ENGINES[game]?.reset){
GAME_ENGINES[game].reset();
}

show("game-screen");

}

};