const ERASER_SPEED_BUFFER_SIZE = 5;

export function eraser_speed_create_state() {
    return {
        speedBuffer: [],
        lastDrawTime: performance.now(),
        lastDrawX: null,
        lastDrawY: null
    };
}

export function eraser_speed_build_config(DRAW_CONFIG, invScale) {
    return {
        eraserSpeedEnabled: DRAW_CONFIG.eraserSpeedEnabled,
        eraserSpeedMinSize: DRAW_CONFIG.eraserSpeedMinSize * invScale,
        eraserSpeedMaxSize: DRAW_CONFIG.eraserSpeedMaxSize * invScale,
        eraserSpeedFactor: DRAW_CONFIG.eraserSpeedFactor
    };
}

export function eraser_speed_update(state, stroke, toX, toY) {
    const now = performance.now();
    const dt = now - state.lastDrawTime;
    let currentWidth = stroke.lineWidth;

    if (state.lastDrawX !== null && dt > 0) {
        const dx = toX - state.lastDrawX;
        const dy = toY - state.lastDrawY;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;

        state.speedBuffer.push(speed);
        if (state.speedBuffer.length > ERASER_SPEED_BUFFER_SIZE) {
            state.speedBuffer.shift();
        }

        const avgSpeed = state.speedBuffer.reduce((a, b) => a + b, 0) / state.speedBuffer.length;
        const sizeRange = stroke.eraserSpeedMaxSize - stroke.eraserSpeedMinSize;
        currentWidth = stroke.eraserSpeedMinSize + Math.min(avgSpeed * stroke.eraserSpeedFactor * 100, sizeRange);
        currentWidth = Math.max(stroke.eraserSpeedMinSize, Math.min(stroke.eraserSpeedMaxSize, currentWidth));
    }

    state.lastDrawTime = now;
    state.lastDrawX = toX;
    state.lastDrawY = toY;

    return currentWidth;
}
