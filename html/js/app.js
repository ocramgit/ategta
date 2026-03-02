/**
 * app.js — NUI message dispatcher and view manager
 */

// =====================================================
// VIEW MANAGER
// =====================================================
const Views = {
    picker: document.getElementById('view-picker'),
    map: document.getElementById('view-map'),
    results: document.getElementById('view-results'),
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
        numEl.classList.add('go');
        numEl.textContent = 'GO!';
    } else {
        numEl.textContent = tick;
    }

    // Re-trigger animation
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = '';

    if (tick === 0) {
        setTimeout(() => overlay.classList.add('hidden'), 900);
    }
}

// =====================================================
// MAIN MESSAGE HANDLER (Lua → NUI)
// =====================================================
window.addEventListener('message', function (event) {
    const msg = event.data;
    if (!msg || !msg.action) return;

    switch (msg.action) {

        // Zone picker (só iniciador)
        case 'openPicker':
            PickerModule.init(msg.zones, msg.plane);
            showView('picker');
            break;

        // HUD de voo
        case 'openMap':
            MapModule.init(msg.zone, msg.plane, msg.flightTime);
            showView('map');
            break;

        case 'updateTimer':
            MapModule.updateTimer(msg.seconds);
            break;

        // Countdown 10→0→GO
        case 'countdown':
            showCountdown(msg.tick);
            break;

        // Feed lateral de aterragens
        case 'playerLanded':
            MapModule.addLandedFeed(msg.data.name, msg.data.count, msg.data.total);
            break;

        // Resultados GeoGuessr
        case 'openResults':
            ResultsModule.init(msg.data.results, msg.data.zone, msg.data.duration);
            showView('results');
            break;

        case 'hide':
            hideAll();
            break;
    }
});

// =====================================================
// DEV MODE — só em browser normal, nunca no FiveM
// =====================================================
const isFiveM = window.location.protocol === 'nui:';
if (!isFiveM) {
    const mockZones = [
        { label: 'Cruzamento Downtown', hint: 'Aterra no centro!', mapX: 52, mapY: 58 },
        { label: 'Autoestrada Route 1', hint: 'Meio da estrada.', mapX: 52, mapY: 67 },
        { label: 'Monte Chiliad', hint: 'Boa sorte!', mapX: 43, mapY: 10 },
    ];

    // t=0: abrir picker
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openPicker',
                zones: mockZones,
                plane: { label: 'Luxor', model: 'luxor' },
            }
        }));
    }, 400);

    // t=4s: iniciar mapa de voo (simula zona escolhida)
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openMap',
                zone: { label: 'Cruzamento Downtown', hint: 'Aterra no centro!', mapX: 52, mapY: 58 },
                plane: { label: 'Luxor', model: 'luxor' },
                flightTime: 300,
            }
        }));
    }, 4000);

    // t=5-14s: countdown 10→0
    for (let i = 10; i >= 0; i--) {
        (function (tick) {
            setTimeout(() => {
                window.dispatchEvent(new MessageEvent('message', { data: { action: 'countdown', tick } }));
            }, 4500 + (10 - tick) * 1000);
        })(i);
    }

    // t=16s: feed de aterragem
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'playerLanded',
                data: { name: 'João Costa', count: 1, total: 3 },
            }
        }));
    }, 16000);

    // t=20s: resultados
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent('message', {
            data: {
                action: 'openResults',
                data: {
                    duration: 30,
                    zone: { label: 'Cruzamento Downtown', mapX: 52, mapY: 58 },
                    results: [
                        { rank: 1, name: 'João Costa', landed: true, exploded: false, dist: 14, pts: 8860, mapX: 51.5, mapY: 57.3 },
                        { rank: 2, name: 'Marco Ferreira', landed: true, exploded: false, dist: 67, pts: 9330, mapX: 53.8, mapY: 59.1 },
                        { rank: 3, name: 'Rui Silva', landed: true, exploded: true, dist: 210, pts: 3900, mapX: 48.0, mapY: 62.0 },
                    ],
                },
            }
        }));
    }, 20000);
}
