const titleScreen = document.getElementById('title-screen');
const gameView = document.getElementById('game-view');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const ball = document.getElementById('ball');
const timerText = document.getElementById('timer');
const statusText = document.getElementById('status');
const overlay = document.getElementById('message-overlay');
const msgText = document.getElementById('message-text');

const V_WIDTH = 1000; const V_HEIGHT = 562.5;
let vX = 60; let vY = V_HEIGHT / 2;
let speedX = 0; let speedY = 0;
let startTime = 0; let elapsedBeforeOasis = 0;
let isPlaying = false; let isAtOasis = false; let gameActive = false;
let animationFrameId;

startBtn.addEventListener('click', async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState === 'granted') { initGame(); }
            else { alert('センサーの利用が拒否されました。'); }
        } catch (error) { alert('エラー: ' + error); }
    } else { initGame(); }
});

restartBtn.addEventListener('click', () => { overlay.style.display = 'none'; resetGame(); gameActive = true; loop(); });

function initGame() { titleScreen.style.display = 'none'; gameView.style.display = 'block'; resetGame(); window.addEventListener('deviceorientation', handleOrientation); window.addEventListener('keydown', handleKeyDown); gameActive = true; loop(); }
function resetGame() { vX = 60; vY = V_HEIGHT / 2; speedX = 0; speedY = 0; isPlaying = false; isAtOasis = false; elapsedBeforeOasis = 0; statusText.innerText = "スマホを右に少し傾けてスタート…"; statusText.style.color = "#705e52"; timerText.innerText = "0.00"; updateBallPosition(); }

function handleOrientation(event) {
    if (!gameActive || isAtOasis) return;
    let tiltX = event.beta; let tiltY = -event.gamma;
    speedX = (tiltX > 5) ? (tiltX - 5) * 0.03 : (tiltX < -5) ? (tiltX + 5) * 0.03 : 0;
    speedY = (tiltY > 5) ? (tiltY - 5) * 0.04 : (tiltY < -5) ? (tiltY + 5) * 0.04 : 0;
}
function handleKeyDown(e) {
    if (!gameActive || isAtOasis) return;
    if (e.key === "ArrowRight") speedX = 0.5; if (e.key === "ArrowLeft") speedX = -0.5;
    if (e.key === "ArrowUp") speedY = -0.6; if (e.key === "ArrowDown") speedY = 0.6;
}
function updateBallPosition() { const scale = gameView.clientWidth / V_WIDTH; ball.style.left = (vX * scale) + 'px'; ball.style.top = (vY * scale) + 'px'; }

function loop() {
    if (!gameActive) return;
    if ((speedX !== 0 || speedY !== 0) && !isPlaying && !isAtOasis) { isPlaying = true; startTime = performance.now(); statusText.innerText = "止まらず、戻らず、ゆっくり蛇行しよう"; }
    if (isPlaying && !isAtOasis) {
        let currentElapsed = (performance.now() - startTime) / 1000 + elapsedBeforeOasis;
        timerText.innerText = currentElapsed.toFixed(2);
        if (speedX !== 0 || speedY !== 0) {
            let angle = Math.atan2(speedY, speedX) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            if (angle > 91 && angle < 269) { applyPenalty("後退ペナルティ！（前進）"); }
        }
        if (speedX === 0 && speedY === 0 && vX > 65) { applyPenalty("停止ペナルティ！（前進）"); }
        vX += speedX; vY += speedY;
        if (vY < 15) { vY = 15; speedY = -speedY; } if (vY > V_HEIGHT - 15) { vY = V_HEIGHT - 15; speedY = -speedY; }
        checkCollisions(); updateBallPosition();
        if (vX >= V_WIDTH - 60) { gameClear(currentElapsed); return; }
    }
    animationFrameId = requestAnimationFrame(loop);
}

function applyPenalty(msg) { vX += 20; statusText.innerText = msg; statusText.style.color = "#a75d5d"; if (vX > V_WIDTH - 60) vX = V_WIDTH - 60; }
function checkCollisions() {
    if (vX >= 460 && vX <= 540) { if (!isAtOasis) { triggerOasis(); } return; }
    if (Math.hypot(vX - 300, vY - 180) < 35) { vX += 20; vY += 10; statusText.innerText = "障害物ペナルティ！（前進）"; statusText.style.color = "#a75d5d"; }
    if (Math.hypot(vX - 720, vY - 420) < 35) { vX += 20; vY -= 10; statusText.innerText = "障害物ペナルティ！（前進）"; statusText.style.color = "#a75d5d"; }
    if (vX >= 565 && vX <= 595) { if (vY < 250 || vY > 292) { vX += 25; statusText.innerText = "門の壁ペナルティ！（前進）"; statusText.style.color = "#a75d5d"; } }
}
function triggerOasis() {
    isAtOasis = true; isPlaying = false; elapsedBeforeOasis += (performance.now() - startTime) / 1000;
    speedX = 0; speedY = 0; statusText.innerHTML = "<span style='color:#617a55; font-weight:bold;'>広告再生中…（手を休めてね 5秒）</span>";
    let count = 5;
    let interval = setInterval(() => { count--; if (count <= 0) { clearInterval(interval); vX = 545; isAtOasis = false; startTime = performance.now(); statusText.innerText = "再出発！"; } }, 1000);
}
function gameClear(time) { gameActive = false; isPlaying = false; cancelAnimationFrame(animationFrameId); msgText.style.color = "#617a55"; msgText.innerHTML = `ゴール！<br>記録: ${time.toFixed(2)} 秒`; overlay.style.display = 'flex'; }
