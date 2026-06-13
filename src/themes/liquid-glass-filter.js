/**
 * ViewStage 液态玻璃滤镜引擎
 * 移植自 liquid-glass 项目（D:\code\liquid-glass）
 * 通过 Canvas 生成位移图/高光图 + SVG feDisplacementMap 实现玻璃折射边缘 + 磨砂背景效果
 *
 * 与模糊效果完全独立，无任何互斥逻辑
 */

// ========== 数学工具函数 ==========

const SURFACE_FNS = {
    convex_squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
    convex_circle: (x) => Math.sqrt(1 - (1 - x) * (1 - x)),
    concave: (x) => 1 - Math.sqrt(1 - (1 - x) * (1 - x)),
    lip: (x) => {
        const convex = Math.pow(1 - Math.pow(1 - Math.min(x * 2, 1), 4), 0.25);
        const concave = 1 - Math.sqrt(1 - (1 - x) * (1 - x)) + 0.1;
        const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
        return convex * (1 - t) + concave * t;
    },
};

function calculateRefractionProfile(glassThickness, bezelWidth, heightFn, ior, samples) {
    samples = samples || 128;
    const eta = 1 / ior;
    function refract(nx, ny) {
        const dot = ny;
        const k = 1 - eta * eta * (1 - dot * dot);
        if (k < 0) return null;
        const sq = Math.sqrt(k);
        return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
    }
    const profile = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = i / samples;
        const y = heightFn(x);
        const dx = x < 1 ? 0.0001 : -0.0001;
        const y2 = heightFn(x + dx);
        const deriv = (y2 - y) / dx;
        const mag = Math.sqrt(deriv * deriv + 1);
        const ref = refract(-deriv / mag, -1 / mag);
        if (!ref) {
            profile[i] = 0;
            continue;
        }
        profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
    }
    return profile;
}

function generateDisplacementMap(w, h, radius, bezelWidth, profile, maxDisp) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        d[i] = 128;
        d[i + 1] = 128;
        d[i + 2] = 0;
        d[i + 3] = 255;
    }

    const r = radius,
        rSq = r * r,
        r1Sq = (r + 1) ** 2;
    const rBSq = Math.max(r - bezelWidth, 0) ** 2;
    const wB = w - r * 2,
        hB = h - r * 2,
        S = profile.length;

    for (let y1 = 0; y1 < h; y1++) {
        for (let x1 = 0; x1 < w; x1++) {
            const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
            const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
            const dSq = x * x + y * y;
            if (dSq > r1Sq || dSq < rBSq) continue;
            const dist = Math.sqrt(dSq);
            const fromSide = r - dist;
            const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
            if (op <= 0 || dist === 0) continue;
            const cos = x / dist,
                sin = y / dist;
            const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1);
            const disp = profile[bi] || 0;
            const dX = (-cos * disp) / maxDisp,
                dY = (-sin * disp) / maxDisp;
            const idx = (y1 * w + x1) * 4;
            d[idx] = (128 + dX * 127 * op + 0.5) | 0;
            d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
        }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
}

function generateSpecularMap(w, h, radius, bezelWidth, angle) {
    angle = angle != null ? angle : Math.PI / 3;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    d.fill(0);

    const r = radius,
        rSq = r * r,
        r1Sq = (r + 1) ** 2;
    const rBSq = Math.max(r - bezelWidth, 0) ** 2;
    const wB = w - r * 2,
        hB = h - r * 2;
    const sv = [Math.cos(angle), Math.sin(angle)];

    for (let y1 = 0; y1 < h; y1++) {
        for (let x1 = 0; x1 < w; x1++) {
            const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
            const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
            const dSq = x * x + y * y;
            if (dSq > r1Sq || dSq < rBSq) continue;
            const dist = Math.sqrt(dSq);
            const fromSide = r - dist;
            const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
            if (op <= 0 || dist === 0) continue;
            const cos = x / dist,
                sin = -y / dist;
            const dot = Math.abs(cos * sv[0] + sin * sv[1]);
            const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
            const coeff = dot * edge;
            const col = (255 * coeff) | 0;
            const alpha = (col * coeff * op) | 0;
            const idx = (y1 * w + x1) * 4;
            d[idx] = col;
            d[idx + 1] = col;
            d[idx + 2] = col;
            d[idx + 3] = alpha;
        }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
}

// ========== 解析 RGBA ==========

function parseRGBA(str) {
    if (!str) return null;
    const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (match) {
        return {
            r: +match[1], g: +match[2], b: +match[3],
            a: match[4] !== undefined ? +match[4] : 1,
        };
    }
    return null;
}

// ========== 液态玻璃滤镜管理器 ==========

const LiquidGlassFilter = {
    // 玻璃效果参数（可外部覆盖）
    config: {
        surfaceFn: 'convex_squircle',
        glassThickness: 60,
        bezelWidth: 30,
        refractiveIndex: 2.5,
        scaleRatio: 0.8,
        blurAmount: 1.5,
        specularOpacity: 0.45,
        specularSaturation: 4,
        // 背景透明度倍率（0~1，越低越透明）
        backgroundAlpha: 0.25,
        // 内阴影
        shadowColor: '#ffffff',
        shadowBlur: 16,
        shadowSpread: -4,
        // 玻璃着色
        tintColor: '#ffffff',
        tintOpacity: 0.04,
        // 外阴影
        outerShadowBlur: 12,
    },

    // 已注册的元素：name → { el }
    elements: new Map(),

    /**
     * 为指定元素重建 SVG filter + 内联样式
     */
    rebuildFilter(name, el) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w < 2 || h < 2) return;

        const radius = parseInt(getComputedStyle(el).borderRadius) || 12;
        const cfg = this.config;
        const heightFn = SURFACE_FNS[cfg.surfaceFn];
        if (!heightFn) return;

        const clampedBezel = Math.min(cfg.bezelWidth, radius - 1, Math.min(w, h) / 2 - 1);
        if (clampedBezel <= 0) return;

        const profile = calculateRefractionProfile(cfg.glassThickness, clampedBezel, heightFn, cfg.refractiveIndex, 128);
        const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;
        const dispUrl = generateDisplacementMap(w, h, radius, clampedBezel, profile, maxDisp);
        const specUrl = generateSpecularMap(w, h, radius, clampedBezel * 2.5);
        const scale = maxDisp * cfg.scaleRatio;

        const filterId = `lg-filter-${name}`;
        const defs = document.getElementById('toolbar-svg-defs');
        if (!defs) return;

        // 移除旧的 filter
        const existing = defs.querySelector(`#${filterId}`);
        if (existing) existing.remove();

        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', filterId);
        filter.setAttribute('x', '0%');
        filter.setAttribute('y', '0%');
        filter.setAttribute('width', '100%');
        filter.setAttribute('height', '100%');
        filter.innerHTML = `
            <feGaussianBlur in="SourceGraphic" stdDeviation="${cfg.blurAmount}" result="blurred_source" />
            <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
            <feDisplacementMap in="blurred_source" in2="disp_map"
                scale="${scale}" xChannelSelector="R" yChannelSelector="G"
                result="displaced" />
            <feColorMatrix in="displaced" type="saturate" values="${cfg.specularSaturation}" result="displaced_sat" />
            <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
            <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
            <feComponentTransfer in="spec_layer" result="spec_faded">
                <feFuncA type="linear" slope="${cfg.specularOpacity}" />
            </feComponentTransfer>
            <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
            <feBlend in="spec_faded" in2="with_sat" mode="normal" />
        `;
        defs.appendChild(filter);

        // 应用 backdrop-filter
        el.style.backdropFilter = `url(#${filterId})`;
        el.style.webkitBackdropFilter = `url(#${filterId})`;

        // 降低背景透明度
        const entry = this.elements.get(name);
        if (entry && entry.originalBg) {
            const rgba = parseRGBA(entry.originalBg);
            if (rgba) {
                const newAlpha = rgba.a * cfg.backgroundAlpha;
                el.style.background = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${newAlpha})`;
            }
        }

        // 内阴影 + 着色
        const tintRgb = hexToRgb(cfg.tintColor);
        el.style.boxShadow = `
            inset 0 0 ${cfg.shadowBlur}px ${cfg.shadowSpread}px ${cfg.shadowColor},
            0 ${cfg.outerShadowBlur > 0 ? 4 : 0}px ${cfg.outerShadowBlur}px rgba(0,0,0,0.15)
        `;
        // 使用伪元素无法动态控制，用 background 叠加层模拟着色
        // 已在背景透明度中处理
    },

    /**
     * 注册一个玻璃元素并生成滤镜
     */
    register(name, el) {
        if (this.elements.has(name)) return;
        // 保存原始计算后的背景色
        const computedBg = getComputedStyle(el).backgroundColor;
        this.elements.set(name, { el, originalBg: computedBg });
        this.rebuildFilter(name, el);
    },

    /**
     * 注销一个玻璃元素并清理滤镜
     */
    unregister(name) {
        const entry = this.elements.get(name);
        if (entry) {
            entry.el.style.backdropFilter = '';
            entry.el.style.webkitBackdropFilter = '';
            entry.el.style.background = '';
            entry.el.style.boxShadow = '';
        }
        this.elements.delete(name);
        const filter = document.getElementById(`lg-filter-${name}`);
        if (filter) filter.remove();
    },

    /**
     * 重建所有已注册元素的滤镜
     */
    rebuildAll() {
        this.elements.forEach((entry, name) => {
            this.rebuildFilter(name, entry.el);
        });
    },

    /**
     * 初始化：扫描 DOM 注册玻璃元素 + 启动 ResizeObserver
     */
    init() {
        if (this._initialized) this.destroy();

        const selectors = '.toolbar-left, .toolbar-center, .toolbar-right, .bb-mode-group, .document-reader-panel';
        document.querySelectorAll(selectors).forEach((el) => {
            const match = el.className.match(/toolbar-left|toolbar-center|toolbar-right|bb-mode-group|document-reader-panel/);
            if (match) {
                this.register(match[0], el);
            }
        });

        // ResizeObserver 监听尺寸变化
        if (window.ResizeObserver) {
            this.ro = new ResizeObserver(() => {
                if (this._rebuildTimer) cancelAnimationFrame(this._rebuildTimer);
                this._rebuildTimer = requestAnimationFrame(() => this.rebuildAll());
            });
            this.elements.forEach((entry) => {
                this.ro.observe(entry.el);
            });
        }

        this._initialized = true;
    },

    /**
     * 销毁：断开 ResizeObserver、清理所有滤镜
     */
    destroy() {
        if (this.ro) {
            this.ro.disconnect();
            this.ro = null;
        }
        this.elements.forEach((_, name) => {
            const filter = document.getElementById(`lg-filter-${name}`);
            if (filter) filter.remove();
        });
        this.elements.forEach((entry) => {
            entry.el.style.backdropFilter = '';
            entry.el.style.webkitBackdropFilter = '';
            entry.el.style.background = '';
            entry.el.style.boxShadow = '';
        });
        this.elements.clear();
        this._initialized = false;
    },
};

window.LiquidGlassFilter = LiquidGlassFilter;

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

export default LiquidGlassFilter;