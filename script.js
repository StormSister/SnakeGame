const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

var backgroundBitmap = new Image();
backgroundBitmap.src = "./images/dessert_01.png";

var snakeSpriteSheetBitmap = new Image();
snakeSpriteSheetBitmap.src = "./images/snakes_20x20_02.png";

// ladowanie owocow
var fruitSpriteSheetBitmap = new Image();
fruitSpriteSheetBitmap.src = "./images/fruits_01.png";
const fruitWidthHeight = 24;
const fruitRows = 4;
const fruitCols = 9;

// ramki bitmap
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


var snakesSprites =
    [
        { cx: 4, cy: 2 }, // SNAKE_HEAD_R1 = 0;
        { cx: 5, cy: 2 }, //SNAKE_HEAD_R2 = 1;
        { cx: 6, cy: 2 }, //SNAKE_HEAD_R3 = 2;

        { cx: 4, cy: 1 }, //SNAKE_HEAD_L1 = 3;
        { cx: 5, cy: 1 }, //SNAKE_HEAD_L2 = 4;
        { cx: 6, cy: 1 }, //SNAKE_HEAD_L3 = 5;

        { cx: 3, cy: 1 }, //SNAKE_HEAD_U1 = 6;
        { cx: 3, cy: 2 }, //SNAKE_HEAD_U2 = 7;
        { cx: 3, cy: 3 }, //SNAKE_HEAD_U3 = 8;

        { cx: 2, cy: 1 }, //SNAKE_HEAD_D1 = 9;
        { cx: 2, cy: 2 }, //SNAKE_HEAD_D2 = 10;
        { cx: 2, cy: 3 }, //SNAKE_HEAD_D3 = 11;

        { cx: 3, cy: 0 }, //SNAKE_RL = 12;
        { cx: 2, cy: 0 }, //SNAKE_UD = 13;

        { cx: 1, cy: 0 }, //SNAKE_QUAD1 = 14;
        { cx: 0, cy: 0 }, //SNAKE_QUAD2 = 15;
        { cx: 0, cy: 1 }, //SNAKE_QUAD3 = 16;
        { cx: 1, cy: 1 }, //SNAKE_QUAD4 = 17;
    ];


var bgMusic = new Audio();
bgMusic.src = "./sounds/MMix.mp3";

var eatFoodSound = new Audio();
eatFoodSound.src = "./sounds/ArcadePowerUp03.wav";

var dieSounds = [new Audio(), new Audio()];
dieSounds[0].src = "./sounds/qubodup-PowerDrain.ogg";
dieSounds[1].src = "./sounds/vgdeathsound.wav";

var levelUpSound = new Audio();
levelUpSound.src = "./sounds/round_end.wav";


// zmienne globalne
const blockSize = 20;
let direction = 'right';
let gameInterval;
let score = 0;
let snake = null;
let food = null;
let frameCounter = 0;
let level = 1;

// szerokosc ramki ( odpowiada rysunkowi tła)
const leftEdgeWidth = 2 * blockSize;
const rightEdgeWidth = 2 * blockSize;
const topEdgeHeight = 1 * blockSize;
const bottomEdgeHeight = 1 * blockSize;


function DrawBitmapFromSpriteSheet(cellX, cellY,
    borderWidth,
    spriteWidth, spriteHeight,
    spriteImageSheet, x, y) {
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
    
    // pozycja startowa w odl. 4 pol od srodka
    let sx = blockSize * Math.floor((canvas.width / 2) / blockSize) - (4 * blockSize) + Math.floor(Math.random() * 9) * blockSize;
    let sy = blockSize * Math.floor((canvas.height / 2) / blockSize) - (4 * blockSize) + Math.floor(Math.random() * 9) * blockSize;
    const directions = ['right', 'left', 'up', 'down'];
    food = null;

    // losowy kierunek ruchu na start
    direction = directions[Math.floor(Math.random() * 4)];

    if (direction == 'right' || direction == 'left')
        snake = [{ x: sx, y: sy, dir: direction, frame: SNAKE_RL}];
    else // must be up and down
        snake = [{ x: sx, y: sy, dir: direction, frame: SNAKE_UD}];
    
    if (gameInterval) {
        clearInterval(gameInterval);
    }

    gameInterval = setInterval(gameLoop, 100);

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
    head.dir = direction; // nowy kierunek głowy
    
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

    // czy gracz zmienil kierunek ruchu:
    // L->U, L->D
    // R->U, R->D,
    // U->R, U->L
    // D->R, D->L
    if ( (snake[0].dir == 'up' && head.dir == 'right') || (snake[0].dir == 'left' && head.dir == 'down') ) 
        snake[0].frame = SNAKE_QUAD2;
    else
    if ( (snake[0].dir == 'down' && head.dir == 'right') || (snake[0].dir == 'left' && head.dir == 'up') ) 
        snake[0].frame = SNAKE_QUAD3;
    else
    if ( (snake[0].dir == 'up' && head.dir == 'left') || (snake[0].dir == 'right' && head.dir == 'down') ) 
        snake[0].frame = SNAKE_QUAD1;
    else
    if ( (snake[0].dir == 'right' && head.dir == 'up') || (snake[0].dir == 'down' && head.dir == 'left') ) 
        snake[0].frame = SNAKE_QUAD4;

    snake.unshift(head);

    if (food && food.x === head.x && food.y === head.y) {
        score += 10;
        var oldLevel = level;
        level = 1 + Math.floor( score / 100 );

        if (level > oldLevel)
            {
            levelUpSound.volume = 0.5;
            levelUpSound.play();
            }
        
        food = null;
        eatFoodSound.play();
    } else {
        snake.pop(); // jesli nie zjadl jedzenia to usuwamy ostatni fragment weza
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
    return (Math.floor(Math.random() * (max - min) ) + min);
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

    // rysuje cien jako trojkaty
    //ctx.globalAlpha = 0.25;
    //ctx.fillStyle = "#000000";
    //snake.forEach(block => drawBlock(block.x , block.y + 4));
    //ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.4;
    for (var block of snake)
        {
        DrawBitmapFromSpriteSheet(snakesSprites[ block.frame ].cx, snakesSprites[ block.frame ].cy + SNAKE_SET_NUM_ROWS*3, 1, 
                                  blockSize, blockSize,
                                  snakeSpriteSheetBitmap, block.x+4, block.y+4);
        }
    ctx.globalAlpha = 1;

    for (var block of snake)
        {
        DrawBitmapFromSpriteSheet(snakesSprites[ block.frame ].cx, snakesSprites[ block.frame ].cy + SNAKE_SET_NUM_ROWS*((level-1)%3), 1, 
                                  blockSize, blockSize,
                                  snakeSpriteSheetBitmap, block.x, block.y);
        }

    const dirToHeadFrame = [];
    dirToHeadFrame['right'] = SNAKE_HEAD_R1;
    dirToHeadFrame['left'] = SNAKE_HEAD_L1;
    dirToHeadFrame['up'] = SNAKE_HEAD_U1;
    dirToHeadFrame['down'] = SNAKE_HEAD_D1;

    var snakeFrame = dirToHeadFrame[ direction ] + (frameCounter % 3);

    ctx.globalAlpha = 0.4;
    DrawBitmapFromSpriteSheet(snakesSprites[ snakeFrame ].cx, 
                          snakesSprites[ snakeFrame ].cy  + SNAKE_SET_NUM_ROWS*3, 
                          1,20,20,
                          snakeSpriteSheetBitmap, snake[0].x + 4, snake[0].y + 4);
    ctx.globalAlpha = 1;
    
    // draw bitmap
    DrawBitmapFromSpriteSheet(snakesSprites[ snakeFrame ].cx, 
                          snakesSprites[ snakeFrame ].cy  + SNAKE_SET_NUM_ROWS*((level-1)%3), 
                          1,20,20,
                          snakeSpriteSheetBitmap, snake[0].x, snake[0].y);

    if (food) {
        //ctx.fillStyle = 'red';
        //drawBlock(food.x, food.y);
        DrawBitmapFromSpriteSheet(food.cx, food.cy, 1, 
                                  fruitWidthHeight, fruitWidthHeight, 
                                  fruitSpriteSheetBitmap, food.x, food.y);

    }
    //document.getElementById('scoreDiv').innerText = 'Score: ' + score;

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

function drawBlock(x, y) {
    ctx.fillRect(x, y, blockSize, blockSize);
}

document.getElementById('startButton').addEventListener('click', startGame);

window.addEventListener('keydown', function(e) {
    const newDirection = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[e.keyCode];
    const allowedChange = { 'left': 'right', 'right': 'left', 'up': 'down', 'down': 'up' };

    if (newDirection && newDirection !== allowedChange[direction]) {
        direction = newDirection;
    }
    if (e.key == "Enter")
        startGame();
});
