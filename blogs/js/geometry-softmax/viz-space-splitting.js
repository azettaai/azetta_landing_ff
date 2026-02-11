import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, cosineSimilarity, negEuclidean, yatProduct, getSoftmaxProbs, hexToRgb } from './common.js';

export function initVizSpaceSplitting() {
    const env = setupCanvas('viz-space-splitting');
    if (!env) return;
    const { canvas, ctx } = env;

    let prototypes = [
        { x: 1.2, y: 0.8 },
        { x: -1.0, y: 1.0 },
        { x: 0.5, y: -1.3 }
    ];

    let currentMetric = 'dot';

    const metrics = {
        dot: { fn: dotProduct, temp: 0.5, label: 'DOT PRODUCT' },
        cosine: { fn: cosineSimilarity, temp: 2.0, label: 'COSINE SIMILARITY' },
        euclidean: { fn: negEuclidean, temp: 0.8, label: 'NEG. EUCLIDEAN' },
        yat: { fn: yatProduct, temp: 0.05, label: 'YAT METRIC' }
    };

    function toScreen(vx, vy) {
        const w = env.w, h = env.h;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) / 5;
        return [cx + vx * scale, cy - vy * scale];
    }

    function toWorld(sx, sy) {
        const w = env.w, h = env.h;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) / 5;
        return [(sx - cx) / scale, -(sy - cy) / scale];
    }

    function draw() {
        const w = env.w, h = env.h;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        const m = metrics[currentMetric];
        const step = 5;

        // === LAYER 1: Colored regions via fillRect ===
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < w; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, prototypes, m.fn, m.temp);
                const winnerIdx = probs.indexOf(Math.max(...probs));
                const confidence = probs[winnerIdx];

                const rgb = hexToRgb(PROTO_COLORS[winnerIdx % PROTO_COLORS.length]);
                const t = 0.25 + confidence * 0.55;
                const r = Math.round(10 * (1 - t) + rgb[0] * t);
                const g = Math.round(10 * (1 - t) + rgb[1] * t);
                const b = Math.round(20 * (1 - t) + rgb[2] * t);

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(sx, sy, step, step);
            }
        }

        // === LAYER 2: Grid overlay ===
        drawGrid(ctx, w, h);
        drawAxes(ctx, w, h, w / 2, h / 2);

        // === LAYER 3: Boundary dots ===
        const bStep = 3;
        for (let sy = bStep; sy < h - bStep; sy += bStep) {
            for (let sx = bStep; sx < w - bStep; sx += bStep) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, prototypes, m.fn, m.temp);
                const winner = probs.indexOf(Math.max(...probs));
                const [nvx, nvy] = toWorld(sx + bStep, sy);
                const np = getSoftmaxProbs(nvx, nvy, prototypes, m.fn, m.temp);
                const [nvx2, nvy2] = toWorld(sx, sy + bStep);
                const np2 = getSoftmaxProbs(nvx2, nvy2, prototypes, m.fn, m.temp);

                if (winner !== np.indexOf(Math.max(...np)) || winner !== np2.indexOf(Math.max(...np2))) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(244, 241, 222, 0.9)';
                    ctx.fill();
                }
            }
        }

        // === LAYER 4: Prototype vectors from origin ===
        const [ox, oy] = toScreen(0, 0);
        prototypes.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = PROTO_COLORS[i % PROTO_COLORS.length] + 'aa';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // === LAYER 5: Prototype markers ===
        prototypes.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            drawPrototype(ctx, px, py, PROTO_COLORS[i % PROTO_COLORS.length], 9, `W${i + 1}`);
        });

        // Origin marker
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.fill();

        // === LAYER 6: Label ===
        ctx.fillStyle = 'rgba(244, 241, 222, 0.7)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`METRIC: ${m.label}`, 10, 20);
        ctx.fillText(`${prototypes.length} prototypes \u2014 click to add`, 10, 35);
    }

    // Button bindings
    const btnDot = document.getElementById('viz-split-dot');
    const btnCosine = document.getElementById('viz-split-cosine');
    const btnEuclid = document.getElementById('viz-split-euclidean');
    const btnYat = document.getElementById('viz-split-yat');
    const btnReset = document.getElementById('viz-split-reset');

    function setActive(btn) {
        [btnDot, btnCosine, btnEuclid, btnYat].forEach(b => {
            if (b) b.style.fontWeight = b === btn ? 'bold' : 'normal';
        });
    }

    if (btnDot) btnDot.addEventListener('click', () => { currentMetric = 'dot'; setActive(btnDot); draw(); });
    if (btnCosine) btnCosine.addEventListener('click', () => { currentMetric = 'cosine'; setActive(btnCosine); draw(); });
    if (btnEuclid) btnEuclid.addEventListener('click', () => { currentMetric = 'euclidean'; setActive(btnEuclid); draw(); });
    if (btnYat) btnYat.addEventListener('click', () => { currentMetric = 'yat'; setActive(btnYat); draw(); });
    if (btnReset) btnReset.addEventListener('click', () => {
        prototypes = [
            { x: 1.2, y: 0.8 },
            { x: -1.0, y: 1.0 },
            { x: 0.5, y: -1.3 }
        ];
        draw();
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [vx, vy] = toWorld(sx, sy);
        if (prototypes.length >= 7) {
            prototypes = [{ x: vx, y: vy }];
        } else {
            prototypes.push({ x: vx, y: vy });
        }
        draw();
    });

    draw();
    window.addEventListener('resize', draw);
}
