import { COLORS, drawText } from './common.js';

/**
 * Visualization: Physics Optimization
 * Shows how physics solves problems through optimization (light path, water flow)
 */
export function initVizOptimization() {
    const canvas = document.getElementById('viz-optimization');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        const leftX = w * 0.25;
        const rightX = w * 0.75;

        // === LEFT: Light takes shortest path ===
        const lightStartX = leftX - 50;
        const lightStartY = h * 0.25;
        const lightEndX = leftX + 50;
        const lightEndY = h * 0.65;
        const mirrorY = h * 0.45;

        // Mirror surface
        ctx.fillStyle = 'rgba(155, 93, 229, 0.3)';
        ctx.fillRect(leftX - 60, mirrorY - 2, 120, 4);
        ctx.strokeStyle = COLORS.purple;
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX - 60, mirrorY - 2, 120, 4);

        // Calculate reflection point
        const reflectX = leftX + (time % 200 - 100) * 0.3;

        // Optimal path (animated light beam)
        const progress = (time % 100) / 100;

        // Incident ray
        const incidentGrad = ctx.createLinearGradient(lightStartX, lightStartY, leftX, mirrorY);
        incidentGrad.addColorStop(0, 'rgba(255, 220, 100, 0)');
        incidentGrad.addColorStop(progress, 'rgba(255, 220, 100, 0.8)');
        incidentGrad.addColorStop(Math.min(progress + 0.1, 1), 'rgba(255, 220, 100, 0)');

        ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lightStartX, lightStartY);
        ctx.lineTo(leftX, mirrorY);
        ctx.stroke();

        // Reflected ray
        ctx.beginPath();
        ctx.moveTo(leftX, mirrorY);
        ctx.lineTo(lightEndX, lightEndY);
        ctx.stroke();

        // Light source
        ctx.fillStyle = '#ffdc64';
        ctx.beginPath();
        ctx.arc(lightStartX, lightStartY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Target
        ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(lightEndX, lightEndY, 8, 0, Math.PI * 2);
        ctx.fill();

        drawText(ctx, 'LIGHT', leftX, h * 0.12, { color: '#ffdc64', size: 10 });
        drawText(ctx, 'Takes shortest path', leftX, h * 0.8, { color: '#666', size: 8 });
        drawText(ctx, '(Fermat\'s principle)', leftX, h * 0.87, { color: '#555', size: 7 });

        // === RIGHT: Water finds lowest point ===
        const waterStartY = h * 0.2;
        const waterEndY = h * 0.7;

        // Terrain
        ctx.fillStyle = 'rgba(100, 80, 60, 0.5)';
        ctx.beginPath();
        ctx.moveTo(rightX - 80, waterEndY);
        ctx.lineTo(rightX - 60, waterStartY + 30);
        ctx.lineTo(rightX - 30, waterStartY + 50);
        ctx.lineTo(rightX, waterEndY - 20);
        ctx.lineTo(rightX + 30, waterStartY + 40);
        ctx.lineTo(rightX + 60, waterStartY + 20);
        ctx.lineTo(rightX + 80, waterEndY);
        ctx.closePath();
        ctx.fill();

        // Water flow (animated droplets)
        for (let i = 0; i < 5; i++) {
            const dropProgress = ((time * 2 + i * 50) % 200) / 200;
            const dropY = waterStartY + (waterEndY - waterStartY) * dropProgress;
            const dropX = rightX + Math.sin(dropProgress * Math.PI * 3) * 20;

            ctx.fillStyle = `rgba(27, 153, 139, ${1 - dropProgress * 0.5})`;
            ctx.beginPath();
            ctx.arc(dropX, dropY, 4 - dropProgress * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Water pool at bottom
        ctx.fillStyle = 'rgba(27, 153, 139, 0.4)';
        ctx.beginPath();
        ctx.ellipse(rightX, waterEndY - 10, 40, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        drawText(ctx, 'WATER', rightX, h * 0.12, { color: COLORS.primary, size: 10 });
        drawText(ctx, 'Finds lowest point', rightX, h * 0.8, { color: '#666', size: 8 });
        drawText(ctx, '(Energy minimization)', rightX, h * 0.87, { color: '#555', size: 7 });

        // Title
        drawText(ctx, 'Physics Computes Optimal Solutions', w / 2, 18, { color: '#555', size: 10 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
