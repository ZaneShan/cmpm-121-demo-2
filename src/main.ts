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
type ToolPreview = {
    thickness: number;
    x: number;
    y: number;
}; // preview object
let toolPreview: ToolPreview | null = null;

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

class Sticker {
    emoji: string;
    x: number;
    y: number;

    constructor(emoji: string, x: number, y: number) {
        this.emoji = emoji;
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "30px 'Segoe UI Emoji'";
        ctx.fillText(this.emoji, this.x, this.y);
    }

    drag(ctx: CanvasRenderingContext2D, x: number, y: number) {
        this.x = x - ctx.measureText(this.emoji).width / 2; // Center horizontally
        this.y = y + 10; // Adjust vertical position if needed
    }
}

const lines: MarkerLine[] = []; // number = array of array of array
const redoStack: MarkerLine[] = []; // stack for redo operations
const stickers: Sticker[] = []; // stack for redo operations
let draggingPreview = false;


// start
canvas.addEventListener('mousedown', (event) => {
    if (selectedTool === null) return;
    isDrawing = true;
    redoStack.length = 0; // clear stored lines

    if (toolPreview && 
        event.offsetX >= toolPreview.x - (ctx.measureText(selectedTool).width / 2) &&
        event.offsetX <= toolPreview.x + (ctx.measureText(selectedTool).width / 2) &&
        event.offsetY >= toolPreview.y - 30 && // adjust based on font size
        event.offsetY <= toolPreview.y
    ) {
        draggingPreview = true; // Start dragging the preview
    }

    if (selectedTool === 'thin' || selectedTool === 'thick') {
        const newLine = new MarkerLine(event.offsetX, event.offsetY, lineWidth);
        lines.push(newLine);
    }
});
// draw
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing && (selectedTool === 'thin' || selectedTool === 'thick')) {
        const currentLine = lines[lines.length - 1];
        currentLine.drag(event.offsetX, event.offsetY);
        
        canvas.dispatchEvent(new CustomEvent('drawing-changed'));
    } 
    else if (draggingPreview && toolPreview) {
        toolPreview.x = event.offsetX;
        toolPreview.y = event.offsetY;
        canvas.dispatchEvent(new CustomEvent('tool-moved'));
    }
    else if (toolPreview) {
        // update tool preview position
        toolPreview.x = event.offsetX;
        toolPreview.y = event.offsetY;
        canvas.dispatchEvent(new CustomEvent('tool-moved'));
    }
});
// stop
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    draggingPreview = false;
});


// clear button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
document.body.append(clearButton);

// clear functionality
clearButton.addEventListener('click', () => {
    lines.length = 0; // clear stored lines
    stickers.length = 0; // clear stickers
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

// Observer for the "drawing-changed" event
canvas.addEventListener('drawing-changed', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear

    // redraw all lines
    for (const line of lines) {
        line.display(ctx);
    }
    for (const sticker of stickers) {
        sticker.draw(ctx); // Draw all stickers
    }
    if (toolPreview) {
        drawToolPreview()
    }
});


// TOOLS //

// line thickness buttons
const thinButton = document.createElement('button');
thinButton.textContent = '.';
document.body.append(thinButton);
const thickButton = document.createElement('button');
thickButton.textContent = 'o';
document.body.append(thickButton);

// sticker buttons
const smileyButton = document.createElement('button');
smileyButton.textContent = '😊';
document.body.append(smileyButton);
const heartButton = document.createElement('button');
heartButton.textContent = '❤️';
document.body.append(heartButton);
const starButton = document.createElement('button');
starButton.textContent = '⭐';
document.body.append(starButton);

// sticker click functionality
canvas.addEventListener('click', (event) => {
    if (selectedTool && selectedTool != 'thin' && selectedTool != 'thick') {
        const newSticker = new Sticker(selectedTool, event.offsetX - (ctx.measureText(selectedTool).width / 2), event.offsetY + 10);
        stickers.push(newSticker);
        canvas.dispatchEvent(new CustomEvent('drawing-changed'));
    }
});

// set thin to default
let selectedTool = 'thin';
thinButton.classList.add('selectedTool');
toolPreview = { thickness: lineWidth, x: canvas.width / 4, y: canvas.height / 2 };

// tool button functionality
thinButton.addEventListener('click', () => setTool('thin'));
thickButton.addEventListener('click', () => setTool('thick'));
smileyButton.addEventListener('click', () => setTool('😊'));
heartButton.addEventListener('click', () => setTool('❤️'));
starButton.addEventListener('click', () => setTool('⭐'));

function setTool(type: 'thin' | 'thick' | '😊' | '❤️' | '⭐') {
    selectedTool = type;
    // set width
    switch(selectedTool) {
        case 'thin':
            lineWidth = 2
            break;
        case 'thick':
            lineWidth = 5
            break;
        default:
            lineWidth = 1 // default are stickers
    }
    updateToolSelection();
    // redraw to show updated preview
    canvas.dispatchEvent(new CustomEvent('drawing-changed'));
}

// helper to update button styles
function updateToolSelection() {
    thinButton.classList.toggle('selectedTool', selectedTool === 'thin');
    thickButton.classList.toggle('selectedTool', selectedTool === 'thick');
    smileyButton.classList.toggle('selectedTool', selectedTool === 'sticker-smiley');
    heartButton.classList.toggle('selectedTool', selectedTool === 'sticker-heart');
    starButton.classList.toggle('selectedTool', selectedTool === 'sticker-star');
}

// tool-moved event
canvas.addEventListener('tool-moved', () => {
    // redraw tool preview
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
        line.display(ctx);
    }
    for (const sticker of stickers) {
        sticker.draw(ctx);
    }
    drawToolPreview()
});

// preview helper function
function drawToolPreview() {
    if (toolPreview && ctx) {
        //if current tool is pen
        if (selectedTool === 'thin' || selectedTool === 'thick') {
            ctx.beginPath();
            ctx.arc(toolPreview.x, toolPreview.y, toolPreview.thickness / 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = toolPreview.thickness;
            ctx.stroke();
        }
        // if current tool is sticker
        else {
            ctx.save();
            ctx.translate(toolPreview.x, toolPreview.y); // move to the preview position

            ctx.font = "30px 'Segoe UI Emoji'";
            ctx.fillText(selectedTool, -ctx.measureText(selectedTool).width / 2, 10); // center sticker
            
            ctx.restore();
        }
    }
}