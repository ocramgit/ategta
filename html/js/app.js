/**
 * app.js — NUI message dispatcher and view manager
 * The NUI starts hidden. Only shows when Lua sends a message.
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

    // Re-trigger CSS animation
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

        // Zone picker (só para o iniciador)
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

        // Countdown 10 → 0 → GO!
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
