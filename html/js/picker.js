/**
 * picker.js — Free-click map zone picker
 * Initiator clicks anywhere on the GTA V map image.
 * The click % position is converted to world coords on the server.
 */

const PickerModule = (() => {
    let placedPin = null;
    let confirmBtn = null;
    let selectedPct = null;   // { x, y } in percent

    function init(zoneList, plane) {
        document.getElementById('picker-plane-name').textContent = plane?.label || '–';

        // Clear any previous pin
        document.getElementById('picker-markers').innerHTML = '';
        selectedPct = null;

        // The entire map container is the click target
        const container = document.querySelector('.picker-container');
        container.style.cursor = 'crosshair';
        container.addEventListener('click', onMapClick, { once: false });
        container._pickerHandler = onMapClick;  // store ref for cleanup
    }

    function onMapClick(e) {
        const container = document.querySelector('.picker-container');
        const rect = container.getBoundingClientRect();

        const pctX = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
        const pctY = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

        selectedPct = { x: parseFloat(pctX), y: parseFloat(pctY) };

        placePin(pctX, pctY);
    }

    function placePin(pctX, pctY) {
        const markersEl = document.getElementById('picker-markers');
        markersEl.innerHTML = '';

        // Pin element
        const pin = document.createElement('div');
        pin.className = 'zone-marker selected';
        pin.style.left = pctX + '%';
        pin.style.top = pctY + '%';
        pin.style.pointerEvents = 'none';
        pin.innerHTML = `
            <div class="zone-marker-dot">📍</div>
            <div class="zone-marker-tooltip">Clica novamente para mudar</div>
        `;
        markersEl.appendChild(pin);
        placedPin = pin;

        // Confirm button (absolute, floated bottom-center)
        let confirmWrap = document.getElementById('picker-confirm-wrap');
        if (!confirmWrap) {
            confirmWrap = document.createElement('div');
            confirmWrap.id = 'picker-confirm-wrap';
            markersEl.appendChild(confirmWrap);
        }
        confirmWrap.innerHTML = `
            <button id="picker-confirm-btn">✅ Confirmar este ponto</button>
        `;

        document.getElementById('picker-confirm-btn').addEventListener('click', (e) => {
            e.stopPropagation();   // não disparar novo click no mapa
            confirmSelection();
        });
    }

    function confirmSelection() {
        if (!selectedPct) return;

        const btn = document.getElementById('picker-confirm-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ A confirmar...';
        }

        fetch(`https://${getResourceName()}/zoneSelected`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mapX: selectedPct.x,
                mapY: selectedPct.y,
            })
        }).catch(() => { });

        // Cleanup cursor
        const container = document.querySelector('.picker-container');
        container.style.cursor = '';
        if (container._pickerHandler) {
            container.removeEventListener('click', container._pickerHandler);
        }
    }

    function getResourceName() {
        return window.location.hostname || 'landing-competition';
    }

    return { init };
})();
