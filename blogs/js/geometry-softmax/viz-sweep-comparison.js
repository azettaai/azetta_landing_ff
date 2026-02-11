import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, yatProduct, hexToRgb, getSoftmaxProbs } from './common.js';

export function initVizSweepComparison() {
    const env = setupCanvas('viz-sweep-comparison');
    if (!env) return;
    const { canvas, ctx } = env;

    let prototypes = [
        { x: 1.0, y: 0.8 },
        { x: -0.8, y: 1.0 },
        { x: 0.4, y: -1.2 }
    ];

    let testPoint = { x: 0.5, y: 0.3 };
    let dragging = false;

    function toScreen(vx, vy) {
        const w = env.w, h = env.h;
        const areaW = w * 0.6;
        const cx = areaW / 2, cy = h / 2;
        const scale = Math.min(areaW, h) / 5;
        return [cx + vx * scale, cy - vy * scale];
    }

    function toWorld(sx, sy) {
        const w = env.w, h = env.h;
        const areaW = w * 0.6;
        const cx = areaW / 2, cy = h / 2;
        const scale = Math.min(areaW, h) / 5;
        return [(sx - cx) / scale, -(sy - cy) / scale];
    }

    function draw() {
        const w = env.w, h = env.h;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        const areaW = w * 0.6;
        const barAreaX = areaW + 20;
        const barAreaW = w - barAreaX - 20;

        // === LEFT: Vector space with colored regions ===
        // Colored softmax regions (dot product)
        const step = 6;
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < areaW; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                const probs = getSoftmaxProbs(vx, vy, prototypes, dotProduct, 0.5);
                const winnerIdx = probs.indexOf(Math.max(...probs));
                const confidence = probs[winnerIdx];
                const rgb = hexToRgb(PROTO_COLORS[winnerIdx % PROTO_COLORS.length]);
                const t = 0.15 + confidence * 0.35;
                const r = Math.round(10 * (1 - t) + rgb[0] * t);
                const g = Math.round(10 * (1 - t) + rgb[1] * t);
                const b = Math.round(20 * (1 - t) + rgb[2] * t);

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(sx, sy, step, step);
            }
        }

        // Grid in left area
        drawGrid(ctx, areaW, h);
        const cx = areaW / 2, cy = h / 2;
        drawAxes(ctx, areaW, h, cx, cy);

        // Lines from test point to each prototype
        const [tx, ty] = toScreen(testPoint.x, testPoint.y);
        prototypes.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);
            ctx.strokeStyle = PROTO_COLORS[i] + '88';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw prototypes
        prototypes.forEach((p, i) => {
            const [px, py] = toScreen(p.x, p.y);
            drawPrototype(ctx, px, py, PROTO_COLORS[i], 8, `W${i + 1}`);
        });

        // Draw test point
        ctx.beginPath();
        ctx.arc(tx, ty, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('x (drag me)', tx, ty - 18);

        // === RIGHT: Divider ===
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(areaW + 10, 20);
        ctx.lineTo(areaW + 10, h - 20);
        ctx.stroke();

        // === RIGHT: Bar charts ===
        const dotScores = prototypes.map(p => dotProduct(testPoint.x, testPoint.y, p.x, p.y));
        const yatScores = prototypes.map(p => yatProduct(testPoint.x, testPoint.y, p.x, p.y));

        const maxDot = Math.max(...dotScores.map(Math.abs), 0.01);
        const maxYat = Math.max(...yatScores, 0.01);

        const barH = 18;
        const barGap = 6;
        const groupGap = 35;

        // DOT PRODUCT section
        let startY = 40;
        ctx.fillStyle = COLORS.purple;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DOT PRODUCT', barAreaX, startY);
        startY += 22;

        prototypes.forEach((p, i) => {
            const val = dotScores[i];
            const maxBarLen = barAreaW - 70;
            const barLen = (val / maxDot) * maxBarLen;
            const y = startY + i * (barH + barGap);

            // Bar background
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(barAreaX, y, maxBarLen, barH);

            // Filled bar
            ctx.fillStyle = PROTO_COLORS[i] + '88';
            if (barLen >= 0) {
                ctx.fillRect(barAreaX, y, barLen, barH);
            } else {
                ctx.fillRect(barAreaX + barLen, y, -barLen, barH);
            }
            ctx.strokeStyle = PROTO_COLORS[i];
            ctx.lineWidth = 1;
            ctx.strokeRect(barAreaX + Math.min(0, barLen), y, Math.abs(barLen), barH);

            ctx.fillStyle = PROTO_COLORS[i];
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`W${i + 1}: ${val.toFixed(2)}`, barAreaX + maxBarLen + 5, y + 13);
        });

        // YAT section
        startY += prototypes.length * (barH + barGap) + groupGap;
        ctx.fillStyle = COLORS.primary;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('YAT', barAreaX, startY);
        startY += 22;

        prototypes.forEach((p, i) => {
            const val = yatScores[i];
            const maxBarLen = barAreaW - 70;
            const barLen = Math.min(val / maxYat, 1) * maxBarLen;
            const y = startY + i * (barH + barGap);

            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(barAreaX, y, maxBarLen, barH);

            ctx.fillStyle = PROTO_COLORS[i] + '88';
            ctx.fillRect(barAreaX, y, barLen, barH);
            ctx.strokeStyle = PROTO_COLORS[i];
            ctx.lineWidth = 1;
            ctx.strokeRect(barAreaX, y, barLen, barH);

            ctx.fillStyle = PROTO_COLORS[i];
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`W${i + 1}: ${val.toFixed(2)}`, barAreaX + maxBarLen + 5, y + 13);
        });

        // Distance + angle info
        startY += prototypes.length * (barH + barGap) + groupGap - 10;
        ctx.fillStyle = 'rgba(244, 241, 222, 0.5)';
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('GEOMETRY:', barAreaX, startY);
        startY += 16;
        prototypes.forEach((p, i) => {
            const dx = testPoint.x - p.x;
            const dy = testPoint.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);
            const dot = testPoint.x * p.x + testPoint.y * p.y;
            const magX = Math.sqrt(testPoint.x ** 2 + testPoint.y ** 2) || 0.01;
            const magW = Math.sqrt(p.x ** 2 + p.y ** 2) || 0.01;
            const cosAngle = (dot / (magX * magW)).toFixed(2);

            ctx.fillStyle = PROTO_COLORS[i];
            ctx.fillText(`W${i + 1}: d=${dist} cos=${cosAngle}`, barAreaX, startY + i * 14);
        });
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [tx, ty] = toScreen(testPoint.x, testPoint.y);
        if (Math.abs(sx - tx) < 20 && Math.abs(sy - ty) < 20) {
            dragging = true;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [vx, vy] = toWorld(sx, sy);
        testPoint.x = vx;
        testPoint.y = vy;
        draw();
    });

    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mouseleave', () => { dragging = false; });

    draw();
    window.addEventListener('resize', draw);
}
