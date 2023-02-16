const canvas = document.getElementById('game');

const scoreboard = document.getElementById('scoreboard')
const playerScoreboardText = document.getElementById('player-score');
const opponentScoreboardText = document.getElementById('opponent-score')


const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 5; // 80
const maxPaddleY = canvas.height - grid - paddleHeight;

var paddleSpeed = 6;
var ballSpeed = 5;

const leftPaddle = {
  // start in the middle of the game on the left side
  x: grid * 2,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};

const rightPaddle = {
  // start in the middle of the game on the right side
  x: canvas.width - grid * 3,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};

const ball = {
  // start in the middle of the game
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: grid,
  height: grid,

  // keep track of when need to reset the ball position
  resetting: false,

  // ball velocity (start going to the top-right corner)
  dx: ballSpeed,
  dy: -ballSpeed
};

const score = {
    opponent: 0,
    player: 0
}

// Audio initalization
const sfxVolume = .5;
const musicVolume = .4;

let gameMusic = new Audio("./assets/game-aranessa-loop.wav");
let homeMusic = new Audio("./assets/home-aranessa-loop.wav");

let playerGoal = new Audio("./assets/game-player-goal.mp3");
let enemyGoal = new Audio("./assets/game-enemy-goal.mp3");

playerGoal.volume = sfxVolume;
enemyGoal.volume = sfxVolume;

gameMusic.autoplay = false;
gameMusic.loop = true;
gameMusic.volume = musicVolume;

homeMusic.autoplay = false;
homeMusic.loop = true;
homeMusic.volume = musicVolume;

gameMusic.addEventListener("canplaythrough", (event) => {
  gameMusic.play()
})

// check for collision between two objects using axis-aligned bounding box (AABB)
// @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}
function reset() {
  score.player = 0;
  score.opponent = 0;
  writeScoreboard();
}

function writeScoreboard(){
  playerScoreboardText.innerText = score.player.toString();
  opponentScoreboardText.innerHTML = score.opponent.toString();
}

// I factored this out to a seperate function because sometimes the ball would hit stuff very quickly
// and the previous hit sound wasn't done playing so there would be silence. Now it just creates a new audio object
// everytime it hits something
function playHitSound(){
  let paddleHit = new Audio("./assets/game-hit.mp3");

  paddleHit.volume = sfxVolume;
  paddleHit.play();
}

// game loop
function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);
  // move paddles by their  velocity
  rightPaddle.y += rightPaddle.dy;
  leftPaddle.y += leftPaddle.dy;

  //move left paddle by ball's velocity
  if (ball.dy < 0) {
    leftPaddle.dy = -paddleSpeed; 
  }
  else if (ball.dy >= 0) {
    leftPaddle.dy = paddleSpeed; 
  }

  // prevent paddles from going through walls
  if (leftPaddle.y < grid) {
    leftPaddle.y = grid;
  }
  else if (leftPaddle.y > maxPaddleY) {
    leftPaddle.y = maxPaddleY;
  }

  if (rightPaddle.y < grid) {
    rightPaddle.y = grid;
  }
  else if (rightPaddle.y > maxPaddleY) {
    rightPaddle.y = maxPaddleY;
  }

  // draw paddles
  context.fillStyle = 'white';
  context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  // move ball by its velocity
  ball.x += ball.dx;
  ball.y += ball.dy;

  let ballHits = false;

  // prevent ball from going through walls by changing its velocity
  if (ball.y < grid) {
    ball.y = grid;
    ball.dy *= -1;
    ballHits = true;
  }
  else if (ball.y + grid > canvas.height - grid) {
    ball.y = canvas.height - grid * 2;
    ball.dy *= -1;
    ballHits = true;
  }

  // reset ball if it goes past paddle (but only if we haven't already done so)
  if ( (ball.x < 0 || ball.x > canvas.width) && !ball.resetting) {

    if (ball.x < 0){
        score.player += 1;
        document.body.style.background = 'rgb(115, 153, 0)';
        
        playerGoal.play();
    }
    if (ball.x > canvas.width) {
        score.opponent += 1;
       document.body.style.background = 'rgb(255, 77, 77)';
        enemyGoal.play();
    }
    writeScoreboard();

    ball.resetting = true;

    // give some time for the player to recover before launching the ball again
    setTimeout(() => {
      //reset if someone scores 7 points UNCOMMENT
      if(score.player == 7 || score.opponent == 7) { 
        announceWinner();  
      }
      ball.resetting = false;
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
    }, 400);
  }
//UNCOMMENT EVERYTHING BELOW TILL RESET SCORE()
  function announceWinner() {
    let text = "Game over!\nEither Cancel or Ok to the reset game button to replay.";
    if (confirm(text) == true) {
      reset();
    } else {
      // context.fillText("GAME OVER",250,300);
      if(score.player == 7) {
        document.write("Game Over. \nYou won"); 
      }
      if(score.opponent == 7) {
        // context.fillText("GAME OVER",250,300);
        document.write("Game Over \nYou lost"); 
      }
    }
    resetScore(); 
    writeScoreboard();
  }

  
  function resetScore() {
    score.player = 0;
    score.opponent = 0; 
  }
  
 

  // check to see if ball collides with paddle. if they do change x velocity
  if (collides(ball, leftPaddle)) {
    ball.dx *= -1;

    // move ball next to the paddle otherwise the collision will happen again
    // in the next frame
    ball.x = leftPaddle.x + leftPaddle.width;
    ballHits = true;
  }
  else if (collides(ball, rightPaddle)) {
    ball.dx *= -1;

    // move ball next to the paddle otherwise the collision will happen again
    // in the next frame
    ball.x = rightPaddle.x - ball.width;
    ballHits = true;
  }

  if (ballHits) {
    playHitSound();
  }

  // draw ball
  context.fillRect(ball.x, ball.y, ball.width, ball.height);

  // draw walls
  context.fillStyle = 'lightgrey';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

  // draw dotted line down the middle
  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }
}

// listen to keyboard events to move the paddles
document.addEventListener('keydown', function(e) {

  // up arrow key
  if (e.which === 38) {
    rightPaddle.dy = -paddleSpeed;
  }
  // down arrow key
  else if (e.which === 40) {
    rightPaddle.dy = paddleSpeed;
  }
 
  // w key
  //if (e.which === 87) {
    //leftPaddle.dy = -paddleSpeed;
  //}
  // a key
  //else if (e.which === 83) {
    //leftPaddle.dy = paddleSpeed;
  //}
});

// listen to keyboard events to stop the paddle if key is released
document.addEventListener('keyup', function(e) {
  if (e.which === 38 || e.which === 40) {
    rightPaddle.dy = 0;
  }

  //if (e.which === 83 || e.which === 87) {
    //leftPaddle.dy = 0;
  //}
});



// start the game
requestAnimationFrame(loop);
