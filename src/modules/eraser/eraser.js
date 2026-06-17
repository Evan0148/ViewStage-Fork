export function renderEraseSegment(ctx, fromX, fromY, toX, toY, lineWidth) {
    const hw = lineWidth / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    ctx.rect(fromX - hw, fromY - hw, lineWidth, lineWidth);
    ctx.rect(toX - hw, toY - hw, lineWidth, lineWidth);
    if (dx !== 0 && dy !== 0) {
        if ((dx >= 0) === (dy >= 0)) {
            ctx.moveTo(fromX + hw, fromY - hw);
            ctx.lineTo(fromX - hw, fromY + hw);
            ctx.lineTo(toX - hw, toY + hw);
            ctx.lineTo(toX + hw, toY - hw);
        } else {
            ctx.moveTo(fromX - hw, fromY - hw);
            ctx.lineTo(fromX + hw, fromY + hw);
            ctx.lineTo(toX + hw, toY + hw);
            ctx.lineTo(toX - hw, toY - hw);
        }
        ctx.closePath();
    }
}

export function renderEraseStroke(ctx, stroke, baseLineWidth, strokeScale, renderScale) {
    const hasVariableWidths = stroke.variableWidths && stroke.variableWidths.length > 0;
    ctx.beginPath();
    for (let i = 0; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        const w = hasVariableWidths && stroke.variableWidths[i] !== undefined
            ? stroke.variableWidths[i] * strokeScale / renderScale
            : baseLineWidth;
        renderEraseSegment(ctx, pt.fromX, pt.fromY, pt.toX, pt.toY, w);
    }
    ctx.fill();
}
