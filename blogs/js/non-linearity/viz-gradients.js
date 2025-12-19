import { COLORS } from './common.js';

export function initVizGradients() {
    const canvas = document.getElementById('viz-gradients');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let anchors = [{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, color: COLORS.accent }];
    let currentMetric = 'yat'; // 'yat', 'euclidean', 'dot'
    let animating = false;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Gradient computations for each metric
    // Returns { gx, gy } normalized gradient vector pointing toward steepest ascent
    function computeGradient(px, py, ax, ay, metric) {
        const eps = 0.5;

        function getValue(x, y) {
            switch (metric) {
                case 'euclidean': {
                    // Euclidean distance: sqrt((x-ax)² + (y-ay)²)
                    // Gradient points AWAY from anchor (increasing distance)
                    const dx = x - ax, dy = y - ay;
                    return Math.sqrt(dx * dx + dy * dy);
                }
                case 'dot': {
                    // Dot product: ax * x + ay * y
                    // Gradient is constant: (ax, ay)
                    return ax * x + ay * y;
                }
                case 'yat': {
                    // Yat = (dot)² / dist²
                    const dot = ax * x + ay * y;
                    const dx = x - ax, dy = y - ay;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 0.1) return 100;
                    return (dot * dot) / distSq;
                }
            }
        }

        // Numerical gradient via central differences
        const vxp = getValue(px + eps, py);
        const vxm = getValue(px - eps, py);
        const vyp = getValue(px, py + eps);
        const vym = getValue(px, py - eps);

        let gx = (vxp - vxm) / (2 * eps);
        let gy = (vyp - vym) / (2 * eps);

        // Normalize
        const mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > 0.001) {
            gx /= mag;
            gy /= mag;
        }

        return { gx, gy, mag };
    }

    // Combine gradients from multiple anchors
    function computeCombinedGradient(px, py, metric) {
        let totalGx = 0, totalGy = 0;

        anchors.forEach(anchor => {
            const g = computeGradient(px, py, anchor.x, anchor.y, metric);
            totalGx += g.gx * g.mag;
            totalGy += g.gy * g.mag;
        });

        const mag = Math.sqrt(totalGx * totalGx + totalGy * totalGy);
        if (mag > 0.001) {
            totalGx /= mag;
            totalGy /= mag;
        }

        return { gx: totalGx, gy: totalGy, mag };
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
            case 'euclidean': return 'Euclidean Distance';
            case 'dot': return 'Dot Product';
            case 'yat': return 'Yat Metric';
        }
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Background grid
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw gradient field (electrostatic style)
        const spacing = 25;
        const arrowLen = 12;
        const metricColor = getMetricColor();

        for (let x = spacing; x < w - spacing; x += spacing) {
            for (let y = spacing; y < h - spacing; y += spacing) {
                // Convert to centered coordinates
                const px = x - cx;
                const py = y - cy;

                // Skip if too close to any anchor
                let tooClose = false;
                for (const anchor of anchors) {
                    const dx = px - anchor.x;
                    const dy = py - anchor.y;
                    if (dx * dx + dy * dy < 400) {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose) continue;

                const grad = computeCombinedGradient(px, py, currentMetric);

                // Arrow base
                const ax = x;
                const ay = y;
                // Arrow tip
                const tx = x + grad.gx * arrowLen;
                const ty = y + grad.gy * arrowLen;

                // Draw arrow line
                ctx.strokeStyle = metricColor;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.6 + Math.min(grad.mag * 0.1, 0.4);
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                // Arrow head
                const angle = Math.atan2(grad.gy, grad.gx);
                ctx.fillStyle = metricColor;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - 5 * Math.cos(angle - 0.5), ty - 5 * Math.sin(angle - 0.5));
                ctx.lineTo(tx - 5 * Math.cos(angle + 0.5), ty - 5 * Math.sin(angle + 0.5));
                ctx.closePath();
                ctx.fill();

                ctx.globalAlpha = 1;
            }
        }

        // Draw anchors (charges)
        anchors.forEach((anchor, idx) => {
            const ax = cx + anchor.x;
            const ay = cy + anchor.y;

            // Glow effect
            const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, 30);
            grad.addColorStop(0, 'rgba(230, 126, 163, 0.8)');
            grad.addColorStop(0.5, 'rgba(230, 126, 163, 0.3)');
            grad.addColorStop(1, 'rgba(230, 126, 163, 0)');
            ctx.beginPath();
            ctx.arc(ax, ay, 30, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Point
            ctx.beginPath();
            ctx.arc(ax, ay, 8, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.accent;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px "Courier New", monospace';
            ctx.fillText(`A${idx + 1}`, ax + 12, ay + 4);
        });

        // Legend panel
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(12, 12, 220, 85);
        ctx.strokeStyle = metricColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, 220, 85);

        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = metricColor;
        ctx.fillText(getMetricName(), 22, 32);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = COLORS.light;
        ctx.fillText(`Anchors: ${anchors.length}`, 22, 50);
        ctx.fillStyle = COLORS.dim;
        ctx.fillText('Click canvas to add anchor', 22, 65);
        ctx.fillText('Buttons: switch metric / reset', 22, 80);

        // Draw metric formula
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(w - 180, 12, 168, 50);
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(w - 180, 12, 168, 50);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#aaa';
        switch (currentMetric) {
            case 'euclidean':
                ctx.fillText('∇d = (x-a) / ||x-a||', w - 170, 30);
                ctx.fillText('Points away from anchor', w - 170, 48);
                break;
            case 'dot':
                ctx.fillText('∇(a·x) = a', w - 170, 30);
                ctx.fillText('Constant direction', w - 170, 48);
                break;
            case 'yat':
                ctx.fillText('∇Yat = complex!', w - 170, 30);
                ctx.fillText('Curves around anchors', w - 170, 48);
                break;
        }
    }

    // Click to add anchor
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Check if clicked on button area (bottom)
        if (e.clientY - rect.top > rect.height - 50) return;

        if (anchors.length < 5) {
            anchors.push({ x, y, color: COLORS.accent });
            draw();
        }
    });

    // Button handlers
    document.getElementById('viz-grad-euclidean')?.addEventListener('click', () => {
        currentMetric = 'euclidean';
        draw();
    });

    document.getElementById('viz-grad-dot')?.addEventListener('click', () => {
        currentMetric = 'dot';
        draw();
    });

    document.getElementById('viz-grad-yat')?.addEventListener('click', () => {
        currentMetric = 'yat';
        draw();
    });

    document.getElementById('viz-grad-reset')?.addEventListener('click', () => {
        anchors = [{ x: 0, y: 0, color: COLORS.accent }];
        draw();
    });

    document.getElementById('viz-grad-add')?.addEventListener('click', () => {
        if (anchors.length < 5) {
            // Add at random position
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            anchors.push({ x, y, color: COLORS.accent });
            draw();
        }
    });

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); draw(); });
}
