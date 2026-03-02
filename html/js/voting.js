/**
 * voting.js — Tinder-style card voting system
 * Renders player landing cards with stats, supports swipe/click to vote.
 */

const VotingModule = (() => {
    let cards = [];
    let currentIndex = 0;
    let voteTimer = null;
    let myCard = null;   // saved from myLandingCard event

    // ---- Store own card ----
    function storeMyCard(cardData, name) {
        myCard = { cardData, name };
    }

    // ---- Init vote phase ----
    function init(cardList, duration) {
        cards = cardList || [];
        currentIndex = 0;

        const stack = document.getElementById('cards-stack');
        const countEl = document.getElementById('vote-count');
        const totalEl = document.getElementById('vote-total');

        stack.innerHTML = '';

        if (cards.length === 0) {
            stack.innerHTML = '<div style="color:var(--text-dim);text-align:center;margin-top:100px">Nenhuma aterragem para votar.</div>';
            document.getElementById('vote-buttons').style.display = 'none';
            startVoteTimer(duration);
            return;
        }

        document.getElementById('vote-buttons').style.display = 'flex';
        totalEl.textContent = cards.length;
        countEl.textContent = 0;

        // Render all cards (back-to-front)
        for (let i = cards.length - 1; i >= 0; i--) {
            const card = buildCard(cards[i], i);
            stack.appendChild(card);
        }

        updateActiveCard();
        startVoteTimer(duration);
    }

    // ---- Build a card element ----
    function buildCard(player, index) {
        const cd = player.cardData || {};
        const dmgPct = Math.min(100, cd.damagePercent || 0);
        const speed = cd.speed || 0;
        const hdg = cd.heading || 0;

        // Damage color: green→yellow→red
        const dmgColor = dmgPct > 66 ? '#ff2d55' : dmgPct > 33 ? '#ff9f0a' : '#00f5a0';

        const card = document.createElement('div');
        card.className = 'landing-card';
        card.dataset.id = player.source;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-canvas-area">
                <span class="card-plane-icon">✈️</span>
                <!-- Canvas-generated visual representation of landing -->
                <canvas class="card-canvas" width="340" height="200"></canvas>
                <div class="card-stats-overlay">
                    <div class="card-stat">
                        <span class="card-stat-val">${speed}</span>
                        <span class="card-stat-label">KM/H</span>
                    </div>
                    <div class="card-stat">
                        <span class="card-stat-val">${hdg}°</span>
                        <span class="card-stat-label">HEADING</span>
                    </div>
                    <div class="card-damage-bar-wrap">
                        <div class="card-damage-label">Dano sofrido</div>
                        <div class="card-damage-bar">
                            <div class="card-damage-fill" style="width:${dmgPct}%;background:${dmgColor}"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-info">
                <div class="card-player-name">${escapeHtml(player.name)}</div>
                <div class="card-detail-row">
                    <span>Velocidade de toque</span>
                    <span>${speed} km/h</span>
                </div>
                <div class="card-detail-row">
                    <span>Dano na aeronave</span>
                    <span style="color:${dmgColor}">${dmgPct}%</span>
                </div>
                <div class="card-detail-row">
                    <span>Direção final</span>
                    <span>${hdg}°</span>
                </div>
            </div>
            <div class="card-like-stamp">VOTE</div>
            <div class="card-nope-stamp">SKIP</div>
        `;

        // Draw canvas visual
        setTimeout(() => drawCardCanvas(card.querySelector('canvas'), dmgPct, speed), 100);

        return card;
    }

    // ---- Canvas art: visual representation of landing (no external screenshot needed) ----
    function drawCardCanvas(canvas, damagePercent, speed) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0d1a2d');
        sky.addColorStop(1, '#1a0d2e');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Ground
        const ground = ctx.createLinearGradient(0, h * 0.65, 0, h);
        ground.addColorStop(0, '#1a3a1a');
        ground.addColorStop(1, '#0a1a0a');
        ctx.fillStyle = ground;
        ctx.fillRect(0, h * 0.65, w, h * 0.35);

        // Road markings
        ctx.strokeStyle = 'rgba(255,255,200,0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.65);
        ctx.lineTo(w * 0.5, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 30; i++) {
            const sx = Math.random() * w;
            const sy = Math.random() * h * 0.6;
            const sr = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Plane silhouette
        const planeX = w * 0.5;
        const planeY = h * 0.5;
        const planeColor = damagePercent > 66 ? '#ff2d55' : damagePercent > 33 ? '#ff9f0a' : '#00d4ff';
        const planeAngle = (speed / 300) * 0.4; // more speed = more nose-up

        ctx.save();
        ctx.translate(planeX, planeY);
        ctx.rotate(-planeAngle);

        // Draw plane body
        ctx.fillStyle = planeColor;
        ctx.shadowColor = planeColor;
        ctx.shadowBlur = 20;

        // Fuselage
        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-20, -30);
        ctx.lineTo(20, -30);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(38, -18);
        ctx.lineTo(45, -18);
        ctx.lineTo(45, 0);
        ctx.closePath();
        ctx.fill();

        // Damage sparks
        if (damagePercent > 30) {
            const sparks = Math.floor(damagePercent / 20);
            ctx.shadowBlur = 0;
            for (let i = 0; i < sparks; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#ff9f0a' : '#ff2d55';
                ctx.beginPath();
                const sx = (Math.random() - 0.5) * 80;
                const sy = (Math.random() - 0.5) * 20;
                ctx.arc(sx, sy, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // ---- Vote action (called from HTML onclick) ----
    window.voteAction = function (isLike) {
        if (currentIndex >= cards.length) return;

        const stack = document.getElementById('cards-stack');
        const allCards = stack.querySelectorAll('.landing-card');
        const activeCard = Array.from(allCards).find(c => c.classList.contains('active'));

        if (!activeCard) return;

        const votedSource = activeCard.dataset.id;
        const likeStamp = activeCard.querySelector('.card-like-stamp');
        const nopeStamp = activeCard.querySelector('.card-nope-stamp');

        if (isLike) {
            // Vote: send to server
            fetch(`https://${getResourceName()}/submitVote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ votedSource: parseInt(votedSource) })
            }).catch(() => { });
            if (likeStamp) likeStamp.style.opacity = '1';
            activeCard.style.animation = 'cardSwipeRight 0.5s forwards';
        } else {
            if (nopeStamp) nopeStamp.style.opacity = '1';
            activeCard.style.animation = 'cardSwipeLeft 0.5s forwards';
        }

        setTimeout(() => {
            activeCard.remove();
            currentIndex++;
            const countEl = document.getElementById('vote-count');
            if (countEl) countEl.textContent = Math.min(currentIndex, cards.length);
            updateActiveCard();
        }, 500);
    };

    function updateActiveCard() {
        const stack = document.getElementById('cards-stack');
        const allCards = stack.querySelectorAll('.landing-card');

        allCards.forEach((c, i) => {
            c.classList.remove('active');
        });

        if (allCards.length > 0) {
            const topCard = allCards[allCards.length - 1];
            topCard.classList.add('active');
            document.getElementById('vote-count').textContent = currentIndex;
        }

        // All done
        if (allCards.length === 0) {
            const stack = document.getElementById('cards-stack');
            stack.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                            height:100%;gap:16px;color:var(--text-dim)">
                    <div style="font-size:52px">✅</div>
                    <div style="font-size:16px;font-weight:700;color:var(--text)">Votação completa!</div>
                    <div>Aguarda os resultados...</div>
                </div>`;
            document.getElementById('vote-buttons').style.display = 'none';
        }
    }

    // ---- Vote phase countdown ----
    function startVoteTimer(duration) {
        if (voteTimer) clearInterval(voteTimer);
        let remaining = duration;
        const el = document.getElementById('vote-timer');
        el.textContent = remaining;

        voteTimer = setInterval(() => {
            remaining--;
            el.textContent = remaining;
            if (remaining <= 10) el.style.color = 'var(--neon-red)';
            if (remaining <= 0) {
                clearInterval(voteTimer);
            }
        }, 1000);
    }

    function getResourceName() {
        // In FiveM NUI context, window.location.hostname is the resource name
        return window.location.hostname || 'landing-competition';
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { init, storeMyCard };
})();
