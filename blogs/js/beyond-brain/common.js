// Shared utilities for beyond-brain visualizations
export const COLORS = {
    primary: '#1b998b',
    secondary: '#ed217c',
    accent: '#f4a261',
    purple: '#9b5de5',
    cyan: '#00bbf9',
    text: '#e0e0e0',
    dim: '#666'
};

export function drawText(ctx, text, x, y, options = {}) {
    const { color = COLORS.text, size = 12, align = 'center', font = 'Courier New' } = options;
    ctx.fillStyle = color;
    ctx.font = `${size}px "${font}", monospace`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}
