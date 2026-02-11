import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, getSoftmaxProbs, hexToRgb } from './common.js';

export function initVizMagnitudeDominance() {
    const env = setupCanvas('viz-magnitude-dominance');
    if (!env) return;
    const { canvas, ctx } = env;

    let prototypes = [
        { x: 1.0, y: 0.6, mag: 1.0 },
        { x: -0.8, y: 0.9, mag: 1.0 },
        { x: 0.3, y: -1.2, mag: 1.0 }
    ];
    let selectedIdx = 0;

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

    function getEffective() {
        return prototypes.map(p => ({
            x: p.x * p.mag,
            y: p.y * p.mag
        }));
    }

    function draw() {
        const w = env.w, h = env.h;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        const eff = getEffective();

        // === LAYER 1: Colored regions via fillRect ===
        const step = 5;
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < w; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, eff, dotProduct, 0.3);
                const winnerIdx = probs.indexOf(Math.max(...probs));
                const confidence = probs[winnerIdx];
                const rgb = hexToRgb(PROTO_COLORS[winnerIdx]);
                const t = 0.25 + confidence * 0.6;
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

        // === LAYER 3: Vectors and prototypes ===
        const [ox, oy] = toScreen(0, 0);
        eff.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = PROTO_COLORS[i] + (i === selectedIdx ? 'dd' : '66');
            ctx.lineWidth = i === selectedIdx ? 3 : 1.5;
            ctx.stroke();
            drawPrototype(ctx, px, py, PROTO_COLORS[i], i === selectedIdx ? 11 : 8,
                `W${i + 1} (\u00D7${prototypes[i].mag.toFixed(1)})`);
        });

        // Origin marker
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.fill();

        // === LAYER 4: Arrow controls for selected prototype ===
        const selEff = eff[selectedIdx];
        const [spx, spy] = toScreen(selEff.x, selEff.y);

        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u25B2', spx + 22, spy - 18);

        ctx.fillStyle = '#f44';
        ctx.fillText('\u25BC', spx + 22, spy + 28);

        // === LAYER 5: Info panel ===
        ctx.fillStyle = 'rgba(244, 241, 222, 0.6)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DOT PRODUCT SOFTMAX \u2014 MAGNITUDE DOMINANCE', 10, 20);
        ctx.fillText(`Selected: W${selectedIdx + 1} (click \u25B2\u25BC to change magnitude)`, 10, 35);

        // Territory percentages
        let counts = new Array(prototypes.length).fill(0);
        let total = 0;
        for (let sy = 0; sy < h; sy += 10) {
            for (let sx = 0; sx < w; sx += 10) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, eff, dotProduct, 0.3);
                counts[probs.indexOf(Math.max(...probs))]++;
                total++;
            }
        }

        const barY = h - 16;
        prototypes.forEach((p, i) => {
            const pct = ((counts[i] / total) * 100).toFixed(0);
            ctx.fillStyle = PROTO_COLORS[i];
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`W${i + 1}: ${pct}%`, 10 + i * 120, barY);
        });
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        const eff = getEffective();
        for (let i = 0; i < eff.length; i++) {
            const [px, py] = toScreen(eff[i].x, eff[i].y);
            if (Math.abs(sx - (px + 22)) < 16 && Math.abs(sy - (py - 18)) < 16) {
                selectedIdx = i;
                prototypes[i].mag = Math.min(5.0, prototypes[i].mag + 0.5);
                draw();
                return;
            }
            if (Math.abs(sx - (px + 22)) < 16 && Math.abs(sy - (py + 22)) < 16) {
                selectedIdx = i;
                prototypes[i].mag = Math.max(0.2, prototypes[i].mag - 0.5);
                draw();
                return;
            }
            if (Math.abs(sx - px) < 18 && Math.abs(sy - py) < 18) {
                selectedIdx = i;
                draw();
                return;
            }
        }
    });

    draw();
    window.addEventListener('resize', draw);
}
