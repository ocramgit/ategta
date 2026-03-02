/* ============================================================
   map.js — Flight HUD: countdown overlay + timer + feed
   ============================================================ */

let flightTimerInterval = null;
let countdownTimeout = null;

function initHUD(zone, planeName) {
    // Mostrar nome do avião
    const nameEl = document.getElementById('hud-plane-name');
    if (nameEl) nameEl.textContent = planeName || 'Avião';

    // Coords do alvo no HUD
    const coordsEl = document.getElementById('hud-target-coords');
    if (coordsEl && zone) {
        coordsEl.textContent = `X: ${Math.round(zone.worldX)} · Y: ${Math.round(zone.worldY)}`;
    }

    // Mostrar countdown overlay
    const overlay = document.getElementById('countdown-overlay');
    if (overlay) overlay.classList.remove('gone');

    // Parar timer anterior se existir
    if (flightTimerInterval) {
        clearInterval(flightTimerInterval);
        flightTimerInterval = null;
    }

    // Timer inicial
    updateTimer(300);

    // Limpar feed
    const feed = document.getElementById('feed-list');
    if (feed) feed.innerHTML = '';
}

function updateCountdown(value) {
    const numEl = document.getElementById('countdown-number');
    const overlay = document.getElementById('countdown-overlay');
    if (!numEl || !overlay) return;

    if (value <= 0) {
        numEl.textContent = 'GO!';
        numEl.classList.add('go');
        setTimeout(() => {
            overlay.classList.add('gone');
            numEl.classList.remove('go');
        }, 900);
    } else {
        numEl.classList.remove('go');
        numEl.textContent = value;
        // Animação por cada número
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'cd-pulse 1s ease-in-out';
    }
}

function updateTimer(seconds) {
    const timerEl = document.getElementById('hud-timer');
    if (!timerEl) return;

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    timerEl.classList.remove('warn', 'alert');
    if (seconds <= 30) {
        timerEl.classList.add('alert');
    } else if (seconds <= 60) {
        timerEl.classList.add('warn');
    }
}

// Feed de aterragens
function addFeedItem(message) {
    const feed = document.getElementById('feed-list');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'feed-item';
    item.textContent = message;
    feed.prepend(item);

    // Fade out depois de 6 segundos
    setTimeout(() => { item.classList.add('fading'); }, 6000);
    setTimeout(() => { if (item.parentNode) item.remove(); }, 7200);

    // Máximo de 5 mensagens
    const items = feed.querySelectorAll('.feed-item');
    if (items.length > 5) items[items.length - 1].remove();
}
