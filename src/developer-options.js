/**
 * ViewStage 开发者选项
 * 通过关于页面图标点击5次打开
 */

function developer_options_init() {
    developer_options_show_main();
}

function developer_options_show_main() {
    const page = document.getElementById('pageDevOptions');
    if (!page) return;

    const currentVal = window.DRAW_CONFIG?.penMinWidthRatio ?? 0.2;
    const presets = [
        { value: '0.05', label: '0.05' },
        { value: '0.1', label: '0.10' },
        { value: '0.15', label: '0.15' },
        { value: '0.2', label: '0.20（默认）' },
        { value: '0.25', label: '0.25' },
        { value: '0.3', label: '0.30' },
        { value: '0.4', label: '0.40' },
        { value: '0.5', label: '0.50' },
        { value: '0.75', label: '0.75' },
        { value: '1', label: '1.00' },
    ];
    const currentLabel = presets.find(p => parseFloat(p.value) === currentVal)?.label
        || currentVal.toFixed(2);

    page.innerHTML = `
        <h2 class="page-title">开发者选项</h2>
        <div class="setting-item">
            <span class="setting-label">文档加载检测</span>
            <span id="devGoDetection" style="cursor:pointer;font-size:18px;color:var(--color-muted, #888);padding:4px;">→</span>
        </div>
        <div class="setting-item">
            <span class="setting-label">最快速度时宽度比例</span>
            <div class="custom-select" id="devWidthRatioSelect">
                <div class="select-selected" id="devWidthRatioSelected">${currentLabel}</div>
                <div class="select-options" id="devWidthRatioOptions">
                    ${presets.map(p => `
                        <div class="select-option${parseFloat(p.value) === currentVal ? ' selected' : ''}" data-value="${p.value}">${p.label}</div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('devGoDetection')?.addEventListener('click', developer_options_show_detection);

    const select = document.getElementById('devWidthRatioSelect');
    const selected = document.getElementById('devWidthRatioSelected');
    const options = document.querySelectorAll('#devWidthRatioOptions .select-option');

    if (select && selected) {
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

        document.addEventListener('click', (e) => {
            if (!select.contains(e.target)) {
                select.classList.remove('open');
            }
        });
    }
}

function developer_options_show_detection() {
    const page = document.getElementById('pageDevOptions');
    if (!page) return;

    page.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <span id="devBackToMain" style="cursor:pointer;font-size:18px;color:var(--color-muted, #888);padding:4px;">←</span>
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

    document.getElementById('devBackToMain')?.addEventListener('click', developer_options_show_main);

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
