const TILE_COLS = 4;
const TILE_ROWS = 2;

class TileRenderer {
    constructor() {
        this.dirty = new Set();
        this.tileInfos = [];
        for (let r = 0; r < TILE_ROWS; r++) {
            for (let c = 0; c < TILE_COLS; c++) {
                this.tileInfos.push({ col: c, row: r, key: `${c}_${r}` });
            }
        }
    }

    get_tile_dimensions() {
        const cw = window.DRAW_CONFIG.canvasW;
        const ch = window.DRAW_CONFIG.canvasH;
        return {
            w: Math.ceil(cw / TILE_COLS),
            h: Math.ceil(ch / TILE_ROWS)
        };
    }

    get_tile_rect(col, row) {
        const { w, h } = this.get_tile_dimensions();
        const cw = window.DRAW_CONFIG.canvasW;
        const ch = window.DRAW_CONFIG.canvasH;
        return {
            x: col * w,
            y: row * h,
            width: Math.min(w, cw - col * w),
            height: Math.min(h, ch - row * h)
        };
    }

    tile_key(col, row) { return `${col}_${row}`; }

    init_tiles(wrapper) {
        const dpr = window.DRAW_CONFIG.dpr;
        const existing = wrapper.querySelectorAll('.canvas-tile');
        for (const el of existing) el.remove();

        for (const info of this.tileInfos) {
            const rect = this.get_tile_rect(info.col, info.row);
            const canvas = document.createElement('canvas');
            canvas.className = 'canvas-tile';
            canvas.width = Math.ceil(rect.width * dpr);
            canvas.height = Math.ceil(rect.height * dpr);
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            canvas.style.left = rect.x + 'px';
            canvas.style.top = rect.y + 'px';

            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.scale(dpr, dpr);
            ctx.imageSmoothingEnabled = false;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            wrapper.appendChild(canvas);
            info.canvas = canvas;
            info.ctx = ctx;
            info.rect = rect;
            this.dirty.add(info.key);
        }
    }

    for_each_visible(fn) {
        const keys = this.get_visible_keys();
        for (const info of this.tileInfos) {
            if (keys.has(info.key)) {
                fn(info);
            }
        }
    }

    for_each(fn) {
        for (const info of this.tileInfos) {
            fn(info);
        }
    }

    get_visible_keys() {
        const vr = window.main_fetch_visible_rect();
        const { w, h } = this.get_tile_dimensions();
        const keys = new Set();
        const sc = Math.max(0, Math.floor(vr.x / w));
        const ec = Math.min(TILE_COLS - 1, Math.floor((vr.x + vr.width - 1) / w));
        const sr = Math.max(0, Math.floor(vr.y / h));
        const er = Math.min(TILE_ROWS - 1, Math.floor((vr.y + vr.height - 1) / h));
        for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
                keys.add(this.tile_key(c, r));
            }
        }
        return keys;
    }

    info_for_point(x, y) {
        const { w, h } = this.get_tile_dimensions();
        const col = Math.min(TILE_COLS - 1, Math.max(0, Math.floor(x / w)));
        const row = Math.min(TILE_ROWS - 1, Math.max(0, Math.floor(y / h)));
        const key = this.tile_key(col, row);
        return this.tileInfos.find(i => i.key === key);
    }

    infos_for_segment(x1, y1, x2, y2) {
        const { w, h } = this.get_tile_dimensions();
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const sc = Math.max(0, Math.floor(minX / w));
        const ec = Math.min(TILE_COLS - 1, Math.floor(maxX / w));
        const sr = Math.max(0, Math.floor(minY / h));
        const er = Math.min(TILE_ROWS - 1, Math.floor(maxY / h));
        const result = [];
        for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
                const key = this.tile_key(c, r);
                const info = this.tileInfos.find(i => i.key === key);
                if (info) result.push(info);
            }
        }
        return result;
    }

    rebuild_tile(info) {
        const ctx = info.ctx;
        const rect = info.rect;
        const dpr = window.DRAW_CONFIG.dpr;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, -rect.x * dpr, -rect.y * dpr);
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

        if (window.state.baseImageObj) {
            ctx.drawImage(
                window.state.baseImageObj,
                rect.x, rect.y, rect.width, rect.height,
                rect.x, rect.y, rect.width, rect.height
            );
        }

        const strokes = window.state.strokeHistory;
        if (strokes.length > 0) {
            const relevant = [];
            for (let i = 0; i < strokes.length; i++) {
                const s = strokes[i];
                if (!s.bounds) { relevant.push(s); continue; }
                const b = s.bounds;
                if (b.maxX < rect.x || b.minX > rect.x + rect.width ||
                    b.maxY < rect.y || b.minY > rect.y + rect.height) {
                    continue;
                }
                relevant.push(s);
            }
            if (relevant.length > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.width, rect.height);
                ctx.clip();
                if (window.main_reset_context_state) window.main_reset_context_state();
                window.main_render_strokes_to_context(ctx, relevant);
                ctx.restore();
            }
        }

        ctx.restore();
        this.dirty.delete(info.key);
    }

    rebuild_visible() {
        const keys = this.get_visible_keys();
        for (const info of this.tileInfos) {
            if (keys.has(info.key) && this.dirty.has(info.key)) {
                this.rebuild_tile(info);
            }
        }
    }

    rebuild_all() {
        for (const info of this.tileInfos) {
            if (this.dirty.has(info.key)) {
                this.rebuild_tile(info);
            }
        }
    }

    mark_all() {
        for (const info of this.tileInfos) {
            this.dirty.add(info.key);
        }
    }

    destroy() {
        for (const info of this.tileInfos) {
            if (info.canvas && info.canvas.parentNode) {
                info.canvas.parentNode.removeChild(info.canvas);
            }
            info.canvas = null;
            info.ctx = null;
        }
        this.dirty.clear();
    }

    destroy_all() {
        this.destroy();
    }

    add_stroke(stroke) {
        if (!stroke || !stroke.points || stroke.points.length < 2) return;
        const infos = this.infos_for_segment(
            stroke.bounds.minX, stroke.bounds.minY,
            stroke.bounds.maxX, stroke.bounds.maxY
        );
        const uniqueKeys = new Set(infos.map(i => i.key));
        for (const info of this.tileInfos) {
            if (uniqueKeys.has(info.key)) {
                const ctx = info.ctx;
                const rect = info.rect;
                ctx.save();
                ctx.setTransform(window.DRAW_CONFIG.dpr, 0, 0, window.DRAW_CONFIG.dpr,
                    -rect.x * window.DRAW_CONFIG.dpr, -rect.y * window.DRAW_CONFIG.dpr);
                ctx.beginPath();
                ctx.rect(rect.x, rect.y, rect.width, rect.height);
                ctx.clip();
                window.main_render_strokes_to_context(ctx, [stroke]);
                ctx.restore();
                this.dirty.delete(info.key);
            }
        }
    }
}

window.tileRenderer = new TileRenderer();
