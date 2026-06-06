/**
 * ViewStage 右上角性能监视器
 * 显示实时 FPS、批绘制引擎状态等指标
 * 仅在开发者模式下通过开关启用
 */

let perf_raf_id = null;
let perf_container = null;
let perf_fps_value = 0;
let perf_frame_count = 0;
let perf_last_time = 0;
let perf_enabled = false;

let perf_fps_line = null;
let perf_batch_line = null;
let perf_tiles_line = null;

/** 创建监视器 DOM 并启动 RAF 循环 */
function perf_monitor_init() {
    if (perf_container) return;

    perf_container = document.createElement('div');
    perf_container.id = 'perf-monitor';
    perf_container.style.cssText = `
        position: fixed;
        top: 8px;
        right: 8px;
        z-index: 2147483647;
        background: rgba(0,0,0,0.7);
        color: #0f0;
        font-family: 'Consolas','Courier New',monospace;
        font-size: 12px;
        line-height: 1.5;
        padding: 6px 10px;
        border-radius: 6px;
        pointer-events: none;
        user-select: none;
        white-space: pre;
    `;

    perf_fps_line = document.createElement('div');
    perf_batch_line = document.createElement('div');
    perf_tiles_line = document.createElement('div');
    perf_container.appendChild(perf_fps_line);
    perf_container.appendChild(perf_batch_line);
    perf_container.appendChild(perf_tiles_line);

    // 显式设置 display block，避免因模块级 perf_enabled=false 导致 display:none 写死
    perf_container.style.display = 'block';
    document.body.appendChild(perf_container);

    perf_enabled = true;
    perf_last_time = performance.now();
    perf_frame_count = 0;
    perf_raf_id = requestAnimationFrame(perf_monitor_raf_loop);
}

/** RAF 回调：累计帧数，每秒提取一次 stats */
function perf_monitor_raf_loop(timestamp) {
    if (!perf_enabled) return;

    perf_raf_id = requestAnimationFrame(perf_monitor_raf_loop);
    perf_frame_count++;

    const elapsed = timestamp - perf_last_time;
    if (elapsed >= 1000) {
        perf_fps_value = Math.round(perf_frame_count * 1000 / elapsed);
        perf_frame_count = 0;
        perf_last_time = timestamp;
        perf_monitor_refresh_display();
    }
}

/**
 * 计算渲染压力综合指标（0-100）
 * 权重：脏 tile 比例 40% + 待绘命令数 30% + 掉帧率 30%
 */
function calc_render_pressure(batchStats, tileRenderer) {
    let value = 0;

    // 脏 tile 比例（0-40）
    if (tileRenderer?.tileInfos) {
        const ratio = (tileRenderer.dirty?.size || 0) / tileRenderer.tileInfos.length;
        value += Math.min(40, Math.round(ratio * 40));
    }

    // 待绘命令积压（0-30）
    const pending = batchStats?.pendingCount || 0;
    if (pending > 0) {
        value += Math.min(30, pending * 5);
    }

    // FPS 掉帧率（0-30）
    if (batchStats?.targetFps > 0 && batchStats.currentFps < batchStats.targetFps) {
        const drop = 1 - batchStats.currentFps / batchStats.targetFps;
        value += Math.min(30, Math.round(drop * 30));
    }

    value = Math.min(100, value);

    let label;
    if (value <= 20) label = '低';
    else if (value <= 50) label = '中';
    else if (value <= 80) label = '高';
    else label = '严重';

    return { value, label };
}

/** 采集各模块 stats 并更新显示 */
function perf_monitor_refresh_display() {
    if (!perf_container) return;

    const s = window.batchDrawManager?.batch_draw_fetch_stats?.();
    const tileR = window.tileRenderer;
    const mem = typeof performance.memory !== 'undefined' ? performance.memory : null;

    // 渲染压力
    const pressure = calc_render_pressure(s, tileR);

    // 行 1：FPS + 渲染压力 + DPR
    const dprStr = (window.DRAW_CONFIG?.dpr || 1).toFixed(1);
    perf_fps_line.textContent = `FPS ${perf_fps_value}  P ${pressure.label}(${pressure.value}%)  DPR ${dprStr}`;

    // 行 2：batch_draw 引擎指标
    if (s) {
        perf_batch_line.textContent =
            `Bat ${s.currentFps}/${s.targetFps}  P ${s.pendingCount}  D ${s.avgDrawTime.toFixed(1)}ms  ${s.frameRateMode}`;
    } else {
        perf_batch_line.textContent = 'Bat  --';
    }

    // 行 3：脏 tile + 堆内存
    const dirtyCount = tileR?.dirty?.size ?? '-';
    const totalTiles = tileR?.tileInfos?.length ?? '-';
    const heapStr = mem
        ? `${(mem.usedJSHeapSize / 1048576).toFixed(0)}MB`
        : '--';
    perf_tiles_line.textContent = `Til ${dirtyCount}/${totalTiles}  Heap ${heapStr}`;
}

/**
 * 开关监视器
 * @param {boolean} enabled - true 显示，false 隐藏
 */
function perf_monitor_set_enabled(enabled) {
    perf_enabled = enabled;

    if (enabled) {
        if (!perf_container) {
            perf_monitor_init();
        } else {
            perf_container.style.display = 'block';
            perf_last_time = performance.now();
            perf_frame_count = 0;
            perf_raf_id = requestAnimationFrame(perf_monitor_raf_loop);
        }
    } else {
        if (perf_raf_id) {
            cancelAnimationFrame(perf_raf_id);
            perf_raf_id = null;
        }
        if (perf_container) {
            perf_container.style.display = 'none';
        }
    }
}

export { perf_monitor_init, perf_monitor_set_enabled };
