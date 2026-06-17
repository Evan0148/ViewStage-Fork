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

/** 根据 PointerEvent 触点宽高计算正方形擦除大小（取 min 以消除旋转角度影响），首次检测后固定 */
export function compute_palm_eraser_size_from_pointer(width, height) {
    const dim = Math.min(width, height);
    const size = dim * PALM_CONFIG.palmSizeMultiplier * PALM_CONFIG.eraserSizeK;
    return Math.max(40, Math.min(150, size));
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

/**
 * PalmEraserSession — 手掌擦除会话，封装 start / update / end 公共逻辑。
 *
 * host 接口：
 *   getCanvasRect()           → { left, top }
 *   getScale()                → number（canvas 坐标缩放）
 *   batchDrawManager          → BatchDraw 实例
 *   defaultEraserSize?        → number（默认手掌擦除大小）
 *   showHint?()
 *   updateHint?(clientX, clientY, size)
 *   hideHint?()
 *   onSessionStart?(stroke, session)
 *   onSessionEnd?()
 */
export class PalmEraserSession {
    constructor(host) {
        this.host = host;
        this.isErasing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.cachedInvScale = 1;
        this.palmEraserSize = 60;
        this.currentStroke = null;
    }

    start(clientX, clientY, eraserWidth) {
        if (this.isErasing) return null;
        const h = this.host;
        this.isErasing = true;
        this.palmEraserSize = eraserWidth || h.defaultEraserSize || 60;

        const rect = h.getCanvasRect();
        const scale = h.getScale();
        this.cachedInvScale = 1 / Math.max(0.001, scale);
        const inv = this.cachedInvScale;
        this.lastX = (clientX - rect.left) * inv;
        this.lastY = (clientY - rect.top) * inv;

        const baseSize = this.palmEraserSize * inv;
        this.currentStroke = {
            type: 'erase',
            points: [],
            color: '#000000',
            lineWidth: baseSize,
            eraserSize: baseSize,
            eraserSizeRaw: this.palmEraserSize,
            eraserShape: 'square',
            eraserSpeedEnabled: false,
            scale: scale || 1,
            bounds: { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
            variableWidths: []
        };

        h.showHint?.();
        h.updateHint?.(clientX, clientY, this.palmEraserSize);
        h.batchDrawManager.batch_draw_init_start();
        h.batchDrawManager.eraserShape = 'square';
        h.onSessionStart?.(this.currentStroke, this);

        return this.currentStroke;
    }

    update(clientX, clientY) {
        if (!this.isErasing) return;
        const h = this.host;
        const rect = h.getCanvasRect();
        const inv = this.cachedInvScale;
        const x = (clientX - rect.left) * inv;
        const y = (clientY - rect.top) * inv;
        const dx = x - this.lastX;
        const dy = y - this.lastY;

        h.updateHint?.(clientX, clientY, this.palmEraserSize);

        if (dx !== 0 || dy !== 0) {
            const stroke = this.currentStroke;
            const b = stroke.bounds;
            if (this.lastX < b.minX) b.minX = this.lastX;
            if (x < b.minX) b.minX = x;
            if (this.lastY < b.minY) b.minY = this.lastY;
            if (y < b.minY) b.minY = y;
            if (this.lastX > b.maxX) b.maxX = this.lastX;
            if (x > b.maxX) b.maxX = x;
            if (this.lastY > b.maxY) b.maxY = this.lastY;
            if (y > b.maxY) b.maxY = y;

            stroke.variableWidths.push(stroke.lineWidth);
            stroke.points.push({ fromX: this.lastX, fromY: this.lastY, toX: x, toY: y });

            h.batchDrawManager.batch_draw_create_command(
                'erase', this.lastX, this.lastY, x, y,
                '#000000', this.palmEraserSize * inv
            );
            this.lastX = x;
            this.lastY = y;
        }
    }

    async end() {
        if (!this.isErasing) return;
        this.isErasing = false;
        const h = this.host;
        h.hideHint?.();
        await h.submitStroke(this.currentStroke);
        h.onSessionEnd?.();
        this.currentStroke = null;
    }
}
