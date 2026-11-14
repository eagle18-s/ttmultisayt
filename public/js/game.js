/**
 * Corsairs — Orbit Game
 * Top-down circular orbit game inspired by the provided video.
 * Player ship orbits a central island, collects coins, avoids projectiles.
 */

class CorsairsGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.score = 0;
    this.level = 1;
    this.difficulty = 1.4;

    // Resize
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Game state
    this.center = { x: 0, y: 0 };
    this.radius = 0;          // orbit radius
    this.islandR = 0;
    this.shipAngle = -Math.PI / 2;
    this.shipSpeed = 0.018;   // rad per frame
    this.direction = 1;       // 1 = clockwise, -1 = counter
    this.coins = [];
    this.projectiles = [];
    this.particles = [];
    this.coinCount = 24;
    this.spawnTimer = 0;
    this.hitCooldown = 0;

    // Bind
    this.loop = this.loop.bind(this);
  }

  resize() {
    const max = Math.min(window.innerWidth - 32, 420);
    this.canvas.width = max;
    this.canvas.height = max;
    this.center = { x: max / 2, y: max / 2 };
    this.radius = max * 0.38;
    this.islandR = max * 0.13;
  }

  setDifficulty(d) {
    this.difficulty = parseFloat(d) || 1.4;
  }

  start() {
    this.score = 0;
    this.level = 1;
    this.shipAngle = -Math.PI / 2;
    this.direction = 1;
    this.projectiles = [];
    this.particles = [];
    this.hitCooldown = 0;
    this.spawnCoins();
    this.running = true;
    this.updateUI();
    document.getElementById('gameOver').hidden = true;
    requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
  }

  spawnCoins() {
    this.coins = [];
    const count = this.coinCount + (this.level - 1) * 4;
    for (let i = 0; i < count; i++) {
      this.coins.push({
        angle: (i / count) * Math.PI * 2,
        collected: false,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  shipPos() {
    return {
      x: this.center.x + Math.cos(this.shipAngle) * this.radius,
      y: this.center.y + Math.sin(this.shipAngle) * this.radius
    };
  }

  turnLeft() {
    if (!this.running) return;
    this.direction = -1;
  }

  turnRight() {
    if (!this.running) return;
    this.direction = 1;
  }

  updateUI() {
    document.getElementById('levelBadge').textContent = `Level ${this.level}`;
    document.getElementById('scoreBadge').textContent = `${this.score} 🪙`;
  }

  spawnProjectile() {
    // Projectiles come from outside toward the orbit
    const angle = Math.random() * Math.PI * 2;
    const dist = this.radius * 1.8;
    this.projectiles.push({
      x: this.center.x + Math.cos(angle) * dist,
      y: this.center.y + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * (1.8 + this.level * 0.3) * this.difficulty,
      vy: -Math.sin(angle) * (1.8 + this.level * 0.3) * this.difficulty,
      r: 7
    });
  }

  addParticles(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 30 + Math.random() * 20,
        color
      });
    }
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update() {
    // Ship movement
    this.shipAngle += this.shipSpeed * this.direction * this.difficulty;
    if (this.shipAngle > Math.PI * 2) this.shipAngle -= Math.PI * 2;
    if (this.shipAngle < 0) this.shipAngle += Math.PI * 2;

    const ship = this.shipPos();

    // Collect coins
    for (const c of this.coins) {
      if (c.collected) continue;
      c.pulse += 0.08;
      const cx = this.center.x + Math.cos(c.angle) * this.radius;
      const cy = this.center.y + Math.sin(c.angle) * this.radius;
      const dx = ship.x - cx;
      const dy = ship.y - cy;
      if (dx * dx + dy * dy < 22 * 22) {
        c.collected = true;
        this.score += 1;
        this.addParticles(cx, cy, '#f5c518', 6);
        this.updateUI();
      }
    }

    // Level up when all coins collected
    if (this.coins.every(c => c.collected)) {
      this.level++;
      this.spawnCoins();
      this.updateUI();
    }

    // Projectiles
    this.spawnTimer++;
    if (this.spawnTimer > 90 / this.difficulty) {
      this.spawnTimer = 0;
      this.spawnProjectile();
      if (this.level > 2 && Math.random() > 0.5) this.spawnProjectile();
    }

    if (this.hitCooldown > 0) this.hitCooldown--;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Hit ship?
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      if (dx * dx + dy * dy < (12 + p.r) * (12 + p.r) && this.hitCooldown <= 0) {
        this.gameOver();
        return;
      }

      // Out of bounds
      if (p.x < -50 || p.x > this.canvas.width + 50 ||
          p.y < -50 || p.y > this.canvas.height + 50) {
        this.projectiles.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  gameOver() {
    this.running = false;
    const go = document.getElementById('gameOver');
    document.getElementById('finalScore').textContent = `${this.score} 🪙`;
    go.hidden = false;
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky
    const grad = ctx.createRadialGradient(this.center.x, this.center.y, 0, this.center.x, this.center.y, w * 0.7);
    grad.addColorStop(0, '#a8e0f0');
    grad.addColorStop(1, '#6ec6e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft orbit ring
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Island (sand)
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.islandR, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c070';
    ctx.fill();
    // Inner dark circle (turret base)
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.islandR * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#4a4a55';
    ctx.fill();
    // Center detail
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, this.islandR * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a32';
    ctx.fill();

    // Bushes
    this.drawBush(this.center.x - this.islandR * 0.55, this.center.y - this.islandR * 0.4);
    this.drawBush(this.center.x + this.islandR * 0.5, this.center.y + this.islandR * 0.45);

    // Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      const cx = this.center.x + Math.cos(c.angle) * this.radius;
      const cy = this.center.y + Math.sin(c.angle) * this.radius;
      const pulse = 1 + Math.sin(c.pulse) * 0.08;
      ctx.beginPath();
      ctx.arc(cx, cy, 9 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 5 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe066';
      ctx.fill();
      // coin shine
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Projectiles
    for (const p of this.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2a2a';
      ctx.fill();
      // trail
      ctx.beginPath();
      ctx.arc(p.x - p.vx * 2, p.y - p.vy * 2, p.r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,40,40,0.4)';
      ctx.fill();
    }

    // Particles
    for (const pt of this.particles) {
      ctx.globalAlpha = pt.life / 40;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Ship
    const ship = this.shipPos();
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // Orient ship along tangent
    const angle = this.shipAngle + (this.direction > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.rotate(angle);
    // Body
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fillStyle = '#5c3a1e';
    ctx.fill();
    // Nose
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(6, 4);
    ctx.lineTo(6, -4);
    ctx.closePath();
    ctx.fillStyle = '#2a1a0a';
    ctx.fill();
    ctx.restore();
  }

  drawBush(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3a9a3a';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2d7a2d';
    ctx.fill();
  }
}

// Global instance
let game = null;

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  game = new CorsairsGame(canvas);
  game.draw(); // initial static frame
}
