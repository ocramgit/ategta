/* ============================================================
   app.js — NUI Message Dispatcher + Dev Mode
   ============================================================ */

const IS_FIVEM = window.location.hostname !== '' && window.location.protocol === 'nui:';
const resourceName = (() => {
    try { return window.location.hostname; } catch (e) { return 'landing-competition'; }
})();

// ── Handler principal ─────────────────────────────────────────

window.addEventListener('message', function (event) {
    const data = event.data;
    if (!data || !data.action) return;

    switch (data.action) {
        case 'showPicker':
            showView('picker-view');
            initPicker();
            break;

        case 'showHUD':
            showView('hud-view');
            initHUD(data.zone, data.planeName);
            break;

        case 'countdown':
            updateCountdown(data.value);
            break;

        case 'timerTick':
            updateTimer(data.value);
            break;

        case 'feed':
            addFeedItem(data.message);
            break;

        case 'showResults':
            showView('results-view');
            initResults(data.results, data.zone);
            break;

        case 'hideNUI':
            hideAllViews();
            break;
    }
});

// ── Utilitários de view ───────────────────────────────────────

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function hideAllViews() {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
}

// ── ESC fecha results ─────────────────────────────────────────

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const rv = document.getElementById('results-view');
        if (rv && !rv.classList.contains('hidden')) {
            nuiCallback('closeResults', {});
        }
    }
});

// ── NUI Callback helper ───────────────────────────────────────

function nuiCallback(name, data) {
    fetch(`https://${resourceName}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).catch(() => { });
}

// ── DEV MODE (abrir index.html direto no browser) ─────────────

if (!IS_FIVEM) {
    console.log('[DEV] Modo desenvolvimento ativado');

    // Simular sequência completa
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { action: 'showPicker' } }));
    }, 300);

    // Simula confirmação automática após 4 segundos no dev mode
    setTimeout(() => {
        const devZone = { worldX: -400, worldY: -1200, worldZ: 30, mapX: 42.4, mapY: 68.3 };
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'showHUD',
                zone: devZone,
                planeName: 'Luxor (DEV)',
            }
        }));
        for (let t = 10; t >= 0; t--) {
            setTimeout(() => {
                window.dispatchEvent(new MessageEvent('message', { data: { action: 'countdown', value: t } }));
            }, (10 - t) * 1000);
        }
    }, 5000);

    // Feed messages
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { action: 'feed', message: '🛬 Marco aterrou a 120m — 8800 pts' } }));
    }, 17000);
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { action: 'feed', message: '💥 João aterrou a 450m — 5500 pts (penalização -3000)' } }));
    }, 19000);
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { action: 'feed', message: '🛬 Ana aterrou a 88m — 9120 pts' } }));
    }, 21000);

    // Resultados
    setTimeout(() => {
        const devZone = { worldX: -400, worldY: -1200, worldZ: 30, mapX: 42.4, mapY: 68.3 };
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'showResults',
                zone: devZone,
                results: [
                    { rank: 1, name: 'Ana', dist: 88, exploded: false, score: 9120, mapX: 43.0, mapY: 68.0 },
                    { rank: 2, name: 'Marco', dist: 120, exploded: false, score: 8800, mapX: 44.1, mapY: 69.5 },
                    { rank: 3, name: 'João', dist: 450, exploded: true, score: 2500, mapX: 46.8, mapY: 71.2 },
                ]
            }
        }));
    }, 24000);
}
