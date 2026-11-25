// Canvas kit: one job — the small drawing helpers every painter shares:
// rounded rectangles, one-line text and progress bars.
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

export function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(15,38,34,0.85)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2);
    ctx.fill();
  }
}
