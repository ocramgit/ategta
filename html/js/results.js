/**
 * results.js — GeoGuessr-style final results map
 * Shows target zone + all player landing positions as pins on the map.
 * Sidebar shows ranking. 30s auto-timer then closes.
 */

const ResultsModule = (() => {
    const PIN_COLORS = [
        '#ffd700', '#c0c0c0', '#cd7f32',
        '#00d4ff', '#ff6b6b', '#a29bfe',
        '#00f5a0', '#fd79a8', '#fdcb6e', '#74b9ff'
    ];
    let closeTimer = null;

    function init(results, zone, duration) {
        // Zone label
        document.getElementById('results-zone-label').textContent = zone?.label || '–';

        // Render map pins
        renderMapPins(results, zone);

        // Render sidebar list
        renderSidebar(results);

        // Start countdown
        startCloseTimer(duration || 30);
    }

    // ------ MAP PINS ------
    function renderMapPins(results, zone) {
        const container = document.getElementById('results-pins');
        container.innerHTML = '';

        // Target pin (big red)
        const targetPin = makePinEl({
            label: '🎯',
            hint: zone.label,
            mapX: zone.mapX,
            mapY: zone.mapY,
            color: '#ff2d55',
            isTarget: true,
            delay: 0,
        });
        container.appendChild(targetPin);

        // Player pins
        results.forEach((r, i) => {
            if (!r.landed || (r.mapX === 50 && r.mapY === 50)) return;

            const rankSymbol = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`;
            const pin = makePinEl({
                label: rankSymbol,
                hint: `${r.name} — ${r.dist}m`,
                mapX: r.mapX,
                mapY: r.mapY,
                color: PIN_COLORS[i % PIN_COLORS.length],
                delay: 200 + i * 150,
            });
            container.appendChild(pin);

            // Draw line to target
            drawLine(container, r.mapX, r.mapY, zone.mapX, zone.mapY, PIN_COLORS[i % PIN_COLORS.length], 200 + i * 150);
        });
    }

    function makePinEl({ label, hint, mapX, mapY, color, isTarget, delay }) {
        const el = document.createElement('div');
        el.className = isTarget ? 'result-pin target-pin' : 'result-pin player-pin';
        el.style.left = mapX + '%';
        el.style.top = mapY + '%';
        el.style.setProperty('--pin-color', color);
        el.style.animationDelay = (delay || 0) + 'ms';
        el.innerHTML = `
            <div class="pin-dot">${label}</div>
            <div class="pin-tooltip">${escapeHtml(hint)}</div>
        `;
        return el;
    }

    function drawLine(container, x1, y1, x2, y2, color, delay) {
        // Use SVG positioned absolutely over map
        let svg = container.querySelector('.pins-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('pins-svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible';
            container.insertBefore(svg, container.firstChild);
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1 + '%');
        line.setAttribute('y1', y1 + '%');
        line.setAttribute('x2', x2 + '%');
        line.setAttribute('y2', y2 + '%');
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '6,4');
        line.setAttribute('opacity', '0.6');
        line.style.animationDelay = delay + 'ms';
        line.classList.add('result-line');
        svg.appendChild(line);
    }

    // ------ SIDEBAR ------
    function renderSidebar(results) {
        const list = document.getElementById('results-list');
        list.innerHTML = '';

        results.forEach((r, i) => {
            const rankSymbol = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`;
            const distText = r.landed && r.dist < 99990 ? `${r.dist}m do alvo` : 'Não aterrou';
            const explText = r.exploded ? ' 💥' : '';
            const color = PIN_COLORS[i % PIN_COLORS.length];

            const item = document.createElement('div');
            item.className = 'result-item';
            item.style.animationDelay = (i * 120) + 'ms';
            item.style.setProperty('--item-color', color);
            item.innerHTML = `
                <div class="result-rank">${rankSymbol}</div>
                <div class="result-info">
                    <div class="result-name">${escapeHtml(r.name)}${explText}</div>
                    <div class="result-dist">${distText}</div>
                </div>
                <div class="result-pts">${r.pts.toLocaleString('pt-PT')} pts</div>
            `;
            list.appendChild(item);
        });
    }

    // ------ AUTO CLOSE TIMER ------
    function startCloseTimer(duration) {
        if (closeTimer) clearInterval(closeTimer);
        let remaining = duration;
        const el = document.getElementById('results-timer');
        if (el) el.textContent = remaining;

        closeTimer = setInterval(() => {
            remaining--;
            if (el) el.textContent = remaining;
            if (remaining <= 10 && el) el.style.color = 'var(--neon-red)';
            if (remaining <= 0) {
                clearInterval(closeTimer);
                fetch(`https://${getResourceName()}/closeUI`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                }).catch(() => { });
                document.getElementById('app').classList.add('hidden');
            }
        }, 1000);
    }

    function getResourceName() {
        return window.location.hostname || 'landing-competition';
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    return { init };
})();
