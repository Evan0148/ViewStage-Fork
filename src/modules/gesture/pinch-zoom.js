import { DeviceType, VirtualDeviceType, DeviceInputEvent, DeviceInputStartingEvent, DeviceInputStartedEvent, DeviceInputCompletedEvent } from './types.js';
import { getTolerance, TOLERANCE, detectDeviceType } from './tolerance.js';

/**
 * 两指捏合识别器
 *
 * 监听两个触摸点的距离变化，自动区分 pinch（缩放）和双指平移。
 * 触发事件：pinchStarted / pinchDelta / pinchCompleted
 */
export class PinchZoomSource {
    /**
     * @param {InputSource} inputSource - 已绑定的 InputSource 实例
     * @param {object} [options]
     * @param {number} [options.minScale=0.1] - 最小缩放限制
     * @param {number} [options.maxScale=10] - 最大缩放限制
     * @param {number} [options.toleranceSet] - 容差配置，默认 TOLERANCE.PINCH
     */
    constructor(inputSource, options = {}) {
        this._input = inputSource;
        this._minScale = options.minScale ?? 0.1;
        this._maxScale = options.maxScale ?? 10;
        this._toleranceSet = options.toleranceSet || TOLERANCE.PINCH;

        this._isPinching = false;
        this._pinchIds = [];
        this._startDistance = 0;
        this._startMidX = 0;
        this._startMidY = 0;
        this._scaleAtStart = 1;
        this._currentScale = 1;
        this._startFinger0 = { x: 0, y: 0 };
        this._startFinger1 = { x: 0, y: 0 };
        this._toleranceSq = 0;
        this._beyondTolerance = false;

        // 两指都在当前 batch 内收到过 inputMove 时才触发 onPinchDelta
        // 避免 PointerEvents 模式下，仅一指更新而另一指位置陈旧导致的偏斜
        this._movedThisBatch = [];

        // 预分配热路径对象（避免每帧 GC）
        this._finger0 = { x: 0, y: 0 };
        this._finger1 = { x: 0, y: 0 };
        this._deltaPayload = {
            scale: 1, centerX: 0, centerY: 0,
            originScale: 1, deltaScale: 0,
            startMidX: 0, startMidY: 0,
            finger0: this._finger0, finger1: this._finger1,
        };

        /** @type {function({ scale: number, centerX: number, centerY: number, originScale: number, deltaScale: number })|null} */
        this.onPinchStarted = null;

        /** @type {function({ scale: number, centerX: number, centerY: number, originScale: number, deltaScale: number })|null} */
        this.onPinchDelta = null;

        /** @type {function({ scale: number, centerX: number, centerY: number, originScale: number })|null} */
        this.onPinchCompleted = null;

        this._onInputDown = this._onInputDown.bind(this);
        this._onInputMove = this._onInputMove.bind(this);
        this._onInputUp = this._onInputUp.bind(this);

        inputSource.on('inputDown', this._onInputDown);
        inputSource.on('inputMove', this._onInputMove);
        inputSource.on('inputUp', this._onInputUp);
    }

    /** 当前是否正在捏合中 */
    get isPinching() {
        return this._isPinching;
    }

    /** 当前缩放值（仅在捏合中有意义） */
    get currentScale() {
        return this._currentScale;
    }

    destroy() {
        this._input.off('inputDown', this._onInputDown);
        this._input.off('inputMove', this._onInputMove);
        this._input.off('inputUp', this._onInputUp);
        this._isPinching = false;
    }

    _onInputDown(ev) {
        if (this._isPinching) return;
        if (this._input.activeCount < 2) return;

        const events = this._input.activeEvents;
        if (events.length < 2) return;
        this._pinchIds = [events[0].id, events[1].id];

        this._startPinch(events[0].position, events[1].position);
    }

    _startPinch(pos0, pos1) {
        const dx = pos0.x - pos1.x;
        const dy = pos0.y - pos1.y;
        this._startDistance = Math.sqrt(dx * dx + dy * dy);
        this._startMidX = (pos0.x + pos1.x) / 2;
        this._startMidY = (pos0.y + pos1.y) / 2;
        this._startFinger0.x = pos0.x;
        this._startFinger0.y = pos0.y;
        this._startFinger1.x = pos1.x;
        this._startFinger1.y = pos1.y;
        this._currentScale = 1;
        this._beyondTolerance = false;
        this._movedThisBatch = [];

        const tol = getTolerance(this._toleranceSet, DeviceType.Touch);
        this._toleranceSq = tol * tol;

        this._isPinching = true;

        if (this.onPinchStarted) {
            this.onPinchStarted({
                scale: 1,
                centerX: this._startMidX,
                centerY: this._startMidY,
                originScale: 1,
                deltaScale: 0,
                finger0: { x: pos0.x, y: pos0.y },
                finger1: { x: pos1.x, y: pos1.y },
            });
        }
    }

    _onInputMove(ev) {
        if (!this._isPinching) return;
        if (this._input.activeCount < 2) {
            this._finishPinch(VirtualDeviceType.Device);
            return;
        }

        // 通过 _pinchIds 查找两指的实际位置，而非取 positions[0]/[1]，
        // 避免第三指介入时 Map 遍历顺序改变导致追踪错位
        const events = this._input.activeEvents;
        let f0Ev = null, f1Ev = null;
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if (e.id === this._pinchIds[0]) f0Ev = e;
            if (e.id === this._pinchIds[1]) f1Ev = e;
        }
        if (!f0Ev || !f1Ev) {
            this._finishPinch(VirtualDeviceType.Device);
            return;
        }

        const dx = f0Ev.position.x - f1Ev.position.x;
        const dy = f0Ev.position.y - f1Ev.position.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const midX = (f0Ev.position.x + f1Ev.position.x) / 2;
        const midY = (f0Ev.position.y + f1Ev.position.y) / 2;

        if (this._startDistance === 0) return;

        const scaleRatio = currentDist / this._startDistance;
        const targetScale = Math.min(this._maxScale, Math.max(this._minScale, scaleRatio));
        const deltaScale = targetScale - this._currentScale;
        this._currentScale = targetScale;

        const midDx = midX - this._startMidX;
        const midDy = midY - this._startMidY;
        const moveDistSq = midDx * midDx + midDy * midDy;

        if (!this._beyondTolerance) {
            const distSq = (currentDist - this._startDistance) * (currentDist - this._startDistance);
            if (distSq < this._toleranceSq && moveDistSq < this._toleranceSq) {
                return;
            }
            this._beyondTolerance = true;
        }

        // Batch 追踪：仅在两指都在当前 batch 内收到过 inputMove 时才触发 delta，
        // 避免 PointerEvents 模式下一指先更新另一指仍陈旧导致中点/距离偏斜
        if (this._movedThisBatch.indexOf(ev.id) === -1) {
            this._movedThisBatch.push(ev.id);
        }
        if (!this._pinchIds.every(id => this._movedThisBatch.indexOf(id) !== -1)) return;
        this._movedThisBatch = [];

        if (this.onPinchDelta) {
            this._finger0.x = f0Ev.position.x;
            this._finger0.y = f0Ev.position.y;
            this._finger1.x = f1Ev.position.x;
            this._finger1.y = f1Ev.position.y;
            const p = this._deltaPayload;
            p.scale = targetScale;
            p.centerX = midX;
            p.centerY = midY;
            p.originScale = this._startDistance > 0 ? currentDist / this._startDistance : 1;
            p.deltaScale = deltaScale;
            p.startMidX = this._startMidX;
            p.startMidY = this._startMidY;
            this.onPinchDelta(p);
        }
    }

    _onInputUp(ev) {
        if (!this._isPinching) return;

        // pinch 的任一手指抬起 → 结束缩放（无论是否有第三指）
        if (this._pinchIds.indexOf(ev.id) !== -1) {
            this._finishPinch(VirtualDeviceType.Device);
        }
    }

    /**
     * 重置缩放参考距离（当外部将缩放钳制到边界时调用，
     * 使得后续 ev.scale 相对于新距离而非 pinch 起始距离，
     * 防止边界处的缩放死区）
     */
    resetScaleReference(currentDistance) {
        this._startDistance = currentDistance;
        this._currentScale = 1;
    }

    _finishPinch(virtualType) {
        if (!this._isPinching) return;
        this._isPinching = false;
        this._pinchIds = [];
        this._movedThisBatch = [];
        this._startFinger0.x = 0;
        this._startFinger0.y = 0;
        this._startFinger1.x = 0;
        this._startFinger1.y = 0;

        if (this.onPinchCompleted) {
            this.onPinchCompleted({
                scale: this._currentScale,
                centerX: this._startMidX,
                centerY: this._startMidY,
                originScale: 1,
                virtualType: virtualType,
            });
        }
    }
}
