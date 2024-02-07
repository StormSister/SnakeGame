const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const backgroundBitmap = new Image("./images/dessert_01.png");
const snakeSpriteSheetBitmap = new Image("./images/snakes_20x20_02.png");
const fruitSpriteSheetBitmap = new Image("./images/fruits_01.png");

const fruitWidthHeight = 24;
const fruitRows = 4;
const fruitCols = 9;

const SNAKE_HEAD_R1 = 0;
const SNAKE_HEAD_R2 = 1;
const SNAKE_HEAD_R3 = 2;
const SNAKE_HEAD_L1 = 3;
const SNAKE_HEAD_L2 = 4;
const SNAKE_HEAD_L3 = 5;
const SNAKE_HEAD_U1 = 6;
const SNAKE_HEAD_U2 = 7;
const SNAKE_HEAD_U3 = 8;
const SNAKE_HEAD_D1 = 9;
const SNAKE_HEAD_D2 = 10;
const SNAKE_HEAD_D3 = 11;
const SNAKE_RL = 12;
const SNAKE_UD = 13;
const SNAKE_QUAD1 = 14;
const SNAKE_QUAD2 = 15;
const SNAKE_QUAD3 = 16;
const SNAKE_QUAD4 = 17;
const SNAKE_SET_NUM_ROWS = 4;

const snakesSprites = [
    { cx: 4, cy: 2 }, { cx: 5, cy: 2 }, { cx: 6, cy: 2 },
    { cx: 4, cy: 1 }, { cx: 5, cy: 1 }, { cx: 6, cy: 1 },
    { cx: 3, cy: 1 }, { cx: 3, cy: 2 }, { cx: 3, cy: 3 },
    { cx: 2, cy: 1 }, { cx: 2, cy: 2 }, { cx: 2, cy: 3 },
    { cx: 3, cy: 0 }, { cx: 2, cy: 0 },
    { cx: 1, cy: 0 }, { cx: 0, cy: 0 }, { cx: 0, cy: 1 }, { cx: 1, cy: 1 }
];

const bgMusic = new Audio("./sounds/MMix.mp3");
const eatFoodSound = new Audio("./sounds/ArcadePowerUp03.wav");
const dieSounds = [new Audio("./sounds/qubodup-PowerDrain.ogg"), new Audio("./sounds/vgdeathsound.wav")];
const levelUpSound = new Audio("./sounds/round_end.wav");

const blockSize = 20;
let direction = 'right';
let gameInterval;
let score = 0;
let snake = null;
let food = null;
let frameCounter = 0;
let level = 1;

const leftEdgeWidth = 2 * blockSize;
const rightEdgeWidth = 2 * blockSize;
const topEdgeHeight = 1 * blockSize;
const bottomEdgeHeight = 1 * blockSize;

function DrawBitmapFromSpriteSheet(cellX, cellY, borderWidth, spriteWidth, spriteHeight, spriteImageSheet, x, y) {
    var offsetX = (cellX + 1) * borderWidth + cellX * spriteWidth;
    var offsetY = (cellY + 1) * borderWidth + cellY * spriteHeight;

    ctx.drawImage(spriteImageSheet,
        offsetX, offsetY,
        spriteWidth, spriteHeight,
        Math.floor(x + 0.5), Math.floor(y + 0.5),
        spriteWidth, spriteHeight);
}

function startGame() {
    score = 0;
    frameCounter = 0;
    level = 1;

    let sx = blockSize * Math.floor((canvas.width / 2) / blockSize) - (4 * blockSize) + Math.floor(Math.random() * 9) * blockSize;
    let sy = blockSize * Math.floor((canvas.height / 2) / blockSize) - (4 * blockSize) + Math.floor(Math.random() * 9) * blockSize;
    const directions = ['right', 'left', 'up', 'down'];

    food = null;
    direction = directions[Math.floor(Math.random() * 5)];

    if (gameInterval) {
        clearInterval(gameInterval);
    }

    gameInterval = setInterval(gameLoop, 1000 / 5); // 10 FPS

    bgMusic.volume = 1.0;
    bgMusic.currentTime = 0;
    bgMusic.play();
    bgMusic.loop = true;
}

function gameLoop() {
    updateGameState();
    if (checkGameOver()) {
        bgMusic.volume = 0.5;
        bgMusic.loop = false;
        dieSounds[0].play();
        dieSounds[1].play();
        return gameOver();
    }
    drawGame();

    frameCounter++;
}

function updateGameState() {
    const head = { ...snake[0] };
    head.dir = direction;

    switch (direction) {
        case 'right':
            head.x += blockSize;
            head.frame = SNAKE_RL;
            break;
        case 'down':
            head.y += blockSize;
            head.frame = SNAKE_UD;
            break;
        case 'left':
            head.x -= blockSize;
            head.frame = SNAKE_RL;
            break;
        case 'up':
            head.y -= blockSize;
            head.frame = SNAKE_UD;
            break;
    }

    snake.unshift(head);

    if (food && food.x === head.x && food.y === head.y) {
        score += 10;
        var oldLevel = level;
        level = 1 + Math.floor(score / 100);

        if (level > oldLevel) {
            levelUpSound.volume = 0.5;
            levelUpSound.play();
        }

        food = null;
        eatFoodSound.play();
    } else {
        snake.pop();
    }

    if (!food) {
        food = {
            x: leftEdgeWidth + Math.floor(Math.random() * ((canvas.width - (leftEdgeWidth + rightEdgeWidth)) / blockSize)) * blockSize,
            y: topEdgeHeight + Math.floor(Math.random() * ((canvas.height - (topEdgeHeight + bottomEdgeHeight)) / blockSize)) * blockSize,
            cx: RandomRange(0, fruitCols - 1),
            cy: RandomRange(0, fruitRows - 1),
        };
    }
}

function RandomRange(min, max) {
    return (Math.floor(Math.random() * (max - min)) + min);
}

function checkGameOver() {
    const head = snake[0];
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return (head.x < leftEdgeWidth ||
        head.y < topEdgeHeight ||
        head.x >= canvas.width - rightEdgeWidth ||
        head.y >= canvas.height - bottomEdgeHeight);
}

function gameOver() {
    clearInterval(gameInterval);
}

function drawGame() {
    ctx.drawImage(backgroundBitmap, 0, 0, backgroundBitmap.width, backgroundBitmap.height);

    ctx.globalAlpha = 0.4;
    for (var block of snake) {
        DrawBitmapFromSpriteSheet(snakesSprites[block.frame].cx, snakesSprites[block.frame].cy + SNAKE_SET_NUM_ROWS * 3, 1,
            blockSize, blockSize,
            snakeSpriteSheetBitmap, block.x + 4, block.y + 4);
    }
    ctx.globalAlpha = 1;

    for (var block of snake) {
        DrawBitmapFromSpriteSheet(snakesSprites[block.frame].cx, snakesSprites[block.frame].cy + SNAKE_SET_NUM_ROWS * ((level - 1) % 3), 1,
            blockSize, blockSize,
            snakeSpriteSheetBitmap, block.x, block.y);
    }

    const dirToHeadFrame = [];
    dirToHeadFrame['right'] = SNAKE_HEAD_R1;
    dirToHeadFrame['left'] = SNAKE_HEAD_L1;
    dirToHeadFrame['up'] = SNAKE_HEAD_U1;
    dirToHeadFrame['down'] = SNAKE_HEAD_D1;

    var snakeFrame = dirToHeadFrame[direction] + (frameCounter % 3);

    ctx.globalAlpha = 0.4;
    DrawBitmapFromSpriteSheet(snakesSprites[snakeFrame].cx,
        snakesSprites[snakeFrame].cy + SNAKE_SET_NUM_ROWS * 3,
        1, 20, 20,
        snakeSpriteSheetBitmap, snake[0].x + 4, snake[0].y + 4);
    ctx.globalAlpha = 1;

    DrawBitmapFromSpriteSheet(snakesSprites[snakeFrame].cx,
        snakesSprites[snakeFrame].cy + SNAKE_SET_NUM_ROWS * ((level - 1) % 3),
        1, 20, 20,
        snakeSpriteSheetBitmap, snake[0].x, snake[0].y);

    if (food) {
        DrawBitmapFromSpriteSheet(food.cx, food.cy, 1,
            fruitWidthHeight, fruitWidthHeight,
            fruitSpriteSheetBitmap, food.x, food.y);
    }

    ctx.fillStyle = "#000000";
    ctx.font = "24px Fantasy";
    ctx.fillText("SCORE :  " + score, 16 + 2, 24 + 4);

    ctx.fillStyle = "#52B7FE";
    ctx.font = "24px Fantasy";
    ctx.fillText("SCORE :  " + score, 16, 24);

    ctx.fillStyle = "#000000";
    ctx.font = "24px Fantasy";
    ctx.fillText("LEVEL :  " + level, canvas.width - 140 + 2, 24 + 4);

    ctx.fillStyle = "#88FF13";
    ctx.font = "24px Fantasy";
    ctx.fillText("LEVEL :  " + level, canvas.width - 140, 24);
}

document.getElementById('startButton').addEventListener('click', startGame);

window.addEventListener('keydown', function (e) {
    const newDirection = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[e.keyCode];
    const allowedChange = { 'left': 'right', 'right': 'left', 'up': 'down', 'down': 'up' };

    if (newDirection && newDirection !== allowedChange[direction]) {
        direction = newDirection;
    }
    if (e.key == "Enter")
        startGame();
});