/**
 * app.js — Main NUI message dispatcher and view manager
 */

// =====================================================
// VIEW MANAGER
// =====================================================
const Views = {
    map: document.getElementById('view-map'),
    voting: document.getElementById('view-voting'),
    scoreboard: document.getElementById('view-scoreboard'),
};

function showView(name) {
    Object.values(Views).forEach(v => v.classList.add('hidden'));
    if (Views[name]) Views[name].classList.remove('hidden');
    document.getElementById('app').classList.remove('hidden');
}

function hideAll() {
    document.getElementById('app').classList.add('hidden');
}

// =====================================================
// COUNTDOWN OVERLAY
// =====================================================
function showCountdown(tick) {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');

    overlay.classList.remove('hidden');
    numEl.classList.remove('go');

    if (tick === 0) {
        // GO!
        numEl.classList.add('go');
        numEl.textContent = 'GO!';
        // Re-trigger animation
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = '';
        // Hide after 800ms
        setTimeout(() => overlay.classList.add('hidden'), 800);
    } else {
        numEl.textContent = tick;
        // Re-trigger animation for each number
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = '';
    }
}

// =====================================================
// MAIN MESSAGE HANDLER (Lua → NUI)
// =====================================================
window.addEventListener('message', function (event) {
    const msg = event.data;
    if (!msg || !msg.action) return;

    switch (msg.action) {

        // -------- MAP VIEW --------
        case 'openMap':
            MapModule.init(msg.zone, msg.plane, msg.flightTime);
            showView('map');
            break;

        case 'updateTimer':
            MapModule.updateTimer(msg.seconds);
            break;

        // -------- COUNTDOWN --------
        case 'countdown':
            showCountdown(msg.tick);
            break;

        case 'myLandingCard':
            // Salvar o card do próprio jogador para votação
            VotingModule.storeMyCard(msg.cardData, msg.name);
            break;

        // -------- FEED DE ATERRAGENS --------
        case 'playerLanded':
            MapModule.addLandedFeed(msg.data.name, msg.data.count, msg.data.total);
            break;

        // -------- VOTING VIEW --------
        case 'openVoting':
            VotingModule.init(msg.data.cards, msg.data.duration);
            showView('voting');
            break;

        // -------- SCOREBOARD --------
        case 'openScoreboard':
            ScoreboardModule.init(msg.data.results, msg.data.zone);
            showView('scoreboard');
            break;

        case 'hide':
            hideAll();
            break;

        default:
            break;
    }
});

// =====================================================
// DEV MODE: mock data se abrir no browser diretamente
// =====================================================
if (!window.invokeNative) {
    // Simular abertura do mapa após 500ms
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openMap',
                zone: {
                    label: 'Cruzamento Downtown Vinewood',
                    hint: 'Aterra na grande avenida do centro!',
                    mapX: 52.0,
                    mapY: 58.0,
                },
                plane: { label: 'Luxor', model: 'luxor' },
                flightTime: 300,
            }
        }));
    }, 500);

    // Simular aterragem de jogador após 3s
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'playerLanded',
                data: { name: 'João Silva', count: 1, total: 3 }
            }
        }));
    }, 3000);

    // Simular abertura de votação após 6s
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openVoting',
                data: {
                    duration: 60,
                    cards: [
                        { source: 1, name: 'João Silva', cardData: { speed: 45, heading: 220, damagePercent: 72 } },
                        { source: 2, name: 'Marco Ferreira', cardData: { speed: 12, heading: 185, damagePercent: 30 } },
                        { source: 3, name: 'Rui Costa', cardData: { speed: 88, heading: 310, damagePercent: 95 } },
                    ],
                }
            }
        }));
    }, 6000);

    // Simular scoreboard após 14s
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openScoreboard',
                data: {
                    zone: { label: 'Cruzamento Downtown Vinewood' },
                    results: [
                        { rank: 1, name: 'Marco Ferreira', landed: true, dist: 18, distPts: 3500, dmgPts: 500, dmgLabel: '⚠️ Arranhada', votes: 2, votePts: 1500, total: 5500, source: 2 },
                        { rank: 2, name: 'João Silva', landed: true, dist: 42, distPts: 2000, dmgPts: 1000, dmgLabel: '🔥 Danificada', votes: 1, votePts: 750, total: 3750, source: 1 },
                        { rank: 3, name: 'Rui Costa', landed: true, dist: 110, distPts: 500, dmgPts: 2000, dmgLabel: '💥 Destruída', votes: 0, votePts: 0, total: 2500, source: 3 },
                    ],
                }
            }
        }));
    }, 14000);
}
