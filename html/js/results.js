/**
 * results.js — GeoGuessr-style results using Leaflet.js zoomable map
 * Shows target + player landing positions on the GTA V tile map.
 * Sidebar shows ranking with distance and points.
 */

const ResultsModule = (() => {
    const PIN_COLORS = [
        '#ffd700', '#c0c0c0', '#cd7f32',
        '#00d4ff', '#ff6b6b', '#a29bfe',
        '#00f5a0', '#fd79a8', '#fdcb6e', '#74b9ff'
    ];
    let closeTimer = null;
    let rMap = null;

    // Convert map % back to Leaflet LatLng (using same tile projection as picker)
    function pctToLatLng(mapXPct, mapYPct, leafletMap) {
        const px = (mapXPct / 100) * 16384;
        const py = (mapYPct / 100) * 16384;
        return leafletMap.unproject([px, py], 4);
    }

    function init(results, zone, duration) {
        document.getElementById('results-zone-label').textContent = zone?.label || '–';

        renderLeafletMap(results, zone);
        renderSidebar(results);
        startCloseTimer(duration || 30);
    }

    function renderLeafletMap(results, zone) {
        const mapEl = document.getElementById('results-map-leaflet');

        if (rMap) { rMap.remove(); rMap = null; }

        rMap = L.map(mapEl, {
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 3,
            zoomControl: true,
            attributionControl: false,
        });

        const tileUrl = 'https://maptilesv3.gta5.dev/gta5tiles/tiles/{z}/{x}/{y}.jpg';
        const bounds = L.latLngBounds(
            rMap.unproject([0, 16384], 4),
            rMap.unproject([16384, 0], 4)
        );

        L.tileLayer(tileUrl, {
            tileSize: 256,
            minZoom: -3,
            maxZoom: 3,
            noWrap: true,
            bounds: bounds,
        }).addTo(rMap);

        // Target marker
        const targetLatLng = pctToLatLng(zone.mapX, zone.mapY, rMap);
        const targetIcon = L.divIcon({
            className: 'leaflet-gta-pin',
            html: '<div class="lpin-target">🎯</div>',
            iconSize: [44, 44],
            iconAnchor: [22, 44],
        });
        L.marker(targetLatLng, { icon: targetIcon })
            .bindTooltip(zone.label, { permanent: true, direction: 'top', className: 'lpin-label' })
            .addTo(rMap);

        // Collect points for auto-fitting the view
        const allLatLngs = [targetLatLng];

        // Player markers
        results.forEach((r, i) => {
            if (!r.landed || (r.mapX === 50 && r.mapY === 50)) return;

            const rankSym = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${r.rank}`;
            const color = PIN_COLORS[i % PIN_COLORS.length];

            const playerLatLng = pctToLatLng(r.mapX, r.mapY, rMap);
            allLatLngs.push(playerLatLng);

            const playerIcon = L.divIcon({
                className: 'leaflet-gta-pin',
                html: `<div class="lpin-player" style="background:${color}">${rankSym}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            L.marker(playerLatLng, { icon: playerIcon })
                .bindTooltip(`${r.name} — ${r.dist}m`, { permanent: false, direction: 'top', className: 'lpin-label' })
                .addTo(rMap);

            // Dashed line from player to target
            L.polyline([playerLatLng, targetLatLng], {
                color: color,
                weight: 2,
                opacity: 0.7,
                dashArray: '8, 6',
            }).addTo(rMap);
        });

        // Fit map to show all markers
        if (allLatLngs.length > 1) {
            rMap.fitBounds(L.latLngBounds(allLatLngs), { padding: [60, 60] });
        } else {
            rMap.setView(targetLatLng, 1);
        }
    }

    function renderSidebar(results) {
        const list = document.getElementById('results-list');
        list.innerHTML = '';

        results.forEach((r, i) => {
            const rankSym = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${r.rank}`;
            const distText = r.landed && r.dist < 99990 ? `${r.dist}m do alvo` : 'Não aterrou';
            const explText = r.exploded ? ' 💥' : '';
            const color = PIN_COLORS[i % PIN_COLORS.length];

            const item = document.createElement('div');
            item.className = 'result-item';
            item.style.animationDelay = (i * 120) + 'ms';
            item.style.setProperty('--item-color', color);
            item.innerHTML = `
                <div class="result-rank">${rankSym}</div>
                <div class="result-info">
                    <div class="result-name">${escapeHtml(r.name)}${explText}</div>
                    <div class="result-dist">${distText}</div>
                </div>
                <div class="result-pts">${r.pts.toLocaleString('pt-PT')} pts</div>
            `;
            list.appendChild(item);
        });
    }

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
                const resName = (typeof GetParentResourceName !== 'undefined')
                    ? GetParentResourceName()
                    : (window.location.hostname || 'landing-competition');
                fetch(`https://${resName}/closeUI`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                }).catch(() => { });
                document.getElementById('app').classList.add('hidden');
            }
        }, 1000);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    return { init };
})();
