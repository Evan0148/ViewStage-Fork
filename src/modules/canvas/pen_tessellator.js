/**
 * 钢笔笔锋曲面细分 - 将笔画点数据拆分为带渐变宽度的细分段，实现钢笔笔触效果
 * 渲染时将每个细分段以二次贝塞尔曲线绘制，产生平滑笔迹
 */
class PenTessellator {
    /**
     * 从笔画数据构建曲面细分后的可渲染笔画
     * @param {Object} stroke - 原始笔画数据（points: 点数组, lineWidth: 基础笔宽, color: 颜色）
     * @param {Object} [options] - 配置项，含 density 密度系数、storedWidths 实时存储宽度数组、noStartTaper 是否禁用起笔渐变
     * @returns {Object|null} { segments: 细分段数组, color: 颜色 }，无效输入返回 null
     */
    tessellator_build_stroke_from_stroke_data(stroke, options = {}) {
        if (!stroke || !stroke.points || stroke.points.length < 1) return null;

        const points = stroke.points;
        const base_width = stroke.lineWidth || 5;
        const color = stroke.color || '#3498db';
        const density = options.density || 1;
        const storedWidths = options.storedWidths || null;

        const segs = this._tessellator_build_segments(points, base_width, density, options.noStartTaper, storedWidths);
        if (!segs || segs.length < 1) return null;

        return { segments: segs, color };
    }

    // 将点序列转换为每段的渐变宽度数组，支持实时存储宽度或按速度重算两种模式
    _tessellator_build_segments(points, base_width, density = 1, noStartTaper = false, storedWidths = null) {
        if (points.length < 1) return null;

        const raw = [{ x: points[0].fromX, y: points[0].fromY }];
        for (let i = 0; i < points.length; i++) {
            raw.push({ x: points[i].toX, y: points[i].toY });
        }
        if (raw.length < 2) return null;

        const line_widths = [];

        if (storedWidths && storedWidths.length === raw.length - 1) {
            // 使用实时存储宽度，跳过速度重算
            for (let i = 0; i < storedWidths.length; i++) {
                line_widths.push(storedWidths[i]);
            }
        } else {
            // 无存储宽度：从速度重算（兼容模式，如子笔画）
            const speedScale = Math.max(0.4, Math.min(2.5, base_width / 4));
            const maxSpeed = 2.5 * speedScale;
            const minSpeed = 0.2 * speedScale;
            const minRatio = window.DRAW_CONFIG?.penMinWidthRatio ?? 0.4;
            let last_line_width = base_width;

            for (let i = 1; i < raw.length; i++) {
                const prev = raw[i - 1];
                const curr = raw[i];

                const dx = curr.x - prev.x;
                const dy = curr.y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const safeDist = Math.max(dist, 0.01);
                const speed = Math.min(safeDist * density, 15) / 8;
                const clamped = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));

                let line_width;
                if (clamped >= 1) {
                    line_width = base_width * minRatio;
                } else if (clamped <= 0) {
                    line_width = base_width;
                } else {
                    const eased = clamped * clamped * (3 - 2 * clamped);
                    line_width = base_width - eased * (base_width * minRatio);
                }

                const blend = Math.max(0.3, Math.min(0.85, 1 - dist / (base_width * 3)));
                line_width = line_width * (1 - blend) + last_line_width * blend;

                const maxDelta = base_width * 0.12;
                line_width = Math.min(last_line_width + maxDelta, Math.max(last_line_width - maxDelta, line_width));
                last_line_width = line_width;

                line_widths.push(line_width);
            }
        }

        const totalSegments = line_widths.length;
        const taperSegments = 4;

        for (let i = 0; i < totalSegments; i++) {
            if (!noStartTaper && i < taperSegments) {
                // 存储宽度已包含实时计算的起笔渐变，此处不再叠加
                if (!storedWidths) {
                    const taperT = (i + 1) / taperSegments;
                    const eased = taperT * taperT * (3 - 2 * taperT);
                    const minStart = base_width * 0.2;
                    line_widths[i] = minStart + (line_widths[i] - minStart) * eased;
                }
            }
        }

        const segments = [];
        for (let i = 0; i < line_widths.length; i++) {
            const p1 = raw[i];
            const p2 = raw[i + 1];
            segments.push({
                x1: p1.x, y1: p1.y,
                x2: p2.x, y2: p2.y,
                line_width: Math.max(0.5, line_widths[i])
            });
        }

        return segments;
    }

    /**
     * 渲染曲面细分后的笔画到 canvas
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} tessellated_stroke - 细分笔画数据（segments 数组 + color 颜色）
     */
    tessellator_render_stroke(ctx, tessellated_stroke) {
        if (!tessellated_stroke || !tessellated_stroke.segments) return;

        const { segments, color } = tessellated_stroke;
        const len = segments.length;

        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';

        /* 首段独立绘制：x1,y1 → x2,y2 直线 */
        const s0 = segments[0];
        ctx.lineWidth = s0.line_width;
        ctx.beginPath();
        ctx.moveTo(s0.x1, s0.y1);
        ctx.lineTo(s0.x2, s0.y2);
        ctx.stroke();
        if (len === 1) {
            const mx = (s0.x1 + s0.x2) / 2;
            ctx.beginPath();
            ctx.moveTo(mx, (s0.y1 + s0.y2) / 2);
            ctx.lineTo(s0.x2, s0.y2);
            ctx.stroke();
            return;
        }

        /* 后续段：合并线宽相近的连续曲线为同一路径，减少 stroke() 调用 */
        let batchActive = false;
        let batchWidth = 0;

        for (let i = 1; i < len; i++) {
            const seg = segments[i];
            const prev = segments[i - 1];
            const last_x = (prev.x1 + prev.x2) / 2;
            const last_y = (prev.y1 + prev.y2) / 2;
            const mid_x = (seg.x1 + seg.x2) / 2;
            const mid_y = (seg.y1 + seg.y2) / 2;
            const isTail = (i === len - 1);

            if (!batchActive || Math.abs(seg.line_width - batchWidth) >= 0.5) {
                if (batchActive) ctx.stroke();
                ctx.lineWidth = seg.line_width;
                batchWidth = seg.line_width;
                ctx.beginPath();
                ctx.moveTo(last_x, last_y);
                ctx.quadraticCurveTo(seg.x1, seg.y1, mid_x, mid_y);
            } else {
                ctx.quadraticCurveTo(seg.x1, seg.y1, mid_x, mid_y);
            }

            if (isTail) {
                /* 末段尾线：mid → toX/Y 追加到当前路径一同 stroke */
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();
                batchActive = false;
            } else {
                batchActive = true;
            }
        }
        if (batchActive) ctx.stroke();
    }
}

window.penTessellator = new PenTessellator();
