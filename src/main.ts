import "./style.css";

const APP_NAME = "Zane";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const title = document.createElement('h1');
title.textContent = 'title';
document.body.append(title);

const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
canvas.id = "mainCanvas"
document.body.append(canvas);