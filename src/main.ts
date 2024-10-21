import "./style.css";

const APP_NAME = "stickerSketchpad";
//const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

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

// get context
const ctx = canvas.getContext('2d');
// ctx check to quell null error
if (!ctx) {
    throw new Error('Failed to get the canvas context!');
}

type ToolPreview = {
    thickness: number;
    x: number;
    y: number;
}; // preview object
let toolPreview: ToolPreview | null = null;

class MarkerLine {
    points: { x: number; y: number }[];
    thickness: number;
    color: string;

    constructor(x1: number, y1: number, thickness: number, color: string) {
        this.points = [{ x: x1, y: y1 }]; // initial marker position
        this.thickness = thickness; // set thickness
        this.color = color;
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

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.stroke();
    }
}

// color palette buttons
const colors = ['black', 'red', 'green', 'blue', 'purple'];
let selectedColor = 'black'; // default

const colorContainer = document.createElement('div');
colorContainer.style.display = 'flex'; // arrange colors side by side
colorContainer.style.gap = '10px'; // add spacing

colors.forEach(color => {
    const colorButton = document.createElement('button');
    colorButton.style.backgroundColor = color;
    colorButton.style.width = '30px';
    colorButton.style.height = '30px';
    colorButton.addEventListener('click', () => setColor(color));
    colorContainer.appendChild(colorButton);
});
document.body.appendChild(colorContainer);

// set color helper
function setColor(color: string) {
    selectedColor = color;
}

// create slider
const slider = document.createElement('input');
slider.type = 'range';
slider.min = '0';
slider.max = '360';
slider.value = '0';
slider.style.width = '200px'; // width of slider
document.body.appendChild(slider);

// label for slider
const sliderLabel = document.createElement('label');
sliderLabel.textContent = 'Adjust color hue:';
document.body.appendChild(sliderLabel);
let sliderValue = 0;

slider.addEventListener('input', (event) => {
    sliderValue = parseInt(slider.value);
    const hue = sliderValue;
    selectedColor = `hsl(${hue}, 100%, 50%)`; // set the marker color using hue
});

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

let isDrawing = false; // check mousedown variable
let lineWidth = 2; // default line width
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
        const newLine = new MarkerLine(event.offsetX, event.offsetY, lineWidth, selectedColor); // Use selected color
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
        canvas.dispatchEvent(new CustomEvent('drawing-changed'));
    }
    else if (toolPreview) {
        // update tool preview position
        toolPreview.x = event.offsetX;
        toolPreview.y = event.offsetY;
        canvas.dispatchEvent(new CustomEvent('drawing-changed'));
    }
});
// stop
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    draggingPreview = false;
});

const undoContainer = document.createElement('div');
undoContainer.style.display = 'flex';
undoContainer.style.gap = '10px';
undoContainer.style.justifyContent = 'space-between';
undoContainer.style.padding = '10px';
document.body.appendChild(undoContainer);

// undo button
const undoButton = document.createElement('button');
undoButton.textContent = 'Undo';
undoContainer.appendChild(undoButton);
// undo functionality
undoButton.addEventListener('click', () => {
    stackPopper(lines, redoLines, canvas);
});

// undo sticker button
const undoStickerButton = document.createElement('button');
undoStickerButton.textContent = 'Undo Sticker';
undoContainer.appendChild(undoStickerButton);
// undo functionality
undoStickerButton.addEventListener('click', () => {
    stackPopper(stickers, redoStickers, canvas);
});

const redoContainer = document.createElement('div');
redoContainer.style.display = 'flex';
redoContainer.style.gap = '10px';
redoContainer.style.justifyContent = 'space-between';
redoContainer.style.padding = '10px';
document.body.appendChild(redoContainer);

// redo button
const redoButton = document.createElement('button');
redoButton.textContent = 'Redo';
redoContainer.appendChild(redoButton);  
// redo functionality
redoButton.addEventListener('click', () => {
    stackPopper(redoLines, lines, canvas);
});

// redo sticker button
const redoStickerButton = document.createElement('button');
redoStickerButton.textContent = 'Redo Sticker';
redoContainer.appendChild(redoStickerButton);  
// redo functionality
redoStickerButton.addEventListener('click', () => {
    stackPopper(redoStickers, stickers, canvas);
});

// clear button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear';
clearButton.style.display = 'flex';
clearButton.style.gap = '10px';
clearButton.style.justifyContent = 'space-between';
clearButton.style.padding = '10px';
document.body.append(clearButton);
// clear functionality
clearButton.addEventListener('click', () => {
    lines.length = 0; // clear stored lines
    stickers.length = 0; // clear stickers
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
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
        lineWidth = 1;
    } else if (tool === 'thick') {
        lineWidth = 4;
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

// preview helper function
function drawToolPreview() {
    if (toolPreview && selectedTool && ctx != null) {
        if (selectedTool === 'thin' || selectedTool === 'thick') {
            ctx.beginPath();
            ctx.arc(toolPreview.x, toolPreview.y, toolPreview.thickness / 2, 0, Math.PI * 2);
            ctx.strokeStyle = selectedColor;
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

// styling for export
exportButton.style.position = 'fixed'; // Fixed positioning relative to the viewport
exportButton.style.bottom = '20px'; // 20px from the bottom of the window
exportButton.style.right = '20px'; // 20px from the right edge
exportButton.style.padding = '10px 20px'; // Padding for the button
exportButton.style.zIndex = '1000'; // Ensure it stays on top of other elements

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