document.addEventListener('DOMContentLoaded', function () {
    // disable scrolling and zooming
    document.documentElement.addEventListener('touchmove', function (event) {
        event.preventDefault();
    }, {
        passive: false
    });

    // disable zooming
    document.documentElement.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
});

const game = document.getElementById('game');
let blueBox = document.getElementById('blue-box');
const spawnBtn = document.getElementById('spawn-btn');
const shootBtn = document.getElementById('shoot-btn')
const killCounter = document.getElementById('Kills')
const highScore = document.getElementById('high-score')
let isMoving = false;

setInterval(function() {
    if (kills > highscore) {
        highscore = kills
        highScore.textContent = `High Score: ${highscore}`
    }

    localStorage.setItem('high-score', highscore)
    const high = localStorage.getItem('high-score')

    highScore.textContent = `High Score: ${high}`
}, 10)


let prevPosition = blueBox.getBoundingClientRect().left;

function spawnBlueBox() {
    // Create a new blue box element
    const newBlueBox = document.createElement('div');
    newBlueBox.classList.add('blue-box');
    game.appendChild(newBlueBox);

    // Set the initial position and direction of the blue box
    newBlueBox.style.top = `500px`;
    newBlueBox.style.left = `350px`;
    blueBoxDirection = 'right';

    // Update the blueBox variable to reference the new blue box element
    blueBox = newBlueBox;
}

function detectMovement() {
    requestAnimationFrame(detectMovement);

    const currentPosition = blueBox.getBoundingClientRect().left;

    if (currentPosition < prevPosition) {
        blueBoxDirection = "left"
    } else if (currentPosition > prevPosition) {
        blueBoxDirection = "right"
    }

    prevPosition = currentPosition;
}

detectMovement();

let blueBoxDirection = "right";
let kills = 0;
let highscore = 0;

shootBtn.addEventListener('click', () => {

    const bulletSound = document.getElementById('gunshot');

    bulletSound.currentTime = 0
    bulletSound.play();
    // Create a bullet element
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    game.appendChild(bullet);

    // Set the initial position of the bullet at the center of the blue box
    const blueBoxRect = blueBox.getBoundingClientRect();
    const bulletX = blueBoxRect.left + blueBoxRect.width / 2;
    const bulletY = blueBoxRect.top + blueBoxRect.height / 2;
    bullet.style.left = `${bulletX}px`;
    bullet.style.top = `${bulletY}px`;

    // Set the velocity of the bullet based on the direction of the blue box
    const boxCenterX = blueBoxRect.left + blueBoxRect.width / 2;
    const boxCenterY = blueBoxRect.top + blueBoxRect.height / 2;
    const angle = Math.atan2(boxCenterY - bulletY, boxCenterX - bulletX);
    const angleInDegrees = angle * 180 / Math.PI;
    const velocity = 10;
    let velocityX = velocity * Math.cos(angleInDegrees * Math.PI / 180);
    const velocityY = velocity * Math.sin(angleInDegrees * Math.PI / 180);

    // Check the direction of the blue box and invert the velocityX if it's facing left
    if (blueBoxDirection === 'left') {
        velocityX = -velocityX;
    }

    // Move the bullet in a straight line
    const intervalId = setInterval(() => {
        // Move the bullet by updating its position
        bullet.style.left = `${parseFloat(bullet.style.left) + velocityX}px`;
        bullet.style.top = `${parseFloat(bullet.style.top) + velocityY}px`;

        // Check for collisions with red boxes
        const redBoxes = document.querySelectorAll('.red-box');
        for (let i = 0; i < redBoxes.length; i++) {
            const redBox = redBoxes[i];
            if (checkCollision(bullet, redBox)) {
                // Remove the red box and the bullet
                redBoxPositions.splice(i, 1);
                game.removeChild(redBox);
                game.removeChild(bullet);
                kills++
                killCounter.textContent = `Kills: ${kills}`;
                clearInterval(intervalId);
                return;
            }
        }

        // Check if the bullet is outside the game area
        if (bulletX < 0 || bulletX > game.offsetWidth || bulletY < 0 || bulletY > game.offsetHeight) {
            game.removeChild(bullet);
            clearInterval(intervalId);
        }
    },
        20);
});


const redBoxPositions = [];

spawnBtn.addEventListener('click', () => {
    let redBox = document.createElement('div');
    const spawnSound = document.getElementById('spawn')
    spawnSound.currentTime = 0
    spawnSound.play()
    redBox.classList.add('red-box');

    let overlap = true;
    while (overlap) {
        overlap = false;
        redBox.style.top = `${Math.floor(Math.random() * (game.offsetHeight - 50))}px`;
        redBox.style.left = `${Math.floor(Math.random() * (game.offsetWidth - 50))}px`;

        // Check for collisions with existing red boxes by comparing positions
        for (let i = 0; i < redBoxPositions.length; i++) {
            const existingPosition = redBoxPositions[i];
            const distance = Math.sqrt(Math.pow(existingPosition.top - parseInt(redBox.style.top), 2) +
                Math.pow(existingPosition.left - parseInt(redBox.style.left), 2));
            if (distance < 50) {
                overlap = true;
                break;
            }
        }
    }
    // Add the position of the new red box to the array
    redBoxPositions.push({
        top: parseInt(redBox.style.top),
        left: parseInt(redBox.style.left)
    });

    game.appendChild(redBox);

    let gameOver = false;
    const intervalId = setInterval(() => {
        if (checkCollision(blueBox, redBox)) {
            const deathSound = document.getElementById('death')
            deathSound.currentTime = 0.5
            deathSound.play()

            game.removeChild(blueBox)
            game.removeChild(redBox)
            // Remove the position of the red box from the array
            const index = redBoxPositions.findIndex(position => position.top === parseInt(redBox.style.top) &&
                position.left === parseInt(redBox.style.left));
            redBoxPositions.splice(index, 1);
            if (!gameOver) {
                let tryAgainBtn = document.createElement('button');
                tryAgainBtn.textContent = 'Try Again';
                tryAgainBtn.classList.add('try-again-btn');
                tryAgainBtn.style.borderRadius = '5px';
                game.appendChild(tryAgainBtn);
                tryAgainBtn.addEventListener('click', () => {
                    game.removeChild(tryAgainBtn);
                    spawnBlueBox();
                });
                killCounter.textContent = 'Kills: 0';

                gameOver = true;
                clearInterval(intervalId);
            }
        }
    },
        100);
});

// Handle touch events for mobile controls
document.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const touchX = touch.clientX - game.offsetLeft;
    const touchY = touch.clientY - game.offsetTop;
    handleTouch(touchX,
        touchY);
});

document.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    const touchX = touch.clientX - game.offsetLeft;
    const touchY = touch.clientY - game.offsetTop;
    handleTouch(touchX,
        touchY);
});

document.addEventListener('touchend', () => {
    isMoving = false;
});

function handleTouch(touchX, touchY) {
    if (
        touchX >= spawnBtn.offsetLeft &&
        touchX <= spawnBtn.offsetLeft + spawnBtn.offsetWidth &&
        touchY >= spawnBtn.offsetTop &&
        touchY <= spawnBtn.offsetTop + spawnBtn.offsetHeight ||
        touchX >= shootBtn.offsetLeft &&
        touchX <= shootBtn.offsetLeft + shootBtn.offsetWidth &&
        touchY >= shootBtn.offsetTop &&
        touchY <= shootBtn.offsetTop + shootBtn.offsetHeight
    ) {
        isMoving = false;
        blueBox.style.transform = "translate(-50%, -50%)";
    } else {

        // Move blueBox
        isMoving = true;
        const boxWidth = blueBox.offsetWidth;
        const boxHeight = blueBox.offsetHeight;
        const targetX = touchX - boxWidth / 2;
        const targetY = touchY - boxHeight / 2;
        const startX = parseInt(blueBox.style.left || "350px");
        const startY = parseInt(blueBox.style.top || "500px");
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = distance / 100;
        const speedX = (dx / distance) * 100;
        const speedY = (dy / distance) * 100;
        let progress = 0;
        let lastTime = null;

        function animate(timestamp) {
            if (!lastTime) lastTime = timestamp;
            const elapsed = timestamp - lastTime;
            lastTime = timestamp;
            progress += elapsed / 1000;
            if (progress >= duration) {
                blueBox.style.left = `${targetX}px`;
                blueBox.style.top = `${targetY}px`;
            } else {
                blueBox.style.left = `${startX + speedX * progress}px`;
                blueBox.style.top = `${startY + speedY * progress}px`;
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }
}


function checkCollision(box1, box2) {
    const rect1 = box1.getBoundingClientRect();
    const rect2 = box2.getBoundingClientRect();

    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}