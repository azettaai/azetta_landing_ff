/**
 * YAT Manifold Visualization
 * A 3D curved surface showing how the YAT metric creates gravity-well-like
 * deformations in representation space. Supports multiple neurons.
 * Grid colored by dominant neuron at each point.
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

    // Multiple neurons (masses bending spacetime)
    const neuronColors = ['#4ff975', '#4deeea', '#f9d71c', '#f038ff', '#ed217c'];
    let neurons = [
        { x: 80, y: 60, color: neuronColors[0] }
    ];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    // Compute YAT for a single neuron
    function computeSingleYat(pointX, pointY, neuron) {
        const dotProduct = neuron.x * pointX + neuron.y * pointY;
        const dx = pointX - neuron.x, dy = pointY - neuron.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 0.01) return 200;
        return (dotProduct * dotProduct) / distanceSquared;
    }

    // Find dominant neuron at a point (returns index and total yat)
    function getDominantNeuron(pointX, pointY) {
        let maxYat = 0, dominantIdx = 0, totalYat = 0;
        for (let i = 0; i < neurons.length; i++) {
            const yat = computeSingleYat(pointX, pointY, neurons[i]);
            totalYat += yat;
            if (yat > maxYat) {
                maxYat = yat;
                dominantIdx = i;
            }
        }
        return { idx: dominantIdx, total: Math.log(1 + totalYat), max: maxYat };
    }

    // Isometric 3D projection
    function project(x, y, z) {
        const cosR = Math.cos(rotationAngle);
        const sinR = Math.sin(rotationAngle);
        const rx = x * cosR - y * sinR;
        const ry = x * sinR + y * cosR;
        return { x: rx, y: ry * tiltAngle + z };
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2 - 10;

        // Grid parameters
        const gridRes = 25;
        const spacing = 10;

        // Compute grid data with dominant neuron info
        let maxYat = 0.01;
        const gridData = [];
        for (let i = 0; i <= gridRes; i++) {
            gridData[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const worldX = (j - gridRes / 2) * spacing;
                const worldY = (i - gridRes / 2) * spacing;
                const result = getDominantNeuron(worldX, worldY);
                gridData[i][j] = { worldX, worldY, ...result };
                if (result.total > maxYat) maxYat = result.total;
            }
        }

        const wellDepth = 70 / Math.max(maxYat, 0.1);

        // Build height map with colors
        const heights = [];
        for (let i = 0; i <= gridRes; i++) {
            heights[i] = [];
            for (let j = 0; j <= gridRes; j++) {
                const gd = gridData[i][j];
                const depth = Math.min(gd.total * wellDepth, 100);
                heights[i][j] = {
                    worldX: gd.worldX,
                    worldY: gd.worldY,
                    depth,
                    color: neurons[gd.idx].color,
                    intensity: Math.min(depth / 70, 1)
                };
            }
        }

        // Draw horizontal grid lines with per-segment coloring
        for (let i = 0; i <= gridRes; i++) {
            for (let j = 0; j < gridRes; j++) {
                const h1 = heights[i][j];
                const h2 = heights[i][j + 1];
                const p1 = project(h1.worldX, h1.worldY, h1.depth);
                const p2 = project(h2.worldX, h2.worldY, h2.depth);

                // Use the color of the point with higher intensity
                const color = h1.intensity >= h2.intensity ? h1.color : h2.color;
                const intensity = Math.max(h1.intensity, h2.intensity);

                ctx.beginPath();
                ctx.moveTo(cx + p1.x, cy + p1.y);
                ctx.lineTo(cx + p2.x, cy + p2.y);
                ctx.strokeStyle = hexToRgba(color, 0.3 + intensity * 0.5);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw vertical grid lines with per-segment coloring
        for (let j = 0; j <= gridRes; j++) {
            for (let i = 0; i < gridRes; i++) {
                const h1 = heights[i][j];
                const h2 = heights[i + 1][j];
                const p1 = project(h1.worldX, h1.worldY, h1.depth);
                const p2 = project(h2.worldX, h2.worldY, h2.depth);

                const color = h1.intensity >= h2.intensity ? h1.color : h2.color;
                const intensity = Math.max(h1.intensity, h2.intensity);

                ctx.beginPath();
                ctx.moveTo(cx + p1.x, cy + p1.y);
                ctx.lineTo(cx + p2.x, cy + p2.y);
                ctx.strokeStyle = hexToRgba(color, 0.3 + intensity * 0.5);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw all neurons at bottom of their wells
        for (let idx = 0; idx < neurons.length; idx++) {
            const n = neurons[idx];
            const dotP = n.x * n.x + n.y * n.y;
            const neuronDepth = Math.min(Math.log(1 + dotP * 10) * wellDepth, 100);
            const neuronScreen = project(n.x, n.y, neuronDepth);

            // Glow
            const grad = ctx.createRadialGradient(
                cx + neuronScreen.x, cy + neuronScreen.y, 0,
                cx + neuronScreen.x, cy + neuronScreen.y, 18
            );
            grad.addColorStop(0, hexToRgba(n.color, 0.9));
            grad.addColorStop(0.5, hexToRgba(n.color, 0.3));
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx + neuronScreen.x, cy + neuronScreen.y, 18, 0, Math.PI * 2);
            ctx.fill();

            // Neuron point
            ctx.beginPath();
            ctx.arc(cx + neuronScreen.x, cy + neuronScreen.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.font = '8px monospace';
            ctx.fillStyle = hexToRgba(n.color, 0.8);
            ctx.textAlign = 'center';
            ctx.fillText('w' + (idx + 1), cx + neuronScreen.x, cy + neuronScreen.y + 14);
        }

        // Formula and neuron count
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(79, 249, 117, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('ⵟ = Σ (x·wᵢ)² / ||x-wᵢ||²', 10, h - 10);

        ctx.textAlign = 'right';
        ctx.fillText(`neurons: ${neurons.length}/5`, w - 10, h - 10);

        // Auto-rotate
        rotationAngle += 0.003;
        requestAnimationFrame(draw);
    }

    // Click to add/remove neurons
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - w / 2;
        const my = e.clientY - rect.top - h / 2 + 10;
        const cosR = Math.cos(-rotationAngle);
        const sinR = Math.sin(-rotationAngle);
        const worldX = mx * cosR - (my / tiltAngle) * sinR;
        const worldY = mx * sinR + (my / tiltAngle) * cosR;

        // Check if clicking on existing neuron to remove
        for (let i = 0; i < neurons.length; i++) {
            const dx = neurons[i].x - worldX;
            const dy = neurons[i].y - worldY;
            if (Math.sqrt(dx * dx + dy * dy) < 20 && neurons.length > 1) {
                neurons.splice(i, 1);
                return;
            }
        }

        // Add new neuron if under limit
        if (neurons.length < 5) {
            const clampedX = Math.max(-120, Math.min(120, worldX));
            const clampedY = Math.max(-120, Math.min(120, worldY));
            neurons.push({
                x: clampedX,
                y: clampedY,
                color: neuronColors[neurons.length % neuronColors.length]
            });
        }
    });

    window.addEventListener('resize', resize);
    resize();
    draw();
})();
