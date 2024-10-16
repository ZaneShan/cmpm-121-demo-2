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
// ctx check to quell null error
if (!ctx) {
    throw new Error('Failed to get the canvas context!');
}

let isDrawing = false; // check mousedown variable
const lines: number[][][] = []; // number = array of array of array
const redoStack: number[][][] = []; // stack for redo operations
// start
canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    redoStack.length = 0; // clear stored lines
    const newLine: number[][] = [[event.offsetX, event.offsetY]];
    lines.push(newLine);
});
// draw
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    const currentLine = lines[lines.length - 1];
    currentLine.push([event.offsetX, event.offsetY]);
    
    // dispatch drawing-changed event
    canvas.dispatchEvent(new CustomEvent('drawing-changed'));
});
// stop
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});


// clear button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
document.body.append(clearButton);

// clear functionality
clearButton.addEventListener('click', () => {
    lines.length = 0; // clear stored lines
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
});

// undo button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
document.body.appendChild(undoButton);

// Undo functionality
undoButton.addEventListener('click', () => {
    if (lines.length > 0) {
        const lastLine = lines.pop(); // remove the last line
        if (lastLine) {
            redoStack.push(lastLine); // add to redo stack
        }
        // dispatch drawing-changed event
        const drawingChangedEvent = new CustomEvent('drawing-changed');
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

// redo button
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
document.body.appendChild(redoButton);

// Redo functionality
redoButton.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const lineToRedo = redoStack.pop(); // get last undone line
        if (lineToRedo) {
            lines.push(lineToRedo); // add to lines
        }
        // dispatch drawing-changed event
        const drawingChangedEvent = new CustomEvent('drawing-changed');
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

// Observer for the "drawing-changed" event
canvas.addEventListener('drawing-changed', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear
    // line style
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // redraw all lines
    for (const line of lines) {
        ctx.beginPath();
        ctx.moveTo(line[0][0], line[0][1]); // move to first point
        for (const point of line) {
            ctx.lineTo(point[0], point[1]); // draw to each point
        }
        ctx.stroke();
    }
});