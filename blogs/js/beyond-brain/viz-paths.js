import { COLORS, drawText } from './common.js';

/**
 * Visualization: Biology vs Physics Paths
 * Shows two paths to AGI: mimicking biology (dead end) vs physics principles (success)
 */
export function initVizPaths() {
    const canvas = document.getElementById('viz-paths');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Particles walking each path
    const biologyParticles = [];
    const physicsParticles = [];

    for (let i = 0; i < 8; i++) {
        biologyParticles.push({ progress: Math.random(), speed: 0.002 + Math.random() * 0.002 });
        physicsParticles.push({ progress: Math.random(), speed: 0.003 + Math.random() * 0.002 });
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        const startX = w * 0.12;
        const endX = w * 0.88;
        const centerY = h * 0.5;
        const topPathY = h * 0.28;
        const bottomPathY = h * 0.72;

        // === STARTING POINT ===
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(startX, centerY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawText(ctx, 'TODAY', startX, centerY + 4, { color: '#888', size: 9 });
        drawText(ctx, 'Current AI', startX, centerY + 45, { color: '#555', size: 8 });

        // === BIOLOGY PATH (TOP) - Chaotic, uncertain, dead end ===
        // Dark fog effect
        const fogGrad = ctx.createLinearGradient(startX, topPathY - 40, endX - 80, topPathY - 40);
        fogGrad.addColorStop(0, 'rgba(237, 33, 124, 0)');
        fogGrad.addColorStop(0.3, 'rgba(237, 33, 124, 0.08)');
        fogGrad.addColorStop(0.7, 'rgba(237, 33, 124, 0.15)');
        fogGrad.addColorStop(1, 'rgba(237, 33, 124, 0.05)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(startX + 30, topPathY - 60, w * 0.55, 80);

        // Wavy uncertain path
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(startX + 28, centerY - 15);

        const wallX = endX - 100;
        for (let x = startX + 40; x < wallX; x += 4) {
            const progress = (x - startX) / (wallX - startX);
            const baseY = centerY - 15 + (topPathY - centerY + 15) * Math.sin(progress * Math.PI * 0.9);
            const chaos = Math.sin(x * 0.15 + time * 0.04) * 12 + Math.sin(x * 0.08) * 8;
            ctx.lineTo(x, baseY + chaos);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // DEAD END WALL
        ctx.fillStyle = 'rgba(237, 33, 124, 0.2)';
        ctx.fillRect(wallX - 10, topPathY - 50, 20, 100);
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 3;
        ctx.strokeRect(wallX - 10, topPathY - 50, 20, 100);

        // X mark
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(wallX - 15, topPathY - 15);
        ctx.lineTo(wallX + 15, topPathY + 15);
        ctx.moveTo(wallX + 15, topPathY - 15);
        ctx.lineTo(wallX - 15, topPathY + 15);
        ctx.stroke();

        // Biology particles (wandering, confused)
        biologyParticles.forEach((p, i) => {
            p.progress += p.speed;
            if (p.progress > 0.95) p.progress = 0;

            const px = startX + 40 + (wallX - startX - 60) * p.progress;
            const baseY = centerY - 15 + (topPathY - centerY + 15) * Math.sin(p.progress * Math.PI * 0.9);
            const chaos = Math.sin(px * 0.15 + time * 0.04) * 12 + Math.sin(px * 0.08) * 8;
            const py = baseY + chaos;

            ctx.fillStyle = `rgba(237, 33, 124, ${0.4 + p.progress * 0.3})`;
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Labels
        drawText(ctx, 'BIOLOGY PATH', w * 0.4, topPathY - 55, { color: COLORS.secondary, size: 10 });
        drawText(ctx, '"Scale it up and hope"', w * 0.4, topPathY - 40, { color: '#666', size: 8 });
        drawText(ctx, 'DEAD', wallX, topPathY + 55, { color: COLORS.secondary, size: 10 });
        drawText(ctx, 'END', wallX, topPathY + 68, { color: COLORS.secondary, size: 10 });

        // === PHYSICS PATH (BOTTOM) - Clean, direct, reaches goal ===
        // Light trail glow
        const trailGrad = ctx.createLinearGradient(startX, bottomPathY, endX, bottomPathY);
        trailGrad.addColorStop(0, 'rgba(27, 153, 139, 0)');
        trailGrad.addColorStop(0.3, 'rgba(27, 153, 139, 0.15)');
        trailGrad.addColorStop(0.7, 'rgba(27, 153, 139, 0.25)');
        trailGrad.addColorStop(1, 'rgba(27, 153, 139, 0.4)');
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(startX + 30, centerY + 15);
        ctx.quadraticCurveTo(w * 0.4, centerY + 40, w * 0.55, bottomPathY);
        ctx.lineTo(endX - 35, centerY);
        ctx.lineTo(endX - 35, centerY + 20);
        ctx.quadraticCurveTo(w * 0.55, bottomPathY + 30, startX + 30, centerY + 30);
        ctx.closePath();
        ctx.fill();

        // Clean direct path
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX + 28, centerY + 15);
        ctx.quadraticCurveTo(w * 0.35, centerY + 30, w * 0.5, bottomPathY);
        ctx.quadraticCurveTo(w * 0.7, bottomPathY - 10, endX - 35, centerY);
        ctx.stroke();

        // Glow on path
        ctx.strokeStyle = 'rgba(27, 153, 139, 0.3)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(startX + 28, centerY + 15);
        ctx.quadraticCurveTo(w * 0.35, centerY + 30, w * 0.5, bottomPathY);
        ctx.quadraticCurveTo(w * 0.7, bottomPathY - 10, endX - 35, centerY);
        ctx.stroke();

        // Physics particles (smooth, directed)
        physicsParticles.forEach((p, i) => {
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 0;

            // Bezier curve position
            const t = p.progress;
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;

            // Two-segment bezier approximation
            let px, py;
            if (t < 0.5) {
                const st = t * 2;
                px = startX + 28 + (w * 0.5 - startX - 28) * st;
                py = centerY + 15 + (bottomPathY - centerY - 15) * Math.sin(st * Math.PI / 2);
            } else {
                const st = (t - 0.5) * 2;
                px = w * 0.5 + (endX - 35 - w * 0.5) * st;
                py = bottomPathY + (centerY - bottomPathY) * Math.sin(st * Math.PI / 2);
            }

            ctx.fillStyle = `rgba(27, 153, 139, ${0.6 + t * 0.4})`;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.fillStyle = `rgba(27, 153, 139, ${0.2})`;
            ctx.beginPath();
            ctx.arc(px - 8, py, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Labels
        drawText(ctx, 'PHYSICS PATH', w * 0.5, bottomPathY + 35, { color: COLORS.primary, size: 10 });
        drawText(ctx, '"First principles"', w * 0.5, bottomPathY + 50, { color: '#666', size: 8 });

        // === AGI GOAL ===
        const pulse = Math.sin(time * 0.04) * 0.3 + 0.7;

        // Outer glow rings
        for (let r = 50; r > 30; r -= 8) {
            ctx.fillStyle = `rgba(27, 153, 139, ${0.1 * pulse * (50 - r) / 20})`;
            ctx.beginPath();
            ctx.arc(endX, centerY, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Goal circle
        const goalGrad = ctx.createRadialGradient(endX, centerY, 0, endX, centerY, 30);
        goalGrad.addColorStop(0, `rgba(27, 153, 139, ${pulse})`);
        goalGrad.addColorStop(0.7, `rgba(27, 153, 139, ${0.7 * pulse})`);
        goalGrad.addColorStop(1, `rgba(27, 153, 139, ${0.4 * pulse})`);
        ctx.fillStyle = goalGrad;
        ctx.beginPath();
        ctx.arc(endX, centerY, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0d0d15';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AGI', endX, centerY + 5);

        drawText(ctx, 'True Intelligence', endX, centerY + 48, { color: COLORS.primary, size: 8 });

        // Title
        drawText(ctx, 'Two Paths to Intelligence', w / 2, 18, { color: '#555', size: 10 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
