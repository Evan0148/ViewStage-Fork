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

        const positions = this._input.getActivePositions();
        if (positions.length < 2) return;

        this._startPinch(positions);
    }

    _startPinch(positions) {
        const dx = positions[0].x - positions[1].x;
        const dy = positions[0].y - positions[1].y;
        this._startDistance = Math.sqrt(dx * dx + dy * dy);
        this._startMidX = (positions[0].x + positions[1].x) / 2;
        this._startMidY = (positions[0].y + positions[1].y) / 2;
        this._startFinger0 = { x: positions[0].x, y: positions[0].y };
        this._startFinger1 = { x: positions[1].x, y: positions[1].y };
        this._currentScale = 1;
        this._beyondTolerance = false;

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
            });
        }
    }

    _onInputMove(ev) {
        if (!this._isPinching) return;
        if (this._input.activeCount < 2) {
            this._finishPinch(VirtualDeviceType.Device);
            return;
        }

        const positions = this._input.getActivePositions();
        if (positions.length < 2) return;

        const dx = positions[0].x - positions[1].x;
        const dy = positions[0].y - positions[1].y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const midX = (positions[0].x + positions[1].x) / 2;
        const midY = (positions[0].y + positions[1].y) / 2;

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

        if (this.onPinchDelta) {
            this.onPinchDelta({
                scale: targetScale,
                centerX: midX,
                centerY: midY,
                originScale: this._startDistance > 0 ? currentDist / this._startDistance : 1,
                deltaScale: deltaScale,
                startMidX: this._startMidX,
                startMidY: this._startMidY,
                finger0: { x: positions[0].x, y: positions[0].y },
                finger1: { x: positions[1].x, y: positions[1].y },
            });
        }
    }

    _onInputUp(ev) {
        if (!this._isPinching) return;

        // pinch 的任一手指抬起 → 结束缩放（无论是否有第三指）
        if (this._pinchIds.indexOf(ev.id) !== -1) {
            this._finishPinch(VirtualDeviceType.Device);
        }
    }

    _finishPinch(virtualType) {
        if (!this._isPinching) return;
        this._isPinching = false;
        this._pinchIds = [];
        this._startFinger0 = { x: 0, y: 0 };
        this._startFinger1 = { x: 0, y: 0 };

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
