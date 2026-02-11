import { setupCanvas, COLORS, PROTO_COLORS, drawGrid, drawAxes, drawPrototype, dotProduct, cosineSimilarity, negEuclidean, yatProduct, hexToRgb } from './common.js';

export function initVizPotentialFields() {
    const env = setupCanvas('viz-potential-fields');
    if (!env) return;
    const { canvas, ctx } = env;

    const proto = { x: 0.8, y: 0.6 };
    let currentMetric = 'dot';
    let hoverPos = null;

    const metrics = {
        dot: { fn: dotProduct, label: 'DOT PRODUCT' },
        cosine: { fn: cosineSimilarity, label: 'COSINE' },
        euclidean: { fn: negEuclidean, label: 'NEG. EUCLIDEAN' },
        yat: { fn: yatProduct, label: 'YAT' }
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
        const step = 4;

        // First pass: compute min/max for normalization
        let minVal = Infinity, maxVal = -Infinity;
        const vals = [];
        for (let sy = 0; sy < h; sy += step) {
            for (let sx = 0; sx < w; sx += step) {
                const [vx, vy] = toWorld(sx, sy);
                let val = m.fn(vx, vy, proto.x, proto.y);
                val = Math.max(-20, Math.min(20, val));
                vals.push({ sx, sy, val });
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }
        }

        // === LAYER 1: Heatmap via fillRect ===
        const range = maxVal - minVal || 1;
        vals.forEach(({ sx, sy, val }) => {
            const t = (val - minVal) / range;

            let r, g, b;
            if (t < 0.5) {
                const s = t * 2;
                r = Math.round(10 + s * 17);
                g = Math.round(10 + s * 143);
                b = Math.round(60 + s * 69);
            } else {
                const s = (t - 0.5) * 2;
                r = Math.round(27 + s * 217);
                g = Math.round(153 + s * 87);
                b = Math.round(139 - s * 100);
            }

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(sx, sy, step, step);
        });

        // === LAYER 2: Isopotential lines ===
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        const nLines = 12;
        for (let li = 1; li < nLines; li++) {
            const targetVal = minVal + (li / nLines) * range;
            for (let i = 0; i < vals.length; i++) {
                const { sx, sy, val } = vals[i];
                // Check neighbor to the right
                if (i + 1 < vals.length && vals[i + 1].sy === sy) {
                    const nval = vals[i + 1].val;
                    if ((val - targetVal) * (nval - targetVal) < 0) {
                        ctx.fillRect(sx, sy, 1.5, 1.5);
                    }
                }
            }
        }

        // === LAYER 3: Grid & axes ===
        drawAxes(ctx, w, h, w / 2, h / 2);

        // === LAYER 4: Prototype ===
        const [px, py] = toScreen(proto.x, proto.y);
        drawPrototype(ctx, px, py, '#fff', 8, 'W');

        // === LAYER 5: Labels ===
        ctx.fillStyle = 'rgba(244, 241, 222, 0.8)';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`POTENTIAL FIELD: ${m.label}`, 10, 20);
        ctx.fillText(`Bright = high potential, Dark = low`, 10, 35);

        // === LAYER 6: Hover tooltip ===
        if (hoverPos) {
            const [vx, vy] = toWorld(hoverPos.x, hoverPos.y);
            const val = m.fn(vx, vy, proto.x, proto.y);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(hoverPos.x + 10, hoverPos.y - 25, 120, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`\u03C6(x) = ${val.toFixed(3)}`, hoverPos.x + 15, hoverPos.y - 10);
            ctx.beginPath();
            ctx.arc(hoverPos.x, hoverPos.y, 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        hoverPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        draw();
    });
    canvas.addEventListener('mouseleave', () => { hoverPos = null; draw(); });

    // Buttons
    const btnDot = document.getElementById('viz-pot-dot');
    const btnCosine = document.getElementById('viz-pot-cosine');
    const btnEuclid = document.getElementById('viz-pot-euclidean');
    const btnYat = document.getElementById('viz-pot-yat');

    function setActive(btn) {
        [btnDot, btnCosine, btnEuclid, btnYat].forEach(b => {
            if (b) b.style.fontWeight = b === btn ? 'bold' : 'normal';
        });
    }

    if (btnDot) btnDot.addEventListener('click', () => { currentMetric = 'dot'; setActive(btnDot); draw(); });
    if (btnCosine) btnCosine.addEventListener('click', () => { currentMetric = 'cosine'; setActive(btnCosine); draw(); });
    if (btnEuclid) btnEuclid.addEventListener('click', () => { currentMetric = 'euclidean'; setActive(btnEuclid); draw(); });
    if (btnYat) btnYat.addEventListener('click', () => { currentMetric = 'yat'; setActive(btnYat); draw(); });

    draw();
    window.addEventListener('resize', draw);
}
