import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, yatProduct, getSoftmaxProbs, hexToRgb } from './common.js';

export function initVizGravityVsLinear() {
    const env = setupCanvas('viz-gravity-vs-linear');
    if (!env) return;
    const { canvas, ctx } = env;

    let prototypes = [
        { x: 1.2, y: 0.8 },
        { x: -1.0, y: 1.0 },
        { x: 0.5, y: -1.3 }
    ];

    let currentMetric = 'dot';
    let dragIdx = -1;

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

        const simFn = currentMetric === 'dot' ? dotProduct : yatProduct;
        const temp = currentMetric === 'dot' ? 0.5 : 0.05;

        // === LAYER 1: Colored regions via fillRect ===
        const step = 5;
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < w; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, prototypes, simFn, temp);
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

        // === LAYER 2: Grid & axes ===
        drawGrid(ctx, w, h);
        drawAxes(ctx, w, h, w / 2, h / 2);

        // === LAYER 3: Boundaries ===
        const bStep = 3;
        for (let sy = bStep; sy < h - bStep; sy += bStep) {
            for (let sx = bStep; sx < w - bStep; sx += bStep) {
                const [vx, vy] = toWorld(sx, sy);
                const p1 = getSoftmaxProbs(vx, vy, prototypes, simFn, temp);
                const w1 = p1.indexOf(Math.max(...p1));
                const [nvx, nvy] = toWorld(sx + bStep, sy);
                const p2 = getSoftmaxProbs(nvx, nvy, prototypes, simFn, temp);
                const [nvx2, nvy2] = toWorld(sx, sy + bStep);
                const p3 = getSoftmaxProbs(nvx2, nvy2, prototypes, simFn, temp);
                if (w1 !== p2.indexOf(Math.max(...p2)) || w1 !== p3.indexOf(Math.max(...p3))) {
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

        // === LAYER 5: Prototypes ===
        prototypes.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            drawPrototype(ctx, px, py, PROTO_COLORS[i % PROTO_COLORS.length], 9, `W${i + 1}`);
        });

        // Origin
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.fill();

        // === LAYER 6: Label ===
        ctx.fillStyle = 'rgba(244, 241, 222, 0.7)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`METRIC: ${currentMetric === 'dot' ? 'DOT PRODUCT' : 'YAT'} SOFTMAX`, 10, 20);
        ctx.fillText(`Drag prototypes \u2022 ${prototypes.length} active`, 10, 35);
    }

    // Buttons
    const btnDot = document.getElementById('viz-gvl-dot');
    const btnYat = document.getElementById('viz-gvl-yat');
    const btnAdd = document.getElementById('viz-gvl-add');
    const btnReset = document.getElementById('viz-gvl-reset');

    if (btnDot) btnDot.addEventListener('click', () => {
        currentMetric = 'dot';
        if (btnDot) btnDot.style.fontWeight = 'bold';
        if (btnYat) btnYat.style.fontWeight = 'normal';
        draw();
    });
    if (btnYat) btnYat.addEventListener('click', () => {
        currentMetric = 'yat';
        if (btnYat) btnYat.style.fontWeight = 'bold';
        if (btnDot) btnDot.style.fontWeight = 'normal';
        draw();
    });
    if (btnAdd) btnAdd.addEventListener('click', () => {
        if (prototypes.length < 7) {
            prototypes.push({
                x: (Math.random() - 0.5) * 3,
                y: (Math.random() - 0.5) * 3
            });
            draw();
        }
    });
    if (btnReset) btnReset.addEventListener('click', () => {
        prototypes = [
            { x: 1.2, y: 0.8 },
            { x: -1.0, y: 1.0 },
            { x: 0.5, y: -1.3 }
        ];
        draw();
    });

    // Dragging
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        for (let i = 0; i < prototypes.length; i++) {
            const [px, py] = toScreen(prototypes[i].x, prototypes[i].y);
            if (Math.abs(sx - px) < 15 && Math.abs(sy - py) < 15) {
                dragIdx = i;
                return;
            }
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (dragIdx < 0) return;
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [vx, vy] = toWorld(sx, sy);
        prototypes[dragIdx].x = vx;
        prototypes[dragIdx].y = vy;
        draw();
    });
    canvas.addEventListener('mouseup', () => { dragIdx = -1; });
    canvas.addEventListener('mouseleave', () => { dragIdx = -1; });

    draw();
    window.addEventListener('resize', draw);
}
