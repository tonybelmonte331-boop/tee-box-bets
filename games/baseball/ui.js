const baseballUI = {

build(){

document.getElementById("baseballAwayScore1").value="";
document.getElementById("baseballHomeScore1").value="";

},

update(){

const inning=Math.ceil(hole/2);
const isTop=hole%2===1;

const txt=(isTop?"Top":"Bottom")+" of "+inning;

const el=document.getElementById("baseballInning");

if(el) el.textContent=txt;

}

};

registerGameUI("baseball", baseballUI);