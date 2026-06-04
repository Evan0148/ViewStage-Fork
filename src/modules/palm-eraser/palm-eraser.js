export const PALM_CONFIG = {
    penThreshold: 5,
    fingerThreshold: 15,
    palmMultiplier: 2.5,
    palmSizeMultiplier: 1.2,
    eraserSizeK: 1.0,
    fallbackTouchCount: 4,
    fallbackSpread: 300,
    candidateDelay: 150,
    palmEraserSize: 60,
};

export function is_palm_by_pointer(e) {
    if (typeof e.width !== 'number' || e.width <= 0 || typeof e.height !== 'number' || e.height <= 0) {
        return { isPalm: false, width: 0, height: 0 };
    }
    const w = e.width;
    const h = e.height;
    const threshold = PALM_CONFIG.fingerThreshold;
    return {
        isPalm: w > threshold * PALM_CONFIG.palmMultiplier,
        width: w,
        height: h
    };
}

export function compute_palm_eraser_size(touches) {
    let cx = 0, cy = 0;
    for (const t of touches) { cx += t.clientX; cy += t.clientY; }
    cx /= touches.length;
    cy /= touches.length;
    let sumSq = 0;
    for (const t of touches) {
        const dx = t.clientX - cx;
        const dy = t.clientY - cy;
        sumSq += dx * dx + dy * dy;
    }
    const stdDev = touches.length > 1 ? Math.sqrt(sumSq / touches.length) : 0;
    return Math.max(40, Math.min(150, stdDev * 3));
}

export function is_palm_by_touch_count(touches) {
    if (touches.length < PALM_CONFIG.fallbackTouchCount) return false;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of touches) {
        if (t.clientX < minX) minX = t.clientX;
        if (t.clientX > maxX) maxX = t.clientX;
        if (t.clientY < minY) minY = t.clientY;
        if (t.clientY > maxY) maxY = t.clientY;
    }
    return Math.max(maxX - minX, maxY - minY) < PALM_CONFIG.fallbackSpread;
}

export function get_palm_center(touches) {
    let cx = 0, cy = 0;
    for (const t of touches) {
        cx += t.clientX;
        cy += t.clientY;
    }
    return { x: cx / touches.length, y: cy / touches.length };
}
