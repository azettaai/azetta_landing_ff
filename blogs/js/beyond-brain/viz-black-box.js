import { COLORS, drawText } from './common.js';

/**
 * Visualization: Black Box to Black Box
 * Shows the problem of copying the brain (unknown) to create AI (also unknown)
 */
export function initVizBlackBox() {
    const canvas = document.getElementById('viz-black-box');
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

        // Background
        ctx.fillStyle = '#0d0d15';
        ctx.fillRect(0, 0, w, h);

        const brainX = w * 0.25;
        const aiX = w * 0.75;
        const centerY = h * 0.45;
        const boxSize = 70;

        // Arrow animation
        const arrowProgress = (Math.sin(time * 0.03) + 1) / 2;

        // Brain black box
        ctx.fillStyle = 'rgba(237, 33, 124, 0.2)';
        ctx.strokeStyle = COLORS.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(brainX - boxSize, centerY - boxSize, boxSize * 2, boxSize * 2, 10);
        ctx.fill();
        ctx.stroke();

        // Question marks inside brain
        ctx.fillStyle = COLORS.secondary;
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', brainX - 20 + Math.sin(time * 0.05) * 5, centerY - 10);
        ctx.fillText('?', brainX + 20, centerY + 10 + Math.cos(time * 0.04) * 5);
        ctx.fillText('?', brainX, centerY + 25 + Math.sin(time * 0.06) * 3);

        drawText(ctx, 'BRAIN', brainX, centerY - boxSize - 15, { color: COLORS.secondary, size: 12 });
        drawText(ctx, '(Black Box)', brainX, centerY + boxSize + 20, { color: '#666', size: 10 });

        // Arrow
        const arrowStartX = brainX + boxSize + 20;
        const arrowEndX = aiX - boxSize - 20;
        const arrowY = centerY;

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + arrowProgress * 0.3})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated dot on arrow
        const dotX = arrowStartX + (arrowEndX - arrowStartX) * arrowProgress;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(dotX, arrowY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - 10, arrowY - 8);
        ctx.lineTo(arrowEndX - 10, arrowY + 8);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        drawText(ctx, 'copy?', (arrowStartX + arrowEndX) / 2, arrowY - 15, { color: '#555', size: 9 });

        // AI black box
        ctx.fillStyle = 'rgba(155, 93, 229, 0.2)';
        ctx.strokeStyle = COLORS.purple;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(aiX - boxSize, centerY - boxSize, boxSize * 2, boxSize * 2, 10);
        ctx.fill();
        ctx.stroke();

        // Question marks inside AI
        ctx.fillStyle = COLORS.purple;
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText('?', aiX + Math.cos(time * 0.04) * 5, centerY - 15);
        ctx.fillText('?', aiX - 25 + Math.sin(time * 0.05) * 5, centerY + 15);
        ctx.fillText('?', aiX + 25, centerY + 20 + Math.cos(time * 0.06) * 3);

        drawText(ctx, 'AI MODEL', aiX, centerY - boxSize - 15, { color: COLORS.purple, size: 12 });
        drawText(ctx, '(Also Black Box)', aiX, centerY + boxSize + 20, { color: '#666', size: 10 });

        // Title and insight
        drawText(ctx, 'Copying What We Don\'t Understand', w / 2, 20, { color: '#555', size: 10 });
        drawText(ctx, 'Black box → Black box = No understanding gained', w / 2, h - 15, { color: '#444', size: 9 });

        time++;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); });
}
