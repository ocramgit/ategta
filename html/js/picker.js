/**
 * picker.js — Zoomable GTA V map picker using Leaflet.js
 * Uses GTA V map tiles. Click anywhere to place a marker, then confirm.
 * Uses GetParentResourceName() for reliable FiveM NUI callback.
 */

const PickerModule = (() => {
    let map = null;
    let marker = null;
    let selectedLatLng = null;

    // GTA V map bounds (Leaflet uses [lat, lng] but we repurpose for [y, x])
    // We project GTA world coords onto a 2048×2048 tile grid
    // Using the publicly available GTA V map tile layer
    const GTA_BOUNDS = [[-3000, -3000], [3000, 3000]];

    function init(zoneList, plane) {
        document.getElementById('picker-plane-name').textContent = plane?.label || '–';

        // Destroy any previous map instance
        if (map) {
            map.remove();
            map = null;
        }
        selectedLatLng = null;
        marker = null;

        // Clear markers div (now houses the Leaflet map)
        const mapEl = document.getElementById('picker-map-leaflet');

        // Initialize Leaflet with GTA V CRS
        map = L.map(mapEl, {
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 3,
            zoomControl: true,
            attributionControl: false,
        });

        // GTA V map tiles — using the tile layer from gtamap.dev
        // Tiles are served as a standard slippy map
        const tileUrl = 'https://maptilesv3.gta5.dev/gta5tiles/tiles/{z}/{x}/{y}.jpg';

        // Bounds for the CRS.Simple projection
        // The tile layer covers exactly these bounds
        const bounds = L.latLngBounds(
            map.unproject([0, 16384], 4),
            map.unproject([16384, 0], 4)
        );

        L.tileLayer(tileUrl, {
            tileSize: 256,
            minZoom: -3,
            maxZoom: 3,
            noWrap: true,
            bounds: bounds,
        }).addTo(map);

        // Fit to the tile bounds and start at a reasonable zoom level
        map.fitBounds(bounds);

        // Custom pin icon
        const pinIcon = L.divIcon({
            className: 'leaflet-gta-pin',
            html: '<div class="lpin-dot">📍</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
        });

        // Click handler
        map.on('click', function (e) {
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng, { icon: pinIcon }).addTo(map);
            }
            selectedLatLng = e.latlng;
            showConfirmButton(e.latlng);
        });

        // Style the map container
        const container = document.querySelector('.picker-container');
        container.style.cursor = 'crosshair';
    }

    function showConfirmButton(latlng) {
        let wrap = document.getElementById('picker-confirm-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'picker-confirm-wrap';
            document.querySelector('.picker-container').appendChild(wrap);
        }
        wrap.innerHTML = `<button id="picker-confirm-btn">✅ Confirmar este ponto</button>`;

        document.getElementById('picker-confirm-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            confirmSelection();
        });
    }

    function confirmSelection() {
        if (!selectedLatLng || !map) return;

        const btn = document.getElementById('picker-confirm-btn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ A confirmar...'; }

        // Convert Leaflet latlng back to pixel then to map %
        const point = map.project(selectedLatLng, 4);
        const mapX = (point.x / 16384 * 100).toFixed(2);
        const mapY = (point.y / 16384 * 100).toFixed(2);

        // GetParentResourceName() — FiveM NUI native, always correct
        const resName = (typeof GetParentResourceName !== 'undefined')
            ? GetParentResourceName()
            : (window.location.hostname || 'landing-competition');

        fetch(`https://${resName}/zoneSelected`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapX: parseFloat(mapX), mapY: parseFloat(mapY) })
        }).then(() => {
            if (btn) btn.textContent = '✅ Confirmado!';
        }).catch(() => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '❌ Erro! Tenta novamente';
                btn.style.background = 'linear-gradient(135deg,#ff2d55,#c0002c)';
                btn.style.color = '#fff';
            }
        });
    }

    return { init };
})();
