//////////////////////////////////////////////////////////////////
//////         CANVAS        /////////////////////////////////////
//////////////////////////////////////////////////////////////////

const clear = document.getElementById("clear");
const signature = document.getElementById("signature");
const ctx = signature.getContext("2d");
const ctxWidth = 500;
const ctxHeight = 100;

ctx.strokeStyle = "black";
ctx.fillStyle = "white";

function sign(e) {
    let x = e.clientX - signature.offsetLeft;
    let y = e.clientY - signature.offsetTop;

    ctx.lineTo(x, y);
    ctx.stroke();
}

signature.addEventListener("mousedown", () => {
    ctx.beginPath();
    signature.addEventListener("mousemove", sign);
});

document.addEventListener("mouseup", () => {
    ctx.closePath();
    signature.removeEventListener("mousemove", sign);
    let data = signature.toDataURL();
    let signInput = document.getElementById("sign");
    signInput.value = data;
    console.log(data);
});

/////////////
/// CLEAR ///
/////////////

clear.addEventListener("click", () => {
    ctx.fillRect(0, 0, ctxWidth, ctxHeight);
});
