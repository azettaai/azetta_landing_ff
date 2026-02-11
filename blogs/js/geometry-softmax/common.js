export const COLORS = {
    primary: '#1b998b',
    accent: '#ed217c',
    light: '#f4f1de',
    dim: 'rgba(244, 241, 222, 0.3)',
    grid: 'rgba(27, 153, 139, 0.2)',
    purple: '#9b5de5',
    orange: '#f4a261',
    green: '#64c864',
    pink: '#e67ea3'
};

export const PROTO_COLORS = [
    '#1b998b',  // teal
    '#ed217c',  // pink
    '#9b5de5',  // purple
    '#f4a261',  // orange
    '#64c864',  // green
    '#e6c74c',  // gold
    '#4cc9f0',  // cyan
    '#ff6b6b'   // red
];

export function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    return {
        canvas,
        ctx,
        get w() { return canvas.getBoundingClientRect().width; },
        get h() { return canvas.getBoundingClientRect().height; }
    };
}

// Similarity functions
export function dotProduct(x, y, wx, wy) {
    return x * wx + y * wy;
}

export function cosineSimilarity(x, y, wx, wy) {
    const dot = x * wx + y * wy;
    const magX = Math.sqrt(x * x + y * y) || 1e-10;
    const magW = Math.sqrt(wx * wx + wy * wy) || 1e-10;
    return dot / (magX * magW);
}

export function negEuclidean(x, y, wx, wy) {
    const dx = x - wx;
    const dy = y - wy;
    return -Math.sqrt(dx * dx + dy * dy);
}

export function yatProduct(x, y, wx, wy) {
    const dot = x * wx + y * wy;
    const dx = x - wx;
    const dy = y - wy;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < 1e-6) return 1e6;
    return (dot * dot) / dist2;
}

// Softmax over an array of logits
export function softmax(logits) {
    const max = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
}

// Get winning class at a point given prototypes and a similarity fn
export function getWinner(x, y, prototypes, simFn) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < prototypes.length; i++) {
        const val = simFn(x, y, prototypes[i].x, prototypes[i].y);
        if (val > bestVal) {
            bestVal = val;
            bestIdx = i;
        }
    }
    return bestIdx;
}

// Get softmax probabilities at a point
export function getSoftmaxProbs(x, y, prototypes, simFn, temperature = 1) {
    const logits = prototypes.map(p => simFn(x, y, p.x, p.y) / temperature);
    return softmax(logits);
}

// Draw grid background
export function drawGrid(ctx, w, h, spacing = 40) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

// Draw axes through center
export function drawAxes(ctx, w, h, cx, cy) {
    ctx.strokeStyle = 'rgba(244, 241, 222, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
}

// Draw a prototype marker
export function drawPrototype(ctx, px, py, color, radius = 8, label = '') {
    // Outer glow
    ctx.beginPath();
    ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = color + '33';
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    if (label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, px, py - radius - 8);
    }
}

// Color interpolation
export function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}
