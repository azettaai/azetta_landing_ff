import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, getSoftmaxProbs, hexToRgb } from './common.js';

export function initVizTextbookLines() {
    const env = setupCanvas('viz-textbook-lines');
    if (!env) return;
    const { canvas, ctx } = env;

    let prototypes = [
        { x: 1.5, y: 1.0 },
        { x: -1.2, y: 0.8 },
        { x: 0.3, y: -1.5 }
    ];

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

        // === LAYER 1: Colored softmax regions ===
        if (prototypes.length >= 2) {
            const step = 5;
            for (let sy = 0; sy < h; sy += step) {
                for (let sx = 0; sx < w; sx += step) {
                    const [vx, vy] = toWorld(sx, sy);
                    const probs = getSoftmaxProbs(vx, vy, prototypes, dotProduct, 0.5);
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
        }

        // === LAYER 2: Grid overlay ===
        drawGrid(ctx, w, h);
        const cx = w / 2, cy = h / 2;
        drawAxes(ctx, w, h, cx, cy);

        // === LAYER 3: Decision boundary dots ===
        if (prototypes.length >= 2) {
            const bStep = 3;
            for (let sy = bStep; sy < h - bStep; sy += bStep) {
                for (let sx = bStep; sx < w - bStep; sx += bStep) {
                    const [vx, vy] = toWorld(sx, sy);
                    const probs = getSoftmaxProbs(vx, vy, prototypes, dotProduct, 0.5);
                    const winner = probs.indexOf(Math.max(...probs));

                    const [nvx, nvy] = toWorld(sx + bStep, sy);
                    const nprobs = getSoftmaxProbs(nvx, nvy, prototypes, dotProduct, 0.5);
                    const nwinner = nprobs.indexOf(Math.max(...nprobs));

                    const [nvx2, nvy2] = toWorld(sx, sy + bStep);
                    const nprobs2 = getSoftmaxProbs(nvx2, nvy2, prototypes, dotProduct, 0.5);
                    const nwinner2 = nprobs2.indexOf(Math.max(...nprobs2));

                    if (winner !== nwinner || winner !== nwinner2) {
                        ctx.beginPath();
                        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(244, 241, 222, 0.9)';
                        ctx.fill();
                    }
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

        // === LAYER 6: Labels ===
        ctx.fillStyle = 'rgba(244, 241, 222, 0.7)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SOFTMAX(DOT PRODUCT)', 10, 20);
        ctx.fillText(`${prototypes.length} prototypes \u2014 click to add`, 10, 35);

        // Origin marker
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.fill();
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [vx, vy] = toWorld(sx, sy);

        if (prototypes.length >= 8) {
            prototypes = [{ x: vx, y: vy }];
        } else {
            prototypes.push({ x: vx, y: vy });
        }
        draw();
    });

    draw();
    window.addEventListener('resize', draw);
}
