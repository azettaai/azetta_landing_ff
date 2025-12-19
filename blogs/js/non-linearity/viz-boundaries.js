import { COLORS } from './common.js';

export function initVizBoundaries() {
    const canvas = document.getElementById('viz-boundaries');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Start with 2 anchors
    let anchors = [
        { x: -80, y: 0 },
        { x: 80, y: 0 }
    ];
    let currentMetric = 'yat';

    // Richer color palette with gradients
    const anchorPalettes = [
        { main: [27, 153, 139], glow: [45, 200, 180] },    // teal
        { main: [237, 33, 124], glow: [255, 100, 160] },   // pink
        { main: [244, 162, 97], glow: [255, 200, 140] },   // orange
        { main: [155, 93, 229], glow: [190, 140, 255] },   // purple
        { main: [0, 187, 249], glow: [100, 220, 255] }     // cyan
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function computeMetric(px, py, ax, ay, metric) {
        switch (metric) {
            case 'euclidean': {
                const dx = px - ax, dy = py - ay;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return 1 / (1 + dist * 0.015);
            }
            case 'dot': {
                return ax * px + ay * py;
            }
            case 'yat': {
                const dot = ax * px + ay * py;
                const dx = px - ax, dy = py - ay;
                const distSq = dx * dx + dy * dy;
                if (distSq < 1) return 100;
                return (dot * dot) / distSq;
            }
        }
    }

    function softmax(values, temperature = 1.0) {
        const maxVal = Math.max(...values);
        const exps = values.map(v => Math.exp((v - maxVal) / temperature));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        // Dark gradient background
        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#0d0d15');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw smooth decision regions using imageData for performance
        const resolution = 3;
        const temp = currentMetric === 'yat' ? 0.3 : 0.8;

        for (let x = 0; x < w; x += resolution) {
            for (let y = 0; y < h; y += resolution) {
                const px = x - cx;
                const py = y - cy;

                // Compute metric for each anchor
                const values = anchors.map(a => computeMetric(px, py, a.x, a.y, currentMetric));
                const probs = softmax(values, temp);

                // Mix colors based on probabilities with smooth blending
                let r = 0, g = 0, b = 0;
                let maxProb = 0;
                let dominantIdx = 0;

                probs.forEach((prob, i) => {
                    const col = anchorPalettes[i % anchorPalettes.length].main;
                    r += col[0] * prob;
                    g += col[1] * prob;
                    b += col[2] * prob;
                    if (prob > maxProb) {
                        maxProb = prob;
                        dominantIdx = i;
                    }
                });

                // Intensity based on certainty (how dominant is the winner)
                const certainty = maxProb;
                const intensity = 0.15 + certainty * 0.5;

                ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${intensity})`;
                ctx.fillRect(x, y, resolution, resolution);
            }
        }

        // Draw contour lines for decision boundaries
        ctx.lineWidth = 1.5;
        for (let x = resolution; x < w - resolution; x += resolution) {
            for (let y = resolution; y < h - resolution; y += resolution) {
                const px = x - cx;
                const py = y - cy;

                const values = anchors.map(a => computeMetric(px, py, a.x, a.y, currentMetric));
                const probs = softmax(values, temp);
                const winner1 = probs.indexOf(Math.max(...probs));

                // Check neighbors
                const neighbors = [
                    { dx: resolution, dy: 0 },
                    { dx: 0, dy: resolution }
                ];

                for (const n of neighbors) {
                    const px2 = (x + n.dx) - cx;
                    const py2 = (y + n.dy) - cy;
                    const values2 = anchors.map(a => computeMetric(px2, py2, a.x, a.y, currentMetric));
                    const probs2 = softmax(values2, temp);
                    const winner2 = probs2.indexOf(Math.max(...probs2));

                    if (winner1 !== winner2) {
                        // Draw boundary segment with glow
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + n.dx, y + n.dy);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }

        // For Yat: Draw polarity lines showing anti-parallel activation
        if (currentMetric === 'yat' && anchors.length >= 1) {
            ctx.setLineDash([8, 8]);
            ctx.lineWidth = 2;

            anchors.forEach((a, idx) => {
                const mag = Math.sqrt(a.x * a.x + a.y * a.y);
                if (mag > 10) {
                    const nx = a.x / mag;
                    const ny = a.y / mag;

                    // Line through origin showing polarity axis
                    const col = anchorPalettes[idx % anchorPalettes.length].glow;
                    ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.4)`;
                    ctx.beginPath();
                    ctx.moveTo(cx - nx * 300, cy - ny * 300);
                    ctx.lineTo(cx + nx * 300, cy + ny * 300);
                    ctx.stroke();
                }
            });
            ctx.setLineDash([]);
        }

        // Draw subtle grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw origin crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy);
        ctx.lineTo(cx + 20, cy);
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx, cy + 20);
        ctx.stroke();

        // Draw anchors with rich glow effects
        anchors.forEach((anchor, idx) => {
            const ax = cx + anchor.x;
            const ay = cy + anchor.y;
            const palette = anchorPalettes[idx % anchorPalettes.length];

            // Outer glow
            const outerGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 50);
            outerGlow.addColorStop(0, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0.6)`);
            outerGlow.addColorStop(0.4, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0.2)`);
            outerGlow.addColorStop(1, `rgba(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]}, 0)`);
            ctx.beginPath();
            ctx.arc(ax, ay, 50, 0, Math.PI * 2);
            ctx.fillStyle = outerGlow;
            ctx.fill();

            // Inner core
            const innerGlow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 12);
            innerGlow.addColorStop(0, '#fff');
            innerGlow.addColorStop(0.3, `rgb(${palette.glow[0]}, ${palette.glow[1]}, ${palette.glow[2]})`);
            innerGlow.addColorStop(1, `rgb(${palette.main[0]}, ${palette.main[1]}, ${palette.main[2]})`);
            ctx.beginPath();
            ctx.arc(ax, ay, 12, 0, Math.PI * 2);
            ctx.fillStyle = innerGlow;
            ctx.fill();

            // White ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String.fromCharCode(65 + idx), ax, ay + 5);
        });

        // Info panel with glassmorphism effect
        const panelW = 260, panelH = 100, panelX = 15, panelY = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 8);
        ctx.fill();
        ctx.strokeStyle = getMetricColor();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.fillStyle = getMetricColor();
        ctx.fillText(getMetricName() + ' Boundaries', panelX + 15, panelY + 28);

        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#bbb';
        ctx.fillText(`${anchors.length} anchor${anchors.length > 1 ? 's' : ''} • softmax classification`, panelX + 15, panelY + 48);

        if (currentMetric === 'yat') {
            ctx.fillStyle = '#ffdd66';
            ctx.fillText('⚡ Opposite vectors also activate!', panelX + 15, panelY + 68);
            ctx.fillStyle = '#888';
            ctx.fillText('(squared dot product → polarity blind)', panelX + 15, panelY + 85);
        } else if (currentMetric === 'euclidean') {
            ctx.fillStyle = '#888';
            ctx.fillText('Voronoi-like partitions', panelX + 15, panelY + 68);
            ctx.fillText('Based purely on distance', panelX + 15, panelY + 85);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillText('Linear hyperplane boundaries', panelX + 15, panelY + 68);
            ctx.fillText('Based on projection direction', panelX + 15, panelY + 85);
        }

        // Formula panel
        const fPanelW = 180, fPanelH = 50, fPanelX = w - fPanelW - 15, fPanelY = 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(fPanelX, fPanelY, fPanelW, fPanelH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#aaa';
        switch (currentMetric) {
            case 'euclidean':
                ctx.fillText('sim = 1 / (1 + d)', fPanelX + 12, fPanelY + 22);
                ctx.fillStyle = '#666';
                ctx.fillText('P = softmax(sim)', fPanelX + 12, fPanelY + 38);
                break;
            case 'dot':
                ctx.fillText('sim = a · x', fPanelX + 12, fPanelY + 22);
                ctx.fillStyle = '#666';
                ctx.fillText('P = softmax(sim)', fPanelX + 12, fPanelY + 38);
                break;
            case 'yat':
                ctx.fillText('sim = (a·x)² / d²', fPanelX + 12, fPanelY + 22);
                ctx.fillStyle = '#666';
                ctx.fillText('P = softmax(sim)', fPanelX + 12, fPanelY + 38);
                break;
        }

        // Instructions at bottom
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('Click anywhere to add anchors (max 5) • Use buttons to switch metrics', w / 2, h - 12);
        ctx.textAlign = 'left';
    }

    function getMetricColor() {
        switch (currentMetric) {
            case 'euclidean': return '#f4a261';
            case 'dot': return '#9b5de5';
            case 'yat': return COLORS.primary;
        }
    }

    function getMetricName() {
        switch (currentMetric) {
            case 'euclidean': return 'Euclidean';
            case 'dot': return 'Dot Product';
            case 'yat': return 'Yat';
        }
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        if (e.clientY - rect.top > rect.height - 40) return;

        if (anchors.length < 5) {
            anchors.push({ x, y });
            draw();
        }
    });

    document.getElementById('viz-bound-euclidean')?.addEventListener('click', () => {
        currentMetric = 'euclidean';
        draw();
    });

    document.getElementById('viz-bound-dot')?.addEventListener('click', () => {
        currentMetric = 'dot';
        draw();
    });

    document.getElementById('viz-bound-yat')?.addEventListener('click', () => {
        currentMetric = 'yat';
        draw();
    });

    document.getElementById('viz-bound-reset')?.addEventListener('click', () => {
        anchors = [
            { x: -80, y: 0 },
            { x: 80, y: 0 }
        ];
        draw();
    });

    document.getElementById('viz-bound-add')?.addEventListener('click', () => {
        if (anchors.length < 5) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            anchors.push({ x, y });
            draw();
        }
    });

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); draw(); });
}
