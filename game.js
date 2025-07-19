// 星（背景）をクラスで管理
class Star {
    constructor(canvasWidth, canvasHeight) {
        this.reset(canvasWidth, canvasHeight);
    }
    reset(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.2 + 0.6;
        this.speed = Math.random() * 0.13 + 0.06;
        this.alpha = Math.random() * 0.7 + 0.3;
    }
    update(canvasWidth, canvasHeight) {
        this.y += this.speed;
        if (this.y > canvasHeight) this.reset(canvasWidth, 0);
    }
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// 流れ星
class ShootingStar {
    constructor(canvasWidth, canvasHeight) {
        this.reset(canvasWidth, canvasHeight);
        this.active = true;
    }
    reset(w, h) {
        this.x = Math.random() * w * 0.8 + w * 0.1;
        this.y = Math.random() * h * 0.2 + 2;
        this.len = Math.random() * 30 + 40;
        this.speed = Math.random() * 5 + 6;
        this.alpha = 0.65;
        this.active = true;
    }
    update(canvasWidth, canvasHeight) {
        this.x += this.speed * 0.8;
        this.y += this.speed * 0.3;
        this.alpha -= 0.016;
        if (this.x > canvasWidth || this.y > canvasHeight || this.alpha <= 0) {
            this.active = false;
        }
    }
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.len, this.y + this.len * 0.4);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.4, "#bff");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.len, this.y + this.len * 0.4);
        ctx.stroke();
        ctx.restore();
    }
}

// 爆発エフェクト
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frames = 0;
        this.maxFrames = 12;
        this.particles = [];
        // 8本の線を四方に放射
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = Math.random() * 1.5 + 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2.5 + 1.8,
                color: ["#fff", "#ff0", "#ff4100", "#ffd700"][Math.floor(Math.random()*4)]
            });
        }
    }
    update() {
        this.frames++;
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.radius *= 0.85;
        }
    }
    render(ctx) {
        for (let p of this.particles) {
            ctx.save();
            ctx.globalAlpha = 1.0 - this.frames / this.maxFrames;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        }
    }
    isAlive() {
        return this.frames < this.maxFrames;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.overlayContent = document.getElementById('overlayContent');

        this.gameState = 'menu'; // menu, playing, gameOver, victory
        this.score = 0;
        this.lives = 3;

        this.player = null;
        this.invaders = [];
        this.playerBullets = [];
        this.invaderBullets = [];
        this.explosions = [];

        this.stars = [];
        this.shootingStar = null;
        this.shootingStarTimer = 0;

        this.keys = {};
        this.lastTime = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileControls();
        this.createStars();
        this.showMenu();
    }

    createStars() {
        // 40個ほど星をつくる
        this.stars = [];
        for (let i = 0; i < 40; i++) {
            this.stars.push(new Star(this.canvas.width, this.canvas.height));
        }
    }

   maybeCreateShootingStar() {
    // たまにだけ流れ星（控えめ）
    if (!this.shootingStar && Math.random() < 0.001) { // 頻度をもっと控えめに
        this.shootingStar = new ShootingStar(this.canvas.width, this.canvas.height);
    }
}


    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.fireBullet();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('resize', () => {
            // 星を作り直す
            this.createStars();
        });
    }

    setupMobileControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const fireBtn = document.getElementById('fireBtn');
        if (leftBtn && rightBtn && fireBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowLeft'] = false;
            });
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys['ArrowRight'] = false;
            });
            fireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.fireBullet();
            });
        }
    }

    showMenu() {
        this.setOverlayContent('ゲーム開始');
        this.gameOverlay.classList.remove('hidden');
    }

    showGameOver() {
        this.setOverlayContent('リトライ', 'ゲームオーバー', `スコア: ${this.score}`);
        this.gameOverlay.classList.remove('hidden');
    }

    showVictory() {
        this.setOverlayContent('リトライ', 'ステージクリア！', `スコア: ${this.score}`);
        this.gameOverlay.classList.remove('hidden');
    }

    setOverlayContent(btnLabel, title = '', scoreText = '') {
        this.overlayContent.innerHTML = `
            <div class="instruction-group" style="margin-bottom:16px;">
                <div class="instruction">
                    <span class="key">←→</span>
                    <span class="description">移動</span>
                </div>
                <div class="instruction">
                    <span class="key">SPACE</span>
                    <span class="description">発射</span>
                </div>
            </div>
            ${title ? `<div style="color:#fff; margin: 4px 0 2px 0; font-size:1.08em;">${title}</div>` : ''}
            ${scoreText ? `<div style="color:#aaa; font-size:0.96em; margin-bottom:10px;">${scoreText}</div>` : ''}
            <button id="startButton" class="game-button">${btnLabel}</button>
        `;
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.gameState = 'playing';
        this.gameOverlay.classList.add('hidden');
        this.score = 0;
        this.lives = 3;
        this.explosions = [];
        this.createStars();
        this.shootingStar = null;
        this.shootingStarTimer = 0;
        this.initializeGameObjects();
        this.gameLoop();
    }

    initializeGameObjects() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 50);

        // --- 配置パラメータ ---
        const rows = 5;
        const cols = 10;
        const invaderWidth = 28;
        const invaderHeight = 21;
        const spacingX = 38;
        const spacingY = 34;
        const startX = (this.canvas.width - (cols * spacingX - (spacingX - invaderWidth))) / 2;
        const startY = 40;

        this.invaders = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * spacingX;
                const y = startY + row * spacingY;
                const type = row < 2 ? 'small' : row < 4 ? 'medium' : 'large';
                this.invaders.push(new Invader(x, y, type, invaderWidth, invaderHeight));
            }
        }

        this.playerBullets = [];
        this.invaderBullets = [];
    }

    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.update(deltaTime);
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.player.update(this.keys, this.canvas.width);
        this.updateInvaders(deltaTime);
        this.updateBullets();
        this.updateExplosions();
        this.updateStars();
        this.checkCollisions();
        this.checkGameState();
    }

    updateInvaders(deltaTime) {
        let moveDown = false;
        for (let invader of this.invaders) {
            if (invader.x <= 0 || invader.x >= this.canvas.width - invader.width) {
                moveDown = true;
                break;
            }
        }
        for (let invader of this.invaders) {
            invader.update(deltaTime, moveDown);
            if (moveDown) invader.y -= 3;
            if (Math.random() < 0.00013) {
                this.invaderBullets.push(new Bullet(invader.x + invader.width / 2, invader.y + invader.height, 170, 'down'));
            }
        }
    }

    updateBullets() {
        this.playerBullets = this.playerBullets.filter(bullet => {
            bullet.update();
            return bullet.y > 0;
        });
        this.invaderBullets = this.invaderBullets.filter(bullet => {
            bullet.update();
            return bullet.y < this.canvas.height;
        });
    }

    updateExplosions() {
        this.explosions = this.explosions.filter(e => {
            e.update();
            return e.isAlive();
        });
    }

    updateStars() {
        for (let star of this.stars) {
            star.update(this.canvas.width, this.canvas.height);
        }
        if (this.shootingStar) {
            this.shootingStar.update(this.canvas.width, this.canvas.height);
            if (!this.shootingStar.active) this.shootingStar = null;
        } else {
            this.maybeCreateShootingStar();
        }
    }

    checkCollisions() {
        // プレイヤー弾 vs インベーダー
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            for (let j = this.invaders.length - 1; j >= 0; j--) {
                const invader = this.invaders[j];
                if (this.isColliding(bullet, invader)) {
                    this.score += invader.points;
                    this.playerBullets.splice(i, 1);
                    this.invaders.splice(j, 1);
                    // 爆発エフェクト追加
                    this.explosions.push(new Explosion(invader.x + invader.width/2, invader.y + invader.height/2));
                    break;
                }
            }
        }
        // インベーダー弾 vs プレイヤー
        for (let i = this.invaderBullets.length - 1; i >= 0; i--) {
            const bullet = this.invaderBullets[i];
            if (this.isColliding(bullet, this.player)) {
                this.lives--;
                this.invaderBullets.splice(i, 1);
                // プレイヤーも爆発
                this.explosions.push(new Explosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2));
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                    this.showGameOver();
                }
                break;
            }
        }
        for (let invader of this.invaders) {
            if (invader.y + invader.height >= this.player.y) {
                this.gameState = 'gameOver';
                this.showGameOver();
                break;
            }
        }
    }

    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    checkGameState() {
        if (this.invaders.length === 0) {
            this.gameState = 'victory';
            this.showVictory();
        }
    }

    fireBullet() {
        if (this.gameState === 'playing' && this.playerBullets.length < 3) {
            this.playerBullets.push(new Bullet(this.player.x + 20, this.player.y, -340, 'up'));
        }
    }

    render() {
        // 背景
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // 星空＆流れ星
        for (let star of this.stars) star.render(this.ctx);
        if (this.shootingStar) this.shootingStar.render(this.ctx);

        // スコア＆ライフ（アイコン・ドット風）
        this.ctx.save();
        this.ctx.font = 'bold 19px "Consolas", "Arial", monospace';
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 2;
        // ライフは♡で
        let lifeStr = "";
        for (let i = 0; i < this.lives; i++) lifeStr += "♥ ";
        this.ctx.fillStyle = "#ff70b4";
        this.ctx.fillText(lifeStr.trim(), 12, 28);
        // スコアは右寄せでドット風
        this.ctx.font = 'bold 18px "Consolas", "Arial", monospace';
        this.ctx.fillStyle = "#89ff98";
        this.ctx.fillText(`SCORE:${this.score.toString().padStart(5,"0")}`, this.canvas.width-170, 28);
        this.ctx.restore();

        // 自機
        this.player.render(this.ctx);

        // インベーダー
        for (let invader of this.invaders) {
            invader.render(this.ctx);
        }
        // 弾
        for (let bullet of this.playerBullets) {
            bullet.render(this.ctx, '#00ff41');
        }
        for (let bullet of this.invaderBullets) {
            bullet.render(this.ctx, '#ff4100');
        }
        // エフェクト
        for (let e of this.explosions) e.render(this.ctx);
    }
}

// ドット絵風プレイヤー
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.speed = 300;
    }
    update(keys, canvasWidth) {
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed * 0.016;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed * 0.016;
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
    }
    render(ctx) {
        // ドット絵風自機（ビットパターン）
        const pattern = [
            "....XXXX....",
            "...XXXXXX...",
            "..XXXXXXXX..",
            ".XXXXXXXXXX.",
            "XXXXXXXXXXXX",
            "XXXX..XXXXXX",
            "XXX....XXXXX",
            "XX......XXXX"
        ];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = "#00ff41";
        for(let row=0; row<pattern.length; row++) {
            for(let col=0; col<pattern[row].length; col++) {
                if(pattern[row][col]==="X"){
                    ctx.fillRect(col*2.7, row*2.7, 2.6, 2.6);
                }
            }
        }
        ctx.restore();
    }
}

// ドット絵風インベーダー
class Invader {
    constructor(x, y, type, width = 28, height = 21) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.speed = 10;
        this.direction = 1;
        this.animationFrame = 0;
        this.animationTime = 0;
        this.points = type === 'small' ? 30 : type === 'medium' ? 20 : 10;
        this.color = { small: "#ff4100", medium: "#ffff00", large: "#b083ff" }[type];
    }
    update(deltaTime, moveDown) {
        this.animationTime += deltaTime;
        if (this.animationTime > 450) {
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.animationTime = 0;
        }
        if (moveDown) {
            this.y += 3;
            this.direction *= -1;
        } else {
            this.x += this.speed * this.direction * 0.016;
        }
    }
    render(ctx) {
        // 8x8ビットパターン（2フレームアニメ）色つき
        const patterns = [
            [
                "........",
                "..XXXX..",
                ".X....X.",
                "XXXXXXX.",
                "X.X..X.X",
                "XXXXXXX.",
                ".X....X.",
                "X......X"
            ],
            [
                "........",
                "..XXXX..",
                ".X....X.",
                "XXXXXXX.",
                "X.X..X.X",
                "XXXXXXX.",
                "..X..X..",
                "X..XX..X"
            ]
        ];
        const size = 2.8; // ドットの大きさ
        const pattern = patterns[this.animationFrame];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        for(let row=0; row<pattern.length; row++) {
            for(let col=0; col<pattern[row].length; col++) {
                if(pattern[row][col]==="X"){
                    ctx.fillRect(col*size, row*size, size, size);
                }
            }
        }
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, speed, direction) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = speed;
        this.direction = direction;
    }
    update() {
        this.y += this.speed * 0.016;
    }
    render(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

window.addEventListener('load', () => {
    new Game();
});
