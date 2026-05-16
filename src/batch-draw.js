class RealtimeBatchDrawManager {
    constructor() {
        this.ctx = null;
        this.pendingCommands = [];
        this.pendingCount = 0;
        this.drawRafId = null;
        this.drawInterval = 1000 / 60;
        this.lastDrawTime = 0;
        this.lastType = null;
        this.lastColor = null;
        this.lastLineWidth = null;
        
        this.currentFps = 60;
        this.minFps = 15;
        this.maxFps = 60;
        this.fpsStep = 5;
        
        this.drawTimes = [];
        this.drawTimesMax = 10;
        
        this.commandCounts = [];
        this.commandCountsMax = 5;
        
        this.frameRateMode = 'adaptive';
        this.lastAdjustTime = 0;
        this.adjustCooldown = 100;
        
        this.lowLoadFps = 60;
        this.mediumLoadFps = 45;
        this.highLoadFps = 30;
        this.criticalLoadFps = 20;
        
        this.lowLoadThreshold = 10;
        this.mediumLoadThreshold = 30;
        this.highLoadThreshold = 50;
    }

    getCtx() {
        if (!this.ctx) {
            this.ctx = window.dom?.drawCtx;
        }
        return this.ctx;
    }

    setFrameRateMode(mode) {
        this.frameRateMode = mode;
        
        if (mode === 'low') {
            this.currentFps = 30;
            this.drawInterval = 1000 / 30;
        } else if (mode === 'high') {
            this.currentFps = 60;
            this.drawInterval = 1000 / 60;
        } else {
            this.currentFps = 60;
            this.drawInterval = 1000 / 60;
        }
    }

    get isAdaptive() {
        return this.frameRateMode === 'adaptive';
    }

    calculateTargetFps(commandCount) {
        if (commandCount < this.lowLoadThreshold) {
            return this.lowLoadFps;
        } else if (commandCount < this.mediumLoadThreshold) {
            return this.mediumLoadFps;
        } else if (commandCount < this.highLoadThreshold) {
            return this.highLoadFps;
        } else {
            return this.criticalLoadFps;
        }
    }

    adjustFps(drawTime, commandCount) {
        const now = performance.now();
        if (now - this.lastAdjustTime < this.adjustCooldown) {
            return;
        }
        this.lastAdjustTime = now;
        
        this.drawTimes.push(drawTime);
        if (this.drawTimes.length > this.drawTimesMax) {
            this.drawTimes.shift();
        }
        
        this.commandCounts.push(commandCount);
        if (this.commandCounts.length > this.commandCountsMax) {
            this.commandCounts.shift();
        }
        
        const avgDrawTime = this.drawTimes.reduce((a, b) => a + b, 0) / this.drawTimes.length;
        const avgCommandCount = this.commandCounts.reduce((a, b) => a + b, 0) / this.commandCounts.length;
        
        const targetFps = this.calculateTargetFps(avgCommandCount);
        const currentFrameTime = 1000 / this.currentFps;
        
        if (avgDrawTime > currentFrameTime * 1.5) {
            const newFps = Math.max(this.minFps, this.currentFps - this.fpsStep);
            if (newFps !== this.currentFps) {
                this.currentFps = newFps;
                this.drawInterval = 1000 / this.currentFps;
            }
        } else if (this.currentFps < targetFps && avgDrawTime < currentFrameTime * 0.7) {
            const newFps = Math.min(targetFps, this.currentFps + this.fpsStep);
            if (newFps !== this.currentFps) {
                this.currentFps = newFps;
                this.drawInterval = 1000 / this.currentFps;
            }
        }
    }

    getStats() {
        return {
            currentFps: this.currentFps,
            targetFps: this.calculateTargetFps(this.pendingCount),
            pendingCount: this.pendingCount,
            avgDrawTime: this.drawTimes.length > 0 
                ? this.drawTimes.reduce((a, b) => a + b, 0) / this.drawTimes.length 
                : 0,
            frameRateMode: this.frameRateMode
        };
    }

    addCommand(type, fromX, fromY, toX, toY, color, lineWidth) {
        const idx = this.pendingCount++;
        if (idx >= this.pendingCommands.length) {
            this.pendingCommands.push({ type, fromX, fromY, toX, toY, color, lineWidth });
        } else {
            const cmd = this.pendingCommands[idx];
            cmd.type = type;
            cmd.fromX = fromX;
            cmd.fromY = fromY;
            cmd.toX = toX;
            cmd.toY = toY;
            cmd.color = color;
            cmd.lineWidth = lineWidth;
        }

        if (this.isAdaptive && this.pendingCount === 1) {
            const targetFps = this.calculateTargetFps(1);
            if (this.currentFps > targetFps) {
                this.currentFps = targetFps;
                this.drawInterval = 1000 / this.currentFps;
            }
        }

        this.scheduleBatchDraw();
    }

    scheduleBatchDraw() {
        if (this.drawRafId !== null) return;

        const now = performance.now();
        const timeSinceLastDraw = now - this.lastDrawTime;

        if (timeSinceLastDraw >= this.drawInterval) {
            this.flushPending();
        } else {
            this.drawRafId = requestAnimationFrame(() => {
                this.drawRafId = null;
                this.flushPending();
            });
        }
    }

    flushPending() {
        const count = this.pendingCount;
        if (count === 0) return;
        this.pendingCount = 0;

        const ctx = this.getCtx();
        if (!ctx) return;

        const drawStart = performance.now();

        const commands = this.pendingCommands;
        let currentType = this.lastType;
        let currentColor = this.lastColor;
        let currentLineWidth = this.lastLineWidth;
        let currentPath = null;

        for (let i = 0; i < count; i++) {
            const cmd = commands[i];
            
            if (cmd.type !== currentType ||
                (cmd.type !== 'erase' && cmd.color !== currentColor) ||
                cmd.lineWidth !== currentLineWidth) {

                if (currentPath) {
                    ctx.stroke(currentPath);
                    currentPath = null;
                }

                currentType = cmd.type;
                currentColor = cmd.color;
                currentLineWidth = cmd.lineWidth;

                const scale = window.getSafeScale ? window.getSafeScale() : 1;
                
                if (cmd.type === 'erase') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                    ctx.lineWidth = cmd.lineWidth / scale;
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = cmd.color || '#3498db';
                    ctx.lineWidth = cmd.lineWidth / scale;
                }
            }

            if (!currentPath) {
                currentPath = new Path2D();
            }
            currentPath.moveTo(cmd.fromX, cmd.fromY);
            currentPath.lineTo(cmd.toX, cmd.toY);
        }

        if (currentPath) {
            ctx.stroke(currentPath);
        }

        const drawEnd = performance.now();
        const drawTime = drawEnd - drawStart;
        this.lastDrawTime = drawEnd;

        this.lastType = currentType;
        this.lastColor = currentColor;
        this.lastLineWidth = currentLineWidth;

        if (this.isAdaptive) {
            this.adjustFps(drawTime, count);
        }
    }

    _resetState() {
        this.pendingCount = 0;
        this.pendingCommands.length = 0;
        if (this.drawRafId !== null) {
            cancelAnimationFrame(this.drawRafId);
            this.drawRafId = null;
        }
        this.lastType = null;
        this.lastColor = null;
        this.lastLineWidth = null;
    }

    startDrawing() {
        this.pendingCount = 0;
        this.pendingCommands.length = 0;
        this.lastDrawTime = performance.now();
        
        if (this.isAdaptive) {
            this.currentFps = this.lowLoadFps;
            this.drawInterval = 1000 / this.currentFps;
        }
        
        const ctx = this.getCtx();
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }

    endDrawing() {
        if (this.drawRafId !== null) {
            cancelAnimationFrame(this.drawRafId);
            this.drawRafId = null;
        }

        this.flushPending();
        
        if (this.isAdaptive) {
            this.drawTimes = [];
            this.commandCounts = [];
        }
    }

    clear() {
        this._resetState();
    }
}

window.batchDrawManager = new RealtimeBatchDrawManager();
