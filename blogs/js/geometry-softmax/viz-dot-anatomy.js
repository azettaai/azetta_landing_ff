import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, getSoftmaxProbs, hexToRgb } from './common.js';

export function initVizDotAnatomy() {
    const env = setupCanvas('viz-dot-anatomy');
    if (!env) return;
    const { canvas, ctx } = env;

    let protoA = { x: 1.0, y: 0.5 };
    let protoB = { x: -0.5, y: 1.0 };
    let magnitudeA = 1.0;
    let dragging = false;

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

        const effA = { x: protoA.x * magnitudeA, y: protoA.y * magnitudeA };
        const effB = protoB;
        const protos = [effA, effB];

        // === LAYER 1: Colored regions via fillRect ===
        const step = 5;
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < w; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, protos, dotProduct, 0.3);
                const winnerIdx = probs.indexOf(Math.max(...probs));
                const confidence = probs[winnerIdx];
                const rgb = hexToRgb(PROTO_COLORS[winnerIdx]);
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

        // === LAYER 3: Boundary ===
        const bStep = 3;
        for (let sy = bStep; sy < h - bStep; sy += bStep) {
            for (let sx = bStep; sx < w - bStep; sx += bStep) {
                const [vx, vy] = toWorld(sx, sy);
                const p1 = getSoftmaxProbs(vx, vy, protos, dotProduct, 0.3);
                const w1 = p1.indexOf(Math.max(...p1));
                const [nvx, nvy] = toWorld(sx + bStep, sy);
                const p2 = getSoftmaxProbs(nvx, nvy, protos, dotProduct, 0.3);
                const [nvx2, nvy2] = toWorld(sx, sy + bStep);
                const p3 = getSoftmaxProbs(nvx2, nvy2, protos, dotProduct, 0.3);
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
        const [ax, ay] = toScreen(effA.x, effA.y);
        const [bx, by] = toScreen(effB.x, effB.y);

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = PROTO_COLORS[0];
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = PROTO_COLORS[1];
        ctx.lineWidth = 2.5;
        ctx.stroke();

        drawPrototype(ctx, ax, ay, PROTO_COLORS[0], 9, `W_A (\u00D7${magnitudeA.toFixed(1)})`);
        drawPrototype(ctx, bx, by, PROTO_COLORS[1], 9, 'W_B (\u00D71.0)');

        // Origin marker
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.fill();

        // === LAYER 5: Magnitude slider bar ===
        const barX = 20, barY = h - 40, barW = w - 40, barH = 12;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        const knobX = barX + ((magnitudeA - 0.2) / 4.8) * barW;
        ctx.fillStyle = PROTO_COLORS[0] + '66';
        ctx.fillRect(barX, barY, knobX - barX, barH);
        ctx.beginPath();
        ctx.arc(knobX, barY + barH / 2, 9, 0, Math.PI * 2);
        ctx.fillStyle = PROTO_COLORS[0];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(244, 241, 222, 0.8)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`||W_A|| magnitude: ${magnitudeA.toFixed(1)}\u00D7`, barX, barY - 8);

        // === LAYER 6: Info ===
        const magA = Math.sqrt(effA.x * effA.x + effA.y * effA.y).toFixed(2);
        const magB = Math.sqrt(effB.x * effB.x + effB.y * effB.y).toFixed(2);
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`||W_A|| = ${magA}   ||W_B|| = ${magB}`, w - 10, 20);
        ctx.fillText(`x\u00B7w = ||x|| \u00D7 ||w|| \u00D7 cos(\u03B8)`, w - 10, 35);
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sy = e.clientY - rect.top;
        if (sy > env.h - 55) dragging = true;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const barX = 20, barW = env.w - 40;
        const t = Math.max(0, Math.min(1, (sx - barX) / barW));
        magnitudeA = 0.2 + t * 4.8;
        draw();
    });

    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    draw();
    window.addEventListener('resize', draw);
}
