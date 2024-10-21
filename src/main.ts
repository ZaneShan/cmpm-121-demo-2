import "./style.css";

const APP_NAME = "stickerSketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement('h1');
title.textContent = 'Sticker Sketchpad';
document.body.append(title);


    // CANVAS //

const canvasContainer = document.createElement('div');
canvasContainer.style.position = 'relative';
document.body.append(canvasContainer);

const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
canvas.id = "mainCanvas"
canvasContainer.append(canvas);

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
        this.x = x - ctx.measureText(this.emoji).width / 2; // center horizontally
        this.y = y + 10; // adjust vertical position if needed
    }
}
const availableStickers = ['😊', '❤️', '⭐']; // initial stickers

// dynamically create sticker buttons
function createStickerButtons() {
    availableStickers.forEach((emoji) => {
        // check if a button for this emoji already exists
        if (!document.querySelector(`button.stickerButton[data-emoji="${emoji}"]`)) {
            const button = document.createElement('button');
            button.textContent = emoji;
            button.classList.add('stickerButton');
            button.setAttribute('data-emoji', emoji); // set a data attribute to track the emoji
            stickerButtonContainer.append(button);
            button.addEventListener('click', () => setTool(emoji));
        }
    });
}

const lines: MarkerLine[] = []; // stack for lines
const redoLines: MarkerLine[] = []; // stack for redo operations
const stickers: Sticker[] = []; // stack for stickers
const redoStickers: Sticker[] = []; // stack for redo operations
let draggingPreview = false;


// start
canvas.addEventListener('mousedown', (event) => {
    if (selectedTool === null) return;
    isDrawing = true;
    redoLines.length = 0; // clear stored lines
    redoStickers.length = 0; // clear stored stickers

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
    stackPopper(lines, redoLines, canvas);
});

// redo button
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
document.body.appendChild(redoButton);  
// redo functionality
redoButton.addEventListener('click', () => {
    stackPopper(redoLines, lines, canvas);
});

// undo sticker button
const undoStickerButton = document.createElement('button');
undoStickerButton.textContent = 'Undo Sticker';
document.body.appendChild(undoStickerButton);
// undo functionality
undoStickerButton.addEventListener('click', () => {
    stackPopper(stickers, redoStickers, canvas);
});

// redo sticker button
const redoStickerButton = document.createElement('button');
redoStickerButton.textContent = 'Redo Sticker';
document.body.appendChild(redoStickerButton);  
// redo functionality
redoStickerButton.addEventListener('click', () => {
    stackPopper(redoStickers, stickers, canvas);
});

// stack popper helper
function stackPopper(fromStack: any[], toStack: any[], canvas: HTMLCanvasElement) {
    if (fromStack.length > 0) {
        const item = fromStack.pop(); //pop
        if (item) {
            toStack.push(item); // push
        }
        canvas.dispatchEvent(new CustomEvent('drawing-changed'));
    }
}

// Observer for the "drawing-changed" event
canvas.addEventListener('drawing-changed', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear
    // redraw all lines
    lines.forEach(line => line.display(ctx));
    stickers.forEach(sticker => sticker.draw(ctx));
    drawToolPreview()
});


    // TOOLS //

// tool button container
const toolButtonContainer = document.createElement('div');
toolButtonContainer.style.display = 'flex';
toolButtonContainer.style.justifyContent = 'space-between';
toolButtonContainer.style.padding = '10px';
canvasContainer.append(toolButtonContainer);

// sticker button container
const stickerButtonContainer = document.createElement('div');
stickerButtonContainer.style.display = 'flex';
stickerButtonContainer.style.justifyContent = 'space-between';
stickerButtonContainer.style.padding = '10px';
canvasContainer.append(stickerButtonContainer);

// line thickness buttons
const thinButton = document.createElement('button');
thinButton.textContent = '.';
toolButtonContainer.appendChild(thinButton);
thinButton.addEventListener('click', () => setTool('thin'));

const thickButton = document.createElement('button');
thickButton.textContent = 'o';
toolButtonContainer.appendChild(thickButton);
thickButton.addEventListener('click', () => setTool('thick'));

// Custom Sticker Button
const customStickerButton = document.createElement('button');
customStickerButton.textContent = 'Add Custom Sticker';
toolButtonContainer.append(customStickerButton);

customStickerButton.addEventListener('click', () => {
    const customEmoji = prompt("Enter custom sticker emoji", "😀");
    if (customEmoji) {
        availableStickers.push(customEmoji); // Add new sticker to availableStickers
        createStickerButtons(); // Regenerate buttons
        setTool(customEmoji); // Select the new sticker
    }
});

canvas.addEventListener('click', (event) => {
    if (selectedTool && selectedTool !== 'thin' && selectedTool !== 'thick') {
        // Create a new sticker and place it on the canvas
        const newSticker = new Sticker(
            selectedTool,
            event.offsetX - (ctx.measureText(selectedTool).width / 2),
            event.offsetY + 10
        );
        stickers.push(newSticker); // Add the sticker to the array
        canvas.dispatchEvent(new CustomEvent('drawing-changed')); // Trigger a redraw
    }
});

function setTool(tool: string) {
    selectedTool = tool;
    if (tool === 'thin') {
        lineWidth = 2;
    } else if (tool === 'thick') {
        lineWidth = 5;
    } else {
        lineWidth = 1; // Sticker selection
    }
    toolPreview = { thickness: lineWidth, x: canvas.width / 2, y: canvas.height / 2 }; // Set preview for tool
    updateToolSelection();
    canvas.dispatchEvent(new CustomEvent('drawing-changed'));
}

// helper to update button styles
function updateToolSelection() {
    thinButton.classList.toggle('selectedTool', selectedTool === 'thin');
    thickButton.classList.toggle('selectedTool', selectedTool === 'thick');
    document.querySelectorAll('.stickerButton').forEach((button) => {
        const emoji = button.textContent;
        button.classList.toggle('selectedTool', selectedTool === emoji);
    });
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
    if (toolPreview && selectedTool && ctx != null) {
        if (selectedTool === 'thin' || selectedTool === 'thick') {
            ctx.beginPath();
            ctx.arc(toolPreview.x, toolPreview.y, toolPreview.thickness / 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = toolPreview.thickness;
            ctx.stroke();
        } 
        // selected tool is sticker
        else {
            ctx.font = "30px 'Segoe UI Emoji'";
            ctx.fillText(selectedTool, toolPreview.x - ctx.measureText(selectedTool).width / 2, toolPreview.y + 10);
        }
    }
}

// export button
const exportButton = document.createElement('button');
exportButton.textContent = 'Export';
document.body.appendChild(exportButton);

// export button functionality
exportButton.addEventListener('click', () => {
    // create file name
    const filename = prompt("Enter filename for your sketch", "sticker_sketch") || "sticker_sketch";
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024; // Export canvas size
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext('2d');
    // throw error to quell exportCTX is null
    if (!exportCtx) {  
        throw new Error('Failed to get the export canvas context!');
    }
    exportCtx.scale(4, 4); // scale context

    // redraw existing items (lines and stickers)
    lines.forEach(line => {
        line.display(exportCtx);
    });
    stickers.forEach(sticker => sticker.draw(exportCtx));

    // trigger download of exported image
    exportCanvas.toBlob(blob => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${filename}.png`; // set the filename
            anchor.click(); // click the link to initiate download
        }
    }, 'image/png');
});

    // INITIALIZERS //

// set thin to default
let selectedTool = 'thin';
thinButton.classList.add('selectedTool');
toolPreview = { thickness: lineWidth, x: canvas.width / 4, y: canvas.height / 2 };

createStickerButtons()