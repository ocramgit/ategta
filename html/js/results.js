/* ============================================================
   results.js — GeoGuessr-style Leaflet results map + sidebar ranking
   ============================================================ */

const MAP_W_R = 850;
const MAP_H_R = 1200;

// Paleta de cores para pins dos jogadores
const PIN_COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FD79A8',
    '#00B894', '#FDCB6E', '#74B9FF', '#E17055', '#55EFC4',
];

let resultsMap = null;
let resultsTimer = null;
let closeCountdown = 30;

function initResults(results, zone) {
    // Reset estado anterior
    if (resultsTimer) clearInterval(resultsTimer);
    closeCountdown = 30;

    // ── Mapa Leaflet ──────────────────────────────────────────
    if (!resultsMap) {
        const bounds = [[0, 0], [MAP_H_R, MAP_W_R]];
        resultsMap = L.map('results-map', {
            crs: L.CRS.Simple,
            minZoom: -1,
            maxZoom: 3,
            zoomControl: true,
            attributionControl: false,
        });
        L.imageOverlay('assets/gtamap.jpg', bounds).addTo(resultsMap);
        resultsMap.fitBounds(bounds);
    } else {
        // Limpar layers anteriores (exceto o imageOverlay)
        resultsMap.eachLayer(layer => {
            if (!(layer instanceof L.ImageOverlay)) resultsMap.removeLayer(layer);
        });
    }

    // ── Conversão coords mundo → Leaflet ─────────────────────
    // mapX,mapY estão em % (0-100), converter para coordenadas Leaflet
    function pctToLatLng(mapXpct, mapYpct) {
        const lx = (mapXpct / 100) * MAP_W_R;
        const ly = MAP_H_R - (mapYpct / 100) * MAP_H_R;
        return [ly, lx];
    }

    // ── Marker alvo 🎯 ────────────────────────────────────────
    const targetLL = pctToLatLng(zone.mapX, zone.mapY);
    L.marker(targetLL, {
        icon: L.divIcon({
            className: '',
            html: '<div class="target-marker">🎯</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        }),
        zIndexOffset: 2000,
    }).addTo(resultsMap).bindPopup('<b>Ponto Alvo</b>');

    // ── Pins e linhas dos jogadores ───────────────────────────
    results.forEach((r, i) => {
        const color = PIN_COLORS[i % PIN_COLORS.length];
        const playerLL = pctToLatLng(r.mapX, r.mapY);

        // Pin colorido com número de rank
        const rankSymbol = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
        L.marker(playerLL, {
            icon: L.divIcon({
                className: '',
                html: `<div class="player-pin" style="background:${color}">${rankSymbol}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            }),
            zIndexOffset: 1000 - i,
        }).addTo(resultsMap).bindPopup(`<b>${r.name}</b><br>${r.dist}m · ${r.score} pts`);

        // Linha tracejada ao alvo
        L.polyline([playerLL, targetLL], {
            color: color,
            weight: 2,
            opacity: 0.75,
            dashArray: '8, 6',
            className: 'dashed-line',
        }).addTo(resultsMap);
    });

    // Centrar mapa entre o alvo e os pins
    const allPoints = [targetLL, ...results.map(r => pctToLatLng(r.mapX, r.mapY))];
    const group = L.featureGroup(allPoints.map(p => L.marker(p)));
    resultsMap.fitBounds(group.getBounds().pad(0.25));
    setTimeout(() => resultsMap.invalidateSize(), 100);

    // ── Sidebar ranking ───────────────────────────────────────
    buildRanking(results);

    // ── Auto-close (30s) ─────────────────────────────────────
    const fill = document.getElementById('results-progress-fill');
    const cdEl = document.getElementById('results-countdown');

    if (fill) {
        fill.style.transition = 'none';
        fill.style.transform = 'scaleX(1)';
        void fill.offsetWidth;
        fill.style.transition = `transform ${closeCountdown}s linear`;
        fill.style.transform = 'scaleX(0)';
    }

    resultsTimer = setInterval(() => {
        closeCountdown--;
        if (cdEl) cdEl.textContent = closeCountdown;
        if (closeCountdown <= 0) {
            clearInterval(resultsTimer);
            nuiCallback('closeResults', {});
        }
    }, 1000);
}

function buildRanking(results) {
    const container = document.getElementById('results-ranking');
    if (!container) return;
    container.innerHTML = '';

    results.forEach((r, i) => {
        const card = document.createElement('div');
        card.className = 'rank-card';
        card.style.animationDelay = `${i * 0.12}s`;

        // Posição
        const posEl = document.createElement('div');
        posEl.className = 'rank-pos';
        if (i === 0) { posEl.textContent = '🥇'; posEl.classList.add('gold'); }
        else if (i === 1) { posEl.textContent = '🥈'; posEl.classList.add('silver'); }
        else if (i === 2) { posEl.textContent = '🥉'; posEl.classList.add('bronze'); }
        else { posEl.textContent = `#${i + 1}`; posEl.classList.add('other'); }

        // Info
        const infoEl = document.createElement('div');
        infoEl.className = 'rank-info';

        const nameEl = document.createElement('div');
        nameEl.className = 'rank-name';
        nameEl.textContent = r.name;

        const metaEl = document.createElement('div');
        metaEl.className = 'rank-meta';
        const penalty = r.exploded ? ' · 💥 -3000 (explosão)' : '';
        metaEl.textContent = `${r.dist}m de distância${penalty}`;

        infoEl.appendChild(nameEl);
        infoEl.appendChild(metaEl);

        // Score
        const scoreEl = document.createElement('div');
        scoreEl.className = 'rank-score';
        scoreEl.textContent = `${r.score.toLocaleString()} pts`;
        scoreEl.style.color = i === 0 ? '#ffd600' : '#e0e8ff';

        card.appendChild(posEl);
        card.appendChild(infoEl);
        card.appendChild(scoreEl);

        container.appendChild(card);
    });
}
