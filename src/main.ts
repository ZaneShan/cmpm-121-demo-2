import "./style.css";

const APP_NAME = "Zane";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement('h1');
title.textContent = 'title';
document.body.append(title);

// CANVAS //
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
canvas.id = "mainCanvas"
document.body.append(canvas);

// drawing styles
const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'black'; // Line color
ctx.lineWidth = 2; // Line width

let isDrawing = false; // check mousedown variable
// start
canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    ctx.moveTo(event.offsetX, event.offsetY);
});
// draw
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
});
// stop
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath(); // start a new path for next stroke
});

const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
document.body.append(clearButton);

// Clear the canvas when the button is clicked
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});