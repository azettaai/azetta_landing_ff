/**
 * YAT Manifold Visualization
 * A 3D curved surface showing how the YAT metric creates gravity-well-like
 * deformations in representation space.
 * 
 * ⵟ(x,w) = (x·w)² / ||x-w||² + ε
 */
(function initYatManifold() {
    const canvas = document.getElementById('yat-viz-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let rotationAngle = 0.5;
    let tiltAngle = 0.6;

    // Anchor vector (the "mass" bending spacetime)
    let anchorVec = { x: 80, y: 60 };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // ⵟ = (x·w)² / ||x-w||²
    function computeYat(pointX, pointY) {
        const ax = anchorVec.x, ay = anchorVec.y;
        const dotProduct = ax * pointX + ay * pointY;
        const dx = pointX - ax, dy = pointY - ay;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 0.01) return Math.log(1 + 200);
        const yat = (dotProduct * dotProduct) / distanceSquared;
        return Math.log(1 + yat);
    }

    // Isometric 3D projection
    function project(x, y, z) {
        const cosR = Math.cos(rotationAngle);
        const sinR = Math.sin(rotationAngle);
        const rx = x * cosR - y * sinR;
        const ry = x * sinR + y * cosR;
        return { x: rx, y: ry * tiltAngle + z };
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2 - 10;

        // Grid parameters
        const gridRes = 25;
        const spacing = 10;

        // Compute Yat values and find max
        let maxYat = 0.01;
        const yatGrid = [];
        for (let i = 0; i <= gridRes; i++) {
            yatGrid[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const worldX = (j - gridRes / 2) * spacing;
                const worldY = (i - gridRes / 2) * spacing;
                const yat = computeYat(worldX, worldY);
                yatGrid[i][j] = yat;
                if (yat > maxYat) maxYat = yat;
            }
        }

        const wellDepth = 70 / Math.max(maxYat, 0.1);

        // Build height map
        const heights = [];
        for (let i = 0; i <= gridRes; i++) {
            heights[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const worldX = (j - gridRes / 2) * spacing;
                const worldY = (i - gridRes / 2) * spacing;
                const depth = Math.min(yatGrid[i][j] * wellDepth, 100);
                heights[i][j] = { worldX, worldY, depth };
            }
        }

        // Draw horizontal grid lines
        for (let i = 0; i <= gridRes; i++) {
            ctx.beginPath();
            let maxD = 0;
            for (let j = 0; j <= gridRes; j++) {
                const ht = heights[i][j];
                const p = project(ht.worldX, ht.worldY, ht.depth);
                if (j === 0) ctx.moveTo(cx + p.x, cy + p.y);
                else ctx.lineTo(cx + p.x, cy + p.y);
                maxD = Math.max(maxD, ht.depth);
            }
            const intensity = Math.min(maxD / 70, 1);
            ctx.strokeStyle = `hsla(145, 80%, ${30 + intensity * 30}%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw vertical grid lines
        for (let j = 0; j <= gridRes; j++) {
            ctx.beginPath();
            let maxD = 0;
            for (let i = 0; i <= gridRes; i++) {
                const ht = heights[i][j];
                const p = project(ht.worldX, ht.worldY, ht.depth);
                if (i === 0) ctx.moveTo(cx + p.x, cy + p.y);
                else ctx.lineTo(cx + p.x, cy + p.y);
                maxD = Math.max(maxD, ht.depth);
            }
            const intensity = Math.min(maxD / 70, 1);
            ctx.strokeStyle = `hsla(145, 80%, ${30 + intensity * 30}%, ${0.3 + intensity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw anchor at bottom of well
        const anchorDepth = Math.min(computeYat(anchorVec.x, anchorVec.y) * wellDepth, 100);
        const anchorScreen = project(anchorVec.x, anchorVec.y, anchorDepth);

        // Glow
        const grad = ctx.createRadialGradient(
            cx + anchorScreen.x, cy + anchorScreen.y, 0,
            cx + anchorScreen.x, cy + anchorScreen.y, 20
        );
        grad.addColorStop(0, 'rgba(79, 249, 117, 0.9)');
        grad.addColorStop(0.5, 'rgba(79, 249, 117, 0.3)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx + anchorScreen.x, cy + anchorScreen.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Anchor point
        ctx.beginPath();
        ctx.arc(cx + anchorScreen.x, cy + anchorScreen.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#4ff975';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(79, 249, 117, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText('w', cx + anchorScreen.x, cy + anchorScreen.y + 16);

        // Formula
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(79, 249, 117, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('ⵟ = (x·w)² / ||x-w||²', 10, h - 10);

        // Auto-rotate
        rotationAngle += 0.003;
        requestAnimationFrame(draw);
    }

    // Click to move anchor
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - w / 2;
        const my = e.clientY - rect.top - h / 2 + 10;
        const cosR = Math.cos(-rotationAngle);
        const sinR = Math.sin(-rotationAngle);
        const worldX = mx * cosR - (my / tiltAngle) * sinR;
        const worldY = mx * sinR + (my / tiltAngle) * cosR;
        anchorVec.x = Math.max(-120, Math.min(120, worldX));
        anchorVec.y = Math.max(-120, Math.min(120, worldY));
    });

    window.addEventListener('resize', resize);
    resize();
    draw();
})();
