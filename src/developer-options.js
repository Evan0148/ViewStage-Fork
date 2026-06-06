/**
 * ViewStage 开发者选项
 * 通过关于页面图标点击5次打开
 */

/* 内联 SVG 图标（Fluent UI System Icons 风格，currentColor） */
const DEV_ICONS = {
    /* 文档搜索 */
    documentSearch: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C4 2.89543 4.89543 2 6 2H12.1722C12.7027 2 13.2114 2.21071 13.5864 2.58579L19.4142 8.41355C19.7893 8.78863 20 9.29733 20 9.82777V20C20 21.1046 19.1046 22 18 22H13.9822C13.9303 21.6387 13.7654 21.2905 13.4874 21.0126L12.9749 20.5H18C18.2761 20.5 18.5 20.2761 18.5 20V10H14C12.8954 10 12 9.10457 12 8V3.5H6C5.72386 3.5 5.5 3.72386 5.5 4V11.0907C4.96945 11.1881 4.46553 11.3617 4 11.5997V4ZM14 8.5H17.3793L13.5 4.62066V8C13.5 8.27614 13.7239 8.5 14 8.5ZM6.5 21C7.47187 21 8.37179 20.6919 9.1074 20.1681L11.7197 22.7803C12.0126 23.0732 12.4874 23.0732 12.7803 22.7803C13.0732 22.4874 13.0732 22.0126 12.7803 21.7197L10.1681 19.1074C10.6919 18.3718 11 17.4719 11 16.5C11 14.0147 8.98528 12 6.5 12C4.01472 12 2 14.0147 2 16.5C2 18.9853 4.01472 21 6.5 21ZM6.5 19.5C4.84315 19.5 3.5 18.1569 3.5 16.5C3.5 14.8431 4.84315 13.5 6.5 13.5C8.15685 13.5 9.5 14.8431 9.5 16.5C9.5 18.1569 8.15685 19.5 6.5 19.5Z" fill="currentColor"/></svg>',
    /* 仪表盘 */
    gauge: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.93413 16.0659C8.22703 16.3588 8.22703 16.8336 7.93413 17.1265C7.64124 17.4194 7.16637 17.4194 6.87347 17.1265C4.04217 14.2952 4.04217 9.70478 6.87347 6.87348C8.71833 5.02862 11.3099 4.38674 13.6723 4.94459C14.0755 5.03978 14.3251 5.44375 14.2299 5.84687C14.1347 6.25 13.7308 6.49963 13.3276 6.40444C11.45 5.96106 9.39622 6.47205 7.93413 7.93414C5.68862 10.1797 5.68862 13.8203 7.93413 16.0659ZM17.8879 9.1415C18.2789 9.00477 18.7067 9.21089 18.8435 9.60189C19.7333 12.1463 19.1624 15.0907 17.1265 17.1265C16.8336 17.4194 16.3588 17.4194 16.0659 17.1265C15.773 16.8336 15.773 16.3588 16.0659 16.0659C17.6791 14.4526 18.1344 12.1183 17.4276 10.097C17.2908 9.70604 17.4969 9.27824 17.8879 9.1415ZM15.8791 6.66732C16.1062 6.47297 16.439 6.46653 16.6734 6.65195C16.9078 6.83738 16.9781 7.16278 16.8412 7.42842L16.7119 7.67862C16.6295 7.83801 16.5113 8.06624 16.3681 8.34179C16.0818 8.89278 15.6954 9.63339 15.2955 10.3912C14.8959 11.1485 14.4815 11.9253 14.1395 12.5479C13.9686 12.8589 13.8142 13.1344 13.6879 13.3509C13.5703 13.5524 13.4548 13.7421 13.3688 13.8508C12.7263 14.6629 11.5471 14.8004 10.735 14.1579C9.92288 13.5154 9.78538 12.3362 10.4279 11.5241C10.5139 11.4154 10.672 11.2593 10.8409 11.0986C11.0226 10.9258 11.2552 10.7121 11.5185 10.4744C12.0457 9.9983 12.7063 9.41631 13.3514 8.85315C13.9969 8.28961 14.6288 7.74321 15.0991 7.33783C15.3343 7.1351 15.5292 6.96755 15.6654 6.85065L15.8791 6.66732ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5C7.30558 3.5 3.5 7.30558 3.5 12Z" fill="currentColor"/></svg>',
    /* 线条粗细 */
    lineThickness: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.75 3.5C2.33579 3.5 2 3.83579 2 4.25C2 4.66421 2.33579 5 2.75 5H21.25C21.6642 5 22 4.66421 22 4.25C22 3.83579 21.6642 3.5 21.25 3.5H2.75ZM2 10.75C2 10.0596 2.55964 9.5 3.25 9.5H20.75C21.4404 9.5 22 10.0596 22 10.75C22 11.4404 21.4404 12 20.75 12H3.25C2.55964 12 2 11.4404 2 10.75ZM2 18.25C2 17.2835 2.7835 16.5 3.75 16.5H20.25C21.2165 16.5 22 17.2835 22 18.25C22 19.2165 21.2165 20 20.25 20H3.75C2.7835 20 2 19.2165 2 18.25Z" fill="currentColor"/></svg>',
    /* 箭头最大化 */
    arrowMaximize: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.25 4C19.6642 4 20 4.33579 20 4.75V12.25C20 12.6642 19.6642 13 19.25 13C18.8358 13 18.5 12.6642 18.5 12.25V6.56055L6.56055 18.5H12.25C12.6642 18.5 13 18.8358 13 19.25C13 19.6642 12.6642 20 12.25 20H4.75C4.33579 20 4 19.6642 4 19.25V11.75C4 11.3358 4.33579 11 4.75 11C5.16421 11 5.5 11.3358 5.5 11.75V17.4395L17.4395 5.5H11.75C11.3358 5.5 11 5.16421 11 4.75C11 4.33579 11.3358 4 11.75 4H19.25Z" fill="currentColor"/></svg>',
    /* 右箭头 */
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="currentColor"/></svg>',
    /* 左箭头 */
    chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C6.90237 12.3166 6.90237 11.6834 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z" fill="currentColor"/></svg>',
};

const ICON_WRAPPER = (svg) => `<span style="display:inline-flex;vertical-align:middle;margin-right:6px;flex-shrink:0;">${svg}</span>`;

async function developer_options_init() {
    // 从后端加载已保存的值（设置面板无 DRAW_CONFIG，必须读后端）
    const invoke = window.__TAURI__?.core?.invoke;
    let savedWidthRatio = 0.4;
    let savedMaxScale = 4;
    let savedPerfMonitor = false;
    let savedPerfInterval = 200;

    if (invoke) {
        try {
            const result = await invoke('settings_fetch_all');
            const s = result?.settings || {};
            // 优先使用 DRAW_CONFIG（主窗口），否则用后端保存值，最后用硬编码默认
            savedWidthRatio = window.DRAW_CONFIG?.penMinWidthRatio
                ?? s.penMinWidthRatio
                ?? 0.4;
            savedMaxScale = window.DRAW_CONFIG?.maxScaleImage
                ?? s.maxScaleImage
                ?? 4;
            savedPerfMonitor = s.perfMonitorEnabled === true;
            savedPerfInterval = s.perfMonitorInterval ?? 200;
        } catch (_) {
            savedWidthRatio = window.DRAW_CONFIG?.penMinWidthRatio ?? 0.4;
            savedMaxScale = window.DRAW_CONFIG?.maxScaleImage ?? 4;
        }
    } else {
        savedWidthRatio = window.DRAW_CONFIG?.penMinWidthRatio ?? 0.4;
        savedMaxScale = window.DRAW_CONFIG?.maxScaleImage ?? 4;
    }

    developer_options_show_main(savedWidthRatio, savedMaxScale, savedPerfMonitor, savedPerfInterval);
}

const PERF_INTERVAL_OPTIONS = [
    { value: '100', label: '快' },
    { value: '200', label: '正常' },
    { value: '500', label: '慢' },
];

function perf_interval_label(ms) {
    const opt = PERF_INTERVAL_OPTIONS.find(p => parseInt(p.value) === ms);
    return opt ? `${opt.label}（${ms}ms）` : `${ms}ms`;
}

function developer_options_show_main(currentWidthRatio, currentMaxScale, perfMonitorEnabled, perfMonitorInterval) {
    const page = document.getElementById('pageDevOptions');
    if (!page) return;

    const widthPresets = [
        { value: '0.05', label: '0.05' },
        { value: '0.1', label: '0.10' },
        { value: '0.15', label: '0.15' },
        { value: '0.2', label: '0.20' },
        { value: '0.25', label: '0.25' },
        { value: '0.3', label: '0.30' },
        { value: '0.4', label: '0.40（默认）' },
        { value: '0.5', label: '0.50' },
        { value: '0.75', label: '0.75' },
        { value: '1', label: '1.00' },
    ];
    const currentWidthLabel = widthPresets.find(p => parseFloat(p.value) === currentWidthRatio)?.label
        || currentWidthRatio.toFixed(2);

    const scalePresets = [
        { value: '2', label: '2x' },
        { value: '3', label: '3x' },
        { value: '4', label: '4x（默认）' },
        { value: '5', label: '5x' },
        { value: '6', label: '6x' },
        { value: '8', label: '8x' },
        { value: '10', label: '10x' },
    ];
    const currentScaleLabel = scalePresets.find(p => parseInt(p.value) === currentMaxScale)?.label
        || `${currentMaxScale}x`;

    page.innerHTML = `
        <h2 class="page-title">开发者选项</h2>
        <div class="setting-item">
            <span style="display:flex;align-items:center;gap:8px;">
                ${ICON_WRAPPER(DEV_ICONS.documentSearch)}
                <span class="setting-label">文档加载检测</span>
            </span>
            <span id="devGoDetection" style="cursor:pointer;display:inline-flex;align-items:center;color:var(--color-muted, #888);padding:4px;">${DEV_ICONS.chevronRight}</span>
        </div>
        <div class="setting-item">
            <span style="display:flex;align-items:center;gap:8px;">
                ${ICON_WRAPPER(DEV_ICONS.gauge)}
                <span class="setting-label">性能监视器</span>
            </span>
            <label class="toggle-switch">
                <input type="checkbox" id="devPerfMonitorToggle"${perfMonitorEnabled ? ' checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        </div>
        <div class="setting-item">
            <span style="display:flex;align-items:center;gap:8px;">
                ${ICON_WRAPPER(DEV_ICONS.gauge)}
                <span class="setting-label">监视器更新频率</span>
            </span>
            <div class="custom-select" id="devPerfIntervalSelect">
                <div class="select-selected" id="devPerfIntervalSelected">${perf_interval_label(perfMonitorInterval)}</div>
                <div class="select-options" id="devPerfIntervalOptions">
                    ${PERF_INTERVAL_OPTIONS.map(p => `
                        <div class="select-option${parseInt(p.value) === perfMonitorInterval ? ' selected' : ''}" data-value="${p.value}">${p.label}（${p.value}ms）</div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="setting-item">
            <span style="display:flex;align-items:center;gap:8px;">
                ${ICON_WRAPPER(DEV_ICONS.lineThickness)}
                <span class="setting-label">最快速度时宽度比例</span>
            </span>
            <div class="custom-select" id="devWidthRatioSelect">
                <div class="select-selected" id="devWidthRatioSelected">${currentWidthLabel}</div>
                <div class="select-options" id="devWidthRatioOptions">
                    ${widthPresets.map(p => `
                        <div class="select-option${parseFloat(p.value) === currentWidthRatio ? ' selected' : ''}" data-value="${p.value}">${p.label}</div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="setting-item">
            <span style="display:flex;align-items:center;gap:8px;">
                ${ICON_WRAPPER(DEV_ICONS.arrowMaximize)}
                <span class="setting-label">允许缩放的最大大小</span>
            </span>
            <div class="custom-select" id="devMaxScaleSelect">
                <div class="select-selected" id="devMaxScaleSelected">${currentScaleLabel}</div>
                <div class="select-options" id="devMaxScaleOptions">
                    ${scalePresets.map(p => `
                        <div class="select-option${parseInt(p.value) === currentMaxScale ? ' selected' : ''}" data-value="${p.value}">${p.label}</div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('devGoDetection')?.addEventListener('click', developer_options_show_detection);

    // 性能监视器开关
    (function setup_perf_monitor_toggle() {
        const toggle = document.getElementById('devPerfMonitorToggle');
        if (!toggle) return;
        toggle.addEventListener('change', () => {
            const enabled = toggle.checked;
            const invoke = window.__TAURI__?.core?.invoke;
            if (invoke) {
                invoke('settings_save_all', { settings: { perfMonitorEnabled: enabled, developerMode: true } });
            }
        });
    })();

    // 监视器更新频率选择器
    (function setup_perf_interval_select() {
        const select = document.getElementById('devPerfIntervalSelect');
        const selected = document.getElementById('devPerfIntervalSelected');
        const options = document.querySelectorAll('#devPerfIntervalOptions .select-option');

        if (!select || !selected) return;

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const v = parseInt(opt.dataset.value);
                selected.textContent = perf_interval_label(v);
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                select.classList.remove('open');

                const invoke = window.__TAURI__?.core?.invoke;
                if (invoke) {
                    invoke('settings_save_all', { settings: { perfMonitorInterval: v, developerMode: true } });
                }
            });
        });
    })();

    // 宽度比例选择器
    (function setup_width_ratio_select() {
        const select = document.getElementById('devWidthRatioSelect');
        const selected = document.getElementById('devWidthRatioSelected');
        const options = document.querySelectorAll('#devWidthRatioOptions .select-option');

        if (!select || !selected) return;

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const v = parseFloat(opt.dataset.value);
                selected.textContent = opt.textContent;
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                select.classList.remove('open');

                if (window.DRAW_CONFIG) {
                    window.DRAW_CONFIG.penMinWidthRatio = v;
                }
                const invoke = window.__TAURI__?.core?.invoke;
                if (invoke) {
                    invoke('settings_save_all', { settings: { penMinWidthRatio: v, developerMode: true } });
                }
            });
        });
    })();

    // 最大缩放选择器
    (function setup_max_scale_select() {
        const select = document.getElementById('devMaxScaleSelect');
        const selected = document.getElementById('devMaxScaleSelected');
        const options = document.querySelectorAll('#devMaxScaleOptions .select-option');

        if (!select || !selected) return;

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            select.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const v = parseInt(opt.dataset.value);
                selected.textContent = opt.textContent;
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                select.classList.remove('open');

                if (window.DRAW_CONFIG) {
                    window.DRAW_CONFIG.maxScaleImage = v;
                }
                const invoke = window.__TAURI__?.core?.invoke;
                if (invoke) {
                    invoke('settings_save_all', { settings: { maxScaleImage: v, developerMode: true } });
                }
            });
        });
    })();

    // 点击外部关闭所有下拉菜单
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
    });
}

function developer_options_show_detection() {
    const page = document.getElementById('pageDevOptions');
    if (!page) return;

    page.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <span id="devBackToMain" style="cursor:pointer;display:inline-flex;align-items:center;color:var(--color-muted, #888);padding:4px;">${DEV_ICONS.chevronLeft}</span>
            <h2 class="page-title" style="margin:0;">文档加载检测</h2>
        </div>
        <div class="setting-item">
            <span class="setting-label">Microsoft Office（COM）</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="devWordStatus" style="font-size:13px;color:var(--color-muted, #888);">未检测</span>
                <button class="btn-action" data-check="word">检测</button>
            </div>
        </div>
        <div class="setting-item">
            <span class="setting-label">WPS Office（COM）</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="devWpsStatus" style="font-size:13px;color:var(--color-muted, #888);">未检测</span>
                <button class="btn-action" data-check="wps">检测</button>
            </div>
        </div>
        <div class="setting-item">
            <span class="setting-label">LibreOffice（CLI）</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="devLibreStatus" style="font-size:13px;color:var(--color-muted, #888);">未检测</span>
                <button class="btn-action" data-check="libreoffice">检测</button>
            </div>
        </div>
        <div class="setting-item">
            <span class="setting-label">Mem Reduct</span>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="devMemreductStatus" style="font-size:13px;color:var(--color-muted, #888);">未检测</span>
                <button class="btn-action" data-check="memreduct">检测</button>
            </div>
        </div>
        <div class="setting-item" style="border-bottom:none;justify-content:center;padding-top:20px;">
            <button class="btn-action" id="devCleanMemory" style="color:var(--color-error, #ef4444);border-color:rgba(239,68,68,0.2);">清理内存</button>
        </div>
    `;

    document.getElementById('devBackToMain')?.addEventListener('click', developer_options_init);

    const cleanBtn = document.getElementById('devCleanMemory');
    if (cleanBtn) {
        cleanBtn.addEventListener('click', () => {
            const invoke = window.__TAURI__?.core?.invoke;
            if (invoke) {
                invoke('memreduct_clean_now');
            }
        });
    }

    const statusIds = { word: 'devWordStatus', wps: 'devWpsStatus', libreoffice: 'devLibreStatus', memreduct: 'devMemreductStatus' };
    const invoke = window.__TAURI__?.core?.invoke;
    if (!invoke) return;

    document.querySelectorAll('[data-check]').forEach(btn => {
        btn.addEventListener('click', () => {
            const check = btn.dataset.check;
            const statusEl = document.getElementById(statusIds[check]);
            if (!statusEl) return;

            statusEl.textContent = '检测中...';
            statusEl.style.color = 'var(--color-muted, #888)';
            statusEl.style.fontSize = '13px';
            statusEl.style.fontWeight = 'normal';

            let promise;
            if (check === 'memreduct') {
                promise = invoke('memreduct_check_installed');
            } else {
                promise = invoke('office_check_runtime').then(r => r[check]);
            }

            promise
                .then(ok => {
                    statusEl.textContent = ok ? '✓' : '✗';
                    statusEl.style.color = ok ? '#2ecc71' : '#e74c3c';
                    statusEl.style.fontSize = '20px';
                    statusEl.style.fontWeight = 'bold';
                })
                .catch(() => {
                    statusEl.textContent = '✗';
                    statusEl.style.color = '#e74c3c';
                    statusEl.style.fontSize = '20px';
                    statusEl.style.fontWeight = 'bold';
                });
        });
    });
}
