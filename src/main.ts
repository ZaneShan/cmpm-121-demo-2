import "./style.css";

const APP_NAME = "Zane Shan";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement('h1');
title.textContent = 'Sticker Sketchpad';
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
let lineWidth = 2; // default line width

class MarkerLine {
    points: { x: number; y: number }[];
    thickness: number;

    constructor(x1: number, y1: number, thickness: number) {
        this.points = [{ x: x1, y: y1 }]; // initial marker position
        this.thickness = thickness; // set thickness
    }

    drag(x: number, y: number): void {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (const point of this.points) {
            ctx.lineTo(point.x, point.y);
        }

        // STYLE //
        ctx.strokeStyle = 'black';
        ctx.lineWidth = this.thickness; // current thickness
        //       //

        ctx.stroke();
    }
}

const lines: MarkerLine[] = []; // number = array of array of array
const redoStack: MarkerLine[] = []; // stack for redo operations

// start
canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    redoStack.length = 0; // clear stored lines
    const newLine = new MarkerLine(event.offsetX, event.offsetY, lineWidth);
    lines.push(newLine);
});
// draw
canvas.addEventListener('mousemove', (event) => {
    if (!isDrawing) return;
    const currentLine = lines[lines.length - 1];
    currentLine.drag(event.offsetX, event.offsetY);
    
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

// undo functionality
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

// redo functionality
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

// tool buttons
const thinButton = document.createElement('button');
thinButton.textContent = '.';
document.body.append(thinButton);

const thickButton = document.createElement('button');
thickButton.textContent = 'o';
document.body.append(thickButton);

// set thing to default
let selectedTool = 'thin';
thinButton.classList.add('selectedTool');

// tool button functionality
thinButton.addEventListener('click', () => {
    selectedTool = 'thin';
    lineWidth = 2; // Set thin width
    updateToolSelection();
});

thickButton.addEventListener('click', () => {
    selectedTool = 'thick';
    lineWidth = 5; // Set thick width
    updateToolSelection();
});

// helper to update button styles
function updateToolSelection() {
    thinButton.classList.toggle('selectedTool', selectedTool === 'thin');
    thickButton.classList.toggle('selectedTool', selectedTool === 'thick');
}

// Observer for the "drawing-changed" event
canvas.addEventListener('drawing-changed', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear

    // redraw all lines
    for (const line of lines) {
        line.display(ctx);
    }
});