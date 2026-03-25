// ============================================================
//  DATA CLEANER: OUTLIER INVADERS  — Phaser 3 Game
//  Retro Arcade / Pixel Art  |  Portrait Mobile
// ============================================================

/* ── GLOBAL CONSTANTS ─────────────────────────────────── */
const GW   = 480;   // game width
const GH   = 854;   // game height
const LANE_COUNT  = 3;
const LANE_X      = [120, 240, 360];   // centre x of each lane
const LANE_WIDTH  = 100;
const HUD_H       = 72;
const PLAY_TOP    = HUD_H + 8;
const PLAY_BOT    = GH - 70;          // bottom of play area (score zone)
const PLAYER_X    = 28;
const PLAYER_Y    = PLAY_TOP + 180;

// Palette
const C = {
  BG:        0x0a0a1a,
  BG2:       0x0d0d22,
  LANE_BG:   0x111133,
  LANE_LINE: 0x2a2a5a,
  HUD_BG:    0x060618,
  CYAN:      0x00e5ff,
  YELLOW:    0xffeb3b,
  RED:       0xff1744,
  GREEN:     0x00e676,
  PURPLE:    0xaa00ff,
  PINK:      0xff00ff,
  ORANGE:    0xff6d00,
  BLUE:      0x2979ff,
  DGREY:     0x222244,
  WHITE:     0xffffff,
};

/* ── SOUND SYSTEM (Web Audio API) ─────────────────────── */
class SoundSystem {
  constructor() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.enabled = true;
    } catch(e) { this.enabled = false; }
  }
  _play(freq, type, dur, vol=0.3, freqEnd=null) {
    if (!this.enabled) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.ctx.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.start(this.ctx.currentTime);
      o.stop(this.ctx.currentTime + dur);
    } catch(e){}
  }
  shoot()      { this._play(880, 'sawtooth', 0.08, 0.2, 220); }
  destroy()    { this._play(440, 'square',   0.15, 0.35, 55); this._play(220,'sawtooth',0.12,0.25,880); }
  miss()       { this._play(120, 'sawtooth', 0.3,  0.4, 60); }
  score()      { this._play(660, 'square',   0.1,  0.2, 880); }
  multiplier() { this._play(523, 'square',   0.05, 0.3); this._play(784,'square',0.05,0.3); this._play(1046,'square',0.15,0.3); }
  gameOver()   {
    const notes = [440,330,220,165];
    notes.forEach((n,i)=> { setTimeout(()=>this._play(n,'sawtooth',0.4,0.4,n*0.7), i*200); });
  }
  levelUp()    { [523,659,784,1046].forEach((n,i)=> setTimeout(()=>this._play(n,'square',0.1,0.3),i*80)); }
}

const SFX = new SoundSystem();

/* ── TEXTURE FACTORY ──────────────────────────────────── */
function makeTextures(scene) {

  function px(g, x, y, w, h, color) {
    g.fillStyle(color); g.fillRect(x, y, w, h);
  }

  // NULL item — purple/magenta glitched square 64x64
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    // body
    g.fillStyle(0x4a0080); g.fillRect(4,4,56,56);
    g.fillStyle(0x8b00ff); g.fillRect(8,8,48,48);
    // glitch stripes
    [12,22,32,42,52].forEach((y,i)=>{ if(i%2===0){g.fillStyle(0xff00ff); g.fillRect(8,y,48,4);} });
    // inner dark
    g.fillStyle(0x2a003a); g.fillRect(16,18,32,28);
    // "NULL" text pixels (simplified pixel letters)
    g.fillStyle(0xffffff);
    // N
    g.fillRect(18,20,3,16); g.fillRect(21,23,3,4); g.fillRect(24,26,3,4); g.fillRect(27,20,3,16);
    // U
    g.fillRect(31,20,3,12); g.fillRect(34,32,6,4); g.fillRect(40,20,3,12);
    // border glow
    g.lineStyle(2,0xff00ff,0.8); g.strokeRect(2,2,60,60);
    g.lineStyle(1,0xaa00ff,0.5); g.strokeRect(0,0,64,64);
    g.generateTexture('null_item', 64, 64);
    g.destroy();
  })();

  // OUTLIER item — red spiky star 64x64
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    // dark bg
    g.fillStyle(0x1a0000); g.fillRect(0,0,64,64);
    // star body using polygon
    g.fillStyle(0xff1744);
    const pts=[32,4, 38,22, 58,22, 44,34, 50,54, 32,42, 14,54, 20,34, 6,22, 26,22];
    const ps=[]; for(let i=0;i<pts.length;i+=2) ps.push({x:pts[i],y:pts[i+1]});
    g.fillPoints(ps, true);
    // inner lighter
    g.fillStyle(0xff6680);
    const pts2=[32,14,36,24,48,24,40,30,44,44,32,36,20,44,24,30,16,24,28,24];
    const ps2=[]; for(let i=0;i<pts2.length;i+=2) ps2.push({x:pts2[i],y:pts2[i+1]});
    g.fillPoints(ps2, true);
    // dark center
    g.fillStyle(0x8b0000); g.fillRect(26,26,12,12);
    // border glow
    g.lineStyle(2,0xff6680,1); g.strokeRect(1,1,62,62);
    g.generateTexture('outlier_item', 64, 64);
    g.destroy();
  })();

  // VALID item — clean green square 56x56
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x003311); g.fillRect(0,0,56,56);
    g.fillStyle(0x00c853); g.fillRect(4,4,48,48);
    g.fillStyle(0x00e676); g.fillRect(8,8,40,40);
    // checkmark
    g.lineStyle(5, 0xffffff, 1);
    g.beginPath(); g.moveTo(14,28); g.lineTo(24,38); g.lineTo(42,18); g.strokePath();
    g.lineStyle(2,0x00e676,1); g.strokeRect(2,2,52,52);
    g.lineStyle(1,0x69f0ae,0.6); g.strokeRect(0,0,56,56);
    g.generateTexture('valid_item', 56, 56);
    g.destroy();
  })();

  // LOG_OK item — orange square 56x56
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x3a1a00); g.fillRect(0,0,56,56);
    g.fillStyle(0xff6d00); g.fillRect(4,4,48,48);
    g.fillStyle(0xff9100); g.fillRect(8,8,40,40);
    // log lines
    g.fillStyle(0x1a0a00);
    [16,24,32].forEach(y=>{ g.fillRect(12,y,32,4); });
    g.lineStyle(2,0xffab40,1); g.strokeRect(2,2,52,52);
    g.generateTexture('log_item', 56, 56);
    g.destroy();
  })();

  // IMAGE_01 item — blue circle 56x56
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x000d33); g.fillRect(0,0,56,56);
    g.fillStyle(0x1a4fff); g.fillCircle(28,28,26);
    g.fillStyle(0x5c92ff); g.fillCircle(28,28,20);
    g.fillStyle(0x001a66); g.fillCircle(28,28,12);
    g.fillStyle(0x82b1ff); g.fillCircle(28,28,6);
    g.lineStyle(2,0x82b1ff,1); g.strokeCircle(28,28,26);
    g.generateTexture('image_item', 56, 56);
    g.destroy();
  })();

  // Player robot body 80x110
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    // feet
    g.fillStyle(0x334455); g.fillRect(10,95,18,12); g.fillRect(52,95,18,12);
    // legs
    g.fillStyle(0x445566); g.fillRect(14,78,14,20); g.fillRect(52,78,14,20);
    // body
    g.fillStyle(0x2a3a4a); g.fillRect(8,42,64,40);
    g.fillStyle(0x3a4a5a); g.fillRect(12,46,56,32);
    // chest panel
    g.fillStyle(0x00e5ff); g.fillRect(20,52,18,14);
    g.fillStyle(0xff6d00); g.fillRect(42,52,14,14);
    // arms
    g.fillStyle(0x2a3a4a); g.fillRect(0,44,10,24);
    g.fillStyle(0x2a3a4a); g.fillRect(70,44,10,24);
    // head / helmet
    g.fillStyle(0x1a2a3a); g.fillRect(16,8,48,38);
    g.fillStyle(0x2a3a4a); g.fillRect(20,12,40,30);
    // visor
    g.fillStyle(0x00e5ff); g.fillRect(22,16,36,18);
    g.fillStyle(0x004d66); g.fillRect(26,18,28,14);
    // eyes in visor
    g.fillStyle(0x00ffff); g.fillRect(28,20,8,8);
    g.fillStyle(0x00ffff); g.fillRect(44,20,8,8);
    // pupils
    g.fillStyle(0xffffff); g.fillRect(30,22,3,3); g.fillRect(46,22,3,3);
    // helmet bolt
    g.fillStyle(0xffeb3b); g.fillRect(32,4,16,10);
    g.fillStyle(0xffa000); g.fillRect(34,6,12,6);
    // border
    g.lineStyle(1,0x5599bb,0.8); g.strokeRect(8,42,64,40);
    g.generateTexture('player', 80, 110);
    g.destroy();
  })();

  // Gun / Blaster 60x22
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x1a1a2e); g.fillRect(0,6,50,12);
    g.fillStyle(0x2a3a4a); g.fillRect(0,7,48,10);
    g.fillStyle(0x00e5ff); g.fillRect(4,9,40,6);  // laser channel
    g.fillStyle(0x334455); g.fillRect(10,3,24,18); // grip
    g.fillStyle(0xff6d00); g.fillRect(12,5,10,14); // energy cell
    g.fillStyle(0xffeb3b); g.fillRect(48,8,12,6);  // muzzle
    g.generateTexture('gun', 60, 22);
    g.destroy();
  })();

  // Laser bullet 48x8
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x006688); g.fillRect(0,2,48,4);
    g.fillStyle(0x00e5ff); g.fillRect(2,3,44,2);
    g.fillStyle(0xffffff); g.fillRect(4,3,10,2);
    g.generateTexture('laser', 48, 8);
    g.destroy();
  })();

  // Heart (life icon) 24x22
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xff1744);
    const hp=[4,8, 0,4, 0,0, 4,0, 8,2, 12,0, 16,0, 16,4, 12,8, 8,12];
    const hpts=[]; for(let i=0;i<hp.length;i+=2) hpts.push({x:hp[i]*1.5, y:hp[i+1]*1.5});
    g.fillPoints(hpts, true);
    g.fillStyle(0xff6680); g.fillRect(6,4,5,5);
    g.generateTexture('heart', 24, 22);
    g.destroy();
  })();

  // Empty heart 24x22
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x331122);
    const hp=[4,8, 0,4, 0,0, 4,0, 8,2, 12,0, 16,0, 16,4, 12,8, 8,12];
    const hpts=[]; for(let i=0;i<hp.length;i+=2) hpts.push({x:hp[i]*1.5, y:hp[i+1]*1.5});
    g.fillPoints(hpts, true);
    g.lineStyle(1,0x882244,1);
    g.generateTexture('heart_empty', 24, 22);
    g.destroy();
  })();

  // Score robot (right side collector) 60x80
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x1a2a1a); g.fillRect(8,30,44,36);
    g.fillStyle(0x2a4a2a); g.fillRect(12,34,36,28);
    g.fillStyle(0x00e676); g.fillRect(18,40,10,10);
    g.fillStyle(0x00c853); g.fillRect(32,40,10,10);
    g.fillStyle(0x1a2a1a); g.fillRect(12,4,36,28);
    g.fillStyle(0x00e676); g.fillRect(16,8,28,16);
    g.fillStyle(0x003311); g.fillRect(20,10,20,12);
    g.fillStyle(0x69f0ae); g.fillRect(22,12,6,6); g.fillRect(32,12,6,6);
    g.fillStyle(0xffeb3b); g.fillRect(24,0,12,8);
    g.fillStyle(0x1a2a1a); g.fillRect(2,32,12,18); g.fillRect(46,32,12,18);
    g.fillStyle(0x1a2a1a); g.fillRect(10,64,14,14); g.fillRect(36,64,14,14);
    g.generateTexture('score_robot', 60, 80);
    g.destroy();
  })();

  // Explosion frame 1 (80x80)
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffeb3b,0.9); g.fillCircle(40,40,32);
    g.fillStyle(0xff6d00,0.8); g.fillCircle(40,40,24);
    g.fillStyle(0xff1744,0.7); g.fillCircle(40,40,16);
    g.fillStyle(0xffffff,0.5); g.fillCircle(40,40,8);
    // sparks
    const sparks=[[40,8],[72,40],[40,72],[8,40],[60,12],[68,60],[20,64],[12,20]];
    g.fillStyle(0xffeb3b,1);
    sparks.forEach(([x,y])=>g.fillRect(x-3,y-3,6,6));
    g.generateTexture('explosion1', 80, 80);
    g.destroy();
  })();

  // Explosion frame 2 (100x100) — bigger
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xff6d00,0.6); g.fillCircle(50,50,46);
    g.fillStyle(0xffeb3b,0.5); g.fillCircle(50,50,36);
    g.fillStyle(0xff1744,0.3); g.fillCircle(50,50,24);
    const sparks=[[50,4],[96,50],[50,96],[4,50],[76,14],[86,76],[24,82],[14,24],[50,28],[72,28]];
    g.fillStyle(0xff9100,0.8);
    sparks.forEach(([x,y])=>g.fillRect(x-4,y-4,8,8));
    g.generateTexture('explosion2', 100, 100);
    g.destroy();
  })();

  // Background scanlines tile 480x4
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x000000,0.12); g.fillRect(0,0,480,2);
    g.fillStyle(0x000000,0); g.fillRect(0,2,480,2);
    g.generateTexture('scanline', 480, 4);
    g.destroy();
  })();

  // Star particle 4x4
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffffff); g.fillRect(0,0,4,4);
    g.generateTexture('particle', 4, 4);
    g.destroy();
  })();

  // Conveyor arrow 20x12
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x2a2a5a);
    g.fillTriangle(0,0,20,6,0,12);
    g.generateTexture('arrow', 20, 12);
    g.destroy();
  })();
}

/* ── BOOT SCENE ───────────────────────────────────────── */
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    makeTextures(this);
    this.scene.start('Menu');
  }
}

/* ── MENU SCENE ───────────────────────────────────────── */
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const w = GW, h = GH;

    // Background
    this.add.rectangle(w/2, h/2, w, h, C.BG);

    // Animated lane columns
    this.laneItems = [];
    LANE_X.forEach((lx, li) => {
      this.add.rectangle(lx, h/2, LANE_WIDTH, h, C.LANE_BG, 0.5);
      this.add.rectangle(lx, h/2, 2, h, C.LANE_LINE, 0.4);
      // Falling demo items
      for (let i = 0; i < 4; i++) {
        const types = ['null_item','outlier_item','valid_item','log_item','image_item'];
        const t = types[Math.floor(Math.random() * types.length)];
        const sz = (t==='null_item'||t==='outlier_item') ? 48 : 42;
        const item = this.add.image(lx, -100 - i * 220, t).setDisplaySize(sz, sz).setAlpha(0.4);
        this.laneItems.push({ img: item, speed: 90 + li * 20, reset: -120 });
      }
    });

    // Scanlines overlay
    for (let y = 0; y < h; y += 4) {
      this.add.rectangle(w/2, y, w, 2, 0x000000, 0.08);
    }

    // Title box
    this.add.rectangle(w/2, 220, 440, 160, 0x000033, 0.95);
    this.add.rectangle(w/2, 220, 444, 164, 0, 0).setStrokeStyle(3, 0x00e5ff);

    // Title text
    const titleStyle = { fontFamily:'monospace', fontSize:'38px', color:'#ffeb3b',
      stroke:'#ff6d00', strokeThickness:4, shadow:{color:'#ff6d00',fill:true,blur:12} };
    this.add.text(w/2, 180, 'DATA CLEANER', titleStyle).setOrigin(0.5);

    const subStyle = { fontFamily:'monospace', fontSize:'20px', color:'#00e5ff',
      stroke:'#005566', strokeThickness:2 };
    this.add.text(w/2, 228, 'OUTLIER  INVADERS', subStyle).setOrigin(0.5);

    this.add.text(w/2, 262, '— RETRO ARCADE —', {
      fontFamily:'monospace', fontSize:'13px', color:'#8888cc'
    }).setOrigin(0.5);

    // Score display
    const hi = parseInt(localStorage.getItem('dc_hiscore') || '0');
    this.add.text(w/2, 340, `HI-SCORE: ${String(hi).padStart(7,'0')}`, {
      fontFamily:'monospace', fontSize:'20px', color:'#ffeb3b'
    }).setOrigin(0.5);

    // Instructions
    const instrBox = this.add.rectangle(w/2, 490, 420, 180, 0x000022, 0.9);
    this.add.rectangle(w/2, 490, 424, 184, 0, 0).setStrokeStyle(2, C.PURPLE);
    const instrStyle = { fontFamily:'monospace', fontSize:'14px', color:'#ccccee', lineSpacing:8 };
    this.add.text(w/2, 420, '── HOW TO PLAY ──', {
      fontFamily:'monospace', fontSize:'15px', color:'#00e5ff'
    }).setOrigin(0.5);
    this.add.text(w/2, 450,
      '💥 TAP  NULL / OUTLIER  to DESTROY\n' +
      '    → Earn points + multiplier!\n\n' +
      '✅ DON\'T tap VALID / LOG / IMAGE\n' +
      '    → They score in the ZONE below!\n\n' +
      '❤️  Miss 3 BAD items = GAME OVER',
      { ...instrStyle, align:'center' }
    ).setOrigin(0.5);

    // Item type legend
    this.add.text(w/2, 620, '── DATA TYPES ──', {
      fontFamily:'monospace', fontSize:'13px', color:'#ffeb3b'
    }).setOrigin(0.5);
    const legend = [
      { tex:'null_item',    sz:28, label:'NULL     — BAD!  ×50pts', col:'#ff66ff' },
      { tex:'outlier_item', sz:28, label:'OUTLIER  — BAD!  ×50pts', col:'#ff4466' },
      { tex:'valid_item',   sz:26, label:'VALID    — GOOD  +30pts', col:'#00e676' },
      { tex:'log_item',     sz:26, label:'LOG_OK   — GOOD  +25pts', col:'#ff9100' },
      { tex:'image_item',   sz:26, label:'IMAGE_01 — GOOD  +20pts', col:'#82b1ff' },
    ];
    legend.forEach((l, i) => {
      const y = 652 + i * 36;
      this.add.image(62, y, l.tex).setDisplaySize(l.sz, l.sz);
      this.add.text(86, y, l.label, {
        fontFamily:'monospace', fontSize:'13px', color:l.col
      }).setOrigin(0, 0.5);
    });

    // START button (pulsing)
    const btnBg = this.add.rectangle(w/2, GH-60, 280, 60, 0x00aa33);
    this.add.rectangle(w/2, GH-60, 284, 64, 0, 0).setStrokeStyle(3, 0x00e676);
    const btnText = this.add.text(w/2, GH-60, 'TAP  TO  START', {
      fontFamily:'monospace', fontSize:'24px', color:'#ffffff',
      stroke:'#006611', strokeThickness:3
    }).setOrigin(0.5);

    this.tweens.add({ targets:[btnBg, btnText], alpha:0.6, yoyo:true, repeat:-1, duration:600, ease:'Sine.easeInOut' });

    // Input
    this.input.once('pointerdown', () => {
      SFX.levelUp();
      this.cameras.main.fadeOut(300, 10, 10, 30);
      this.time.delayedCall(320, () => this.scene.start('Game'));
    });

    // Animate lanes
    this.time.addEvent({ delay:16, callback:()=>this._animateLanes(), callbackScope:this, loop:true });

    this.cameras.main.fadeIn(400, 10, 10, 30);
  }

  _animateLanes() {
    this.laneItems.forEach(({ img, speed }) => {
      img.y += speed * 0.016;
      if (img.y > GH + 60) img.y = -100;
    });
  }
}

/* ── GAME SCENE ───────────────────────────────────────── */
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this._initState();
    this._buildBG();
    this._buildHUD();
    this._buildPlayer();
    this._buildScoreZone();
    this._buildParticles();

    // Groups
    this.dataItems  = this.add.group();
    this.lasers     = this.add.group();
    this.scoreTexts = this.add.group();

    // Spawn timer
    this._startSpawnTimer();

    // Difficulty timer
    this.time.addEvent({ delay:25000, callback:this._levelUp, callbackScope:this, loop:true });

    // Input — tap to shoot
    this.input.on('pointerdown', this._onTap, this);

    this.cameras.main.fadeIn(400, 10, 10, 30);
  }

  _initState() {
    this.score      = 0;
    this.lives      = 3;
    this.multiplier = 1;
    this.combo      = 0;
    this.level      = 1;
    this.baseSpeed  = 160;
    this.spawnDelay = 1400;
    this.isGameOver = false;
    this.isShooting = false;
    this.shootQueue = [];
  }

  _buildBG() {
    const w=GW, h=GH;
    // Dark bg
    this.add.rectangle(w/2, h/2, w, h, C.BG);
    // Lane columns
    LANE_X.forEach(lx => {
      this.add.rectangle(lx, (PLAY_TOP+PLAY_BOT)/2, LANE_WIDTH-4, PLAY_BOT-PLAY_TOP, C.LANE_BG, 0.6);
      this.add.rectangle(lx, (PLAY_TOP+PLAY_BOT)/2, 1, PLAY_BOT-PLAY_TOP, C.LANE_LINE, 0.6);
    });
    // Conveyor arrows (decorative)
    for (let y = PLAY_TOP+20; y < PLAY_BOT-20; y += 50) {
      LANE_X.forEach(lx => {
        this.add.image(lx, y, 'arrow').setAlpha(0.12).setDisplaySize(20,12);
      });
    }
    // Left wall (player zone)
    this.add.rectangle(40, (PLAY_TOP+PLAY_BOT)/2, 78, PLAY_BOT-PLAY_TOP, 0x080818, 0.8);
    this.add.rectangle(80, (PLAY_TOP+PLAY_BOT)/2, 2, PLAY_BOT-PLAY_TOP, 0x3344aa, 0.7);
    // Right score zone wall
    this.add.rectangle(GW-40, (PLAY_TOP+PLAY_BOT)/2, 78, PLAY_BOT-PLAY_TOP, 0x080818, 0.8);
    this.add.rectangle(GW-80, (PLAY_TOP+PLAY_BOT)/2, 2, PLAY_BOT-PLAY_TOP, 0x226622, 0.7);
    // Scanlines
    for (let y = 0; y < h; y += 4) {
      this.add.rectangle(w/2, y, w, 2, 0x000000, 0.07);
    }
  }

  _buildHUD() {
    // HUD background
    this.add.rectangle(GW/2, HUD_H/2, GW, HUD_H, C.HUD_BG);
    this.add.rectangle(GW/2, HUD_H, GW, 3, C.CYAN, 0.6);

    const hudStyle = { fontFamily:'monospace', fontSize:'11px', color:'#8888cc' };
    const valStyle = { fontFamily:'monospace', fontSize:'19px', color:'#ffeb3b',
      stroke:'#664400', strokeThickness:2 };

    // Score
    this.add.text(10, 6, 'SCORE', hudStyle);
    this.scoreTxt = this.add.text(10, 20, '0000000', valStyle);

    // Lives
    this.add.text(GW/2-40, 6, 'LIVES', hudStyle).setOrigin(0.5,0);
    this.heartImgs = [];
    for (let i=0;i<3;i++) {
      this.heartImgs.push(this.add.image(GW/2-24 + i*28, 30, 'heart').setDisplaySize(24,22));
    }

    // Multiplier
    this.add.text(GW-10, 6, 'MULTI', { ...hudStyle, align:'right' }).setOrigin(1,0);
    this.multTxt = this.add.text(GW-10, 18, 'x1', {
      fontFamily:'monospace', fontSize:'22px', color:'#00e5ff',
      stroke:'#003344', strokeThickness:2
    }).setOrigin(1,0);

    // Level
    this.levelTxt = this.add.text(GW/2, HUD_H-10, 'LV.1', {
      fontFamily:'monospace', fontSize:'13px', color:'#7766aa'
    }).setOrigin(0.5,1);
  }

  _buildPlayer() {
    this.playerImg = this.add.image(PLAYER_X+10, PLAYER_Y, 'player').setDisplaySize(60,82).setOrigin(0.5,0.5);
    this.gunImg    = this.add.image(PLAYER_X+46, PLAYER_Y+16, 'gun').setDisplaySize(56,20).setOrigin(0,0.5);
    // Label
    this.add.text(PLAYER_X+20, PLAY_BOT+10, 'DATA\nENGINEER', {
      fontFamily:'monospace', fontSize:'9px', color:'#5599bb', align:'center'
    }).setOrigin(0.5,0);
  }

  _buildScoreZone() {
    // Score zone bar
    const barY = PLAY_BOT;
    this.add.rectangle(GW/2, barY, GW, 3, C.GREEN, 0.8);
    // Score robot (right)
    this.scoreRobot = this.add.image(GW-28, PLAY_BOT+30, 'score_robot').setDisplaySize(48,64).setOrigin(0.5, 0);
    this.add.text(GW-28, GH-8, 'SCORE\nZONE', {
      fontFamily:'monospace', fontSize:'9px', color:'#00e676', align:'center'
    }).setOrigin(0.5,1);
    // Score zone glow line
    this.scoreZoneLine = this.add.rectangle(GW/2, barY, GW, 6, C.GREEN, 0.15);
    this.tweens.add({ targets:this.scoreZoneLine, alpha:0.4, yoyo:true, repeat:-1, duration:800 });
  }

  _buildParticles() {
    // Particle emitter for explosions
    this.particles = this.add.particles(0, 0, 'particle', {
      lifespan:   { min:200, max:500 },
      speed:      { min:60, max:280 },
      scale:      { start:1.5, end:0 },
      alpha:      { start:1, end:0 },
      tint:       [0xffeb3b, 0xff6d00, 0xff1744, 0xffffff],
      quantity:   12,
      emitting:   false,
      blendMode:  'ADD',
    });
  }

  _startSpawnTimer() {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this._spawnItem,
      callbackScope: this,
      loop: true,
    });
  }

  _spawnItem() {
    if (this.isGameOver) return;

    // Pick random lane
    const lane = Phaser.Math.Between(0, LANE_COUNT-1);
    const lx   = LANE_X[lane];

    // Determine type — bad items increase with level
    const badChance = 0.35 + this.level * 0.07;  // 42% → 84%
    const isBad = Math.random() < Math.min(badChance, 0.65);

    let texKey, itemType, pointVal;
    if (isBad) {
      if (Math.random() < 0.55) {
        texKey = 'null_item'; itemType = 'bad'; pointVal = 50;
      } else {
        texKey = 'outlier_item'; itemType = 'bad'; pointVal = 50;
      }
    } else {
      const r = Math.random();
      if (r < 0.45)      { texKey='valid_item';  itemType='good'; pointVal=30; }
      else if (r < 0.75) { texKey='log_item';    itemType='good'; pointVal=25; }
      else               { texKey='image_item';  itemType='good'; pointVal=20; }
    }

    const sz  = isBad ? 58 : 52;
    const img = this.add.image(lx, PLAY_TOP - 30, texKey).setDisplaySize(sz, sz);
    img.setInteractive(new Phaser.Geom.Rectangle(-sz/2,-sz/2,sz,sz), Phaser.Geom.Rectangle.Contains);

    // Glitch effect for bad items
    if (isBad) {
      this.tweens.add({ targets:img, x: lx + Phaser.Math.Between(-4,4),
        yoyo:true, repeat:-1, duration:80 + Math.random()*60, ease:'Linear' });
    }

    // Data object
    const dataObj = {
      img,
      lane,
      lx,
      itemType,
      pointVal,
      texKey,
      speed: this.baseSpeed + this.level * 18,
      alive: true,
    };
    this.dataItems.add(img);
    img._data = dataObj;

    // Tap / click on item
    img.on('pointerdown', () => this._onItemTap(dataObj), this);
  }

  _onTap(pointer) {
    if (this.isGameOver) return;
    // Check if tapped on empty space (fire in direction of nearest lane)
    // This fires even if not on an item — gives satisfying laser feel
    const x = pointer.x;
    let nearestLane = 0;
    let minDist = Math.abs(x - LANE_X[0]);
    LANE_X.forEach((lx, i) => {
      const d = Math.abs(x - lx);
      if (d < minDist) { minDist=d; nearestLane=i; }
    });
    this._fireAt(LANE_X[nearestLane], pointer.y);
  }

  _onItemTap(dataObj) {
    if (!dataObj.alive || this.isGameOver) return;
    dataObj.alive = false;

    const { img, itemType, pointVal, lx } = dataObj;

    if (itemType === 'bad') {
      // Correct! Destroy bad item
      this._fireAt(lx, img.y, () => {
        this._explode(img.x, img.y);
        img.destroy();
        this._addScore(pointVal);
        this._addCombo();
        SFX.destroy();
      });
    } else {
      // Mistake! Tapped good data
      this._fireAt(lx, img.y, () => {
        this._explodeSmall(img.x, img.y, 0xff2200);
        img.destroy();
        this._loseLife();
        this._resetCombo();
        SFX.miss();
        this._showFloating('-LIFE!', img.x, img.y, '#ff1744');
      });
    }
  }

  _fireAt(targetX, targetY, onHit) {
    SFX.shoot();

    // Visual laser beam
    const laserY = this.gunImg.y;
    const laser = this.add.image(PLAYER_X+56, laserY, 'laser')
      .setDisplaySize(10, 8).setOrigin(0, 0.5);

    // Gun flash
    this.cameras.main.flash(60, 0, 180, 255, false);

    // Animate laser stretching to target
    const dist = targetX - PLAYER_X - 56;
    const dur  = Math.max(60, dist * 0.6);

    this.tweens.add({
      targets: laser,
      displayWidth: dist > 0 ? dist : 20,
      x: PLAYER_X + 56,
      duration: dur * 0.3,
      ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: laser,
          alpha: 0,
          duration: 80,
          onComplete: () => { laser.destroy(); if(onHit) onHit(); }
        });
      }
    });

    // Gun recoil
    this.tweens.add({
      targets: this.gunImg,
      x: PLAYER_X + 40,
      duration: 50,
      yoyo: true,
      ease: 'Power2',
    });
  }

  _explode(x, y) {
    // Particle burst
    this.particles.emitParticleAt(x, y, 18);

    // Explosion sprites
    const e1 = this.add.image(x, y, 'explosion1').setDisplaySize(50,50).setAlpha(0.9).setDepth(10);
    const e2 = this.add.image(x, y, 'explosion2').setDisplaySize(20,20).setAlpha(0).setDepth(10);

    this.tweens.add({
      targets: e1, displayWidth:100, displayHeight:100, alpha:0,
      duration:250, ease:'Power2',
      onComplete: ()=>e1.destroy()
    });
    this.tweens.add({
      targets: e2, displayWidth:110, displayHeight:110, alpha:0.5,
      duration:200, delay:60, ease:'Power2',
      onComplete: ()=>e2.destroy()
    });

    // Screen shake
    this.cameras.main.shake(120, 0.007);
  }

  _explodeSmall(x, y, tint) {
    this.particles.emitParticleAt(x, y, 8);
    const e = this.add.image(x, y, 'explosion1').setDisplaySize(30,30).setTint(tint).setDepth(10);
    this.tweens.add({ targets:e, displayWidth:70,displayHeight:70,alpha:0, duration:200, onComplete:()=>e.destroy() });
    this.cameras.main.shake(200, 0.015);
  }

  _addScore(pts) {
    const earned = pts * this.multiplier;
    this.score += earned;
    this.scoreTxt.setText(String(this.score).padStart(7,'0'));
    // Flash score
    this.tweens.add({ targets:this.scoreTxt, scaleX:1.3,scaleY:1.3,
      yoyo:true, duration:80, ease:'Power2' });
    return earned;
  }

  _showFloating(text, x, y, color='#ffeb3b') {
    const t = this.add.text(x, y, text, {
      fontFamily:'monospace', fontSize:'20px', color,
      stroke:'#000000', strokeThickness:3
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: ()=>t.destroy()
    });
  }

  _addCombo() {
    this.combo++;
    if (this.combo >= 3) {
      const newMult = Math.min(10, 1 + Math.floor(this.combo / 3));
      if (newMult > this.multiplier) {
        this.multiplier = newMult;
        this.multTxt.setText(`x${this.multiplier}`);
        this.tweens.add({ targets:this.multTxt, scaleX:1.5,scaleY:1.5, yoyo:true, duration:150 });
        this.tweens.add({ targets:this.multTxt, tint:0x00ffff, duration:200, yoyo:true });
        SFX.multiplier();
      }
    }
  }

  _resetCombo() {
    this.combo = 0;
    this.multiplier = 1;
    this.multTxt.setText('x1');
    this.multTxt.setStyle({ color:'#00e5ff' });
  }

  _loseLife() {
    if (this.lives <= 0) return;
    this.lives--;
    this.heartImgs[this.lives].setTexture('heart_empty');
    // Flash red vignette
    const vign = this.add.rectangle(GW/2, GH/2, GW, GH, 0xff0000, 0.3).setDepth(50);
    this.tweens.add({ targets:vign, alpha:0, duration:400, onComplete:()=>vign.destroy() });

    if (this.lives <= 0) {
      this.time.delayedCall(400, ()=>this._gameOver());
    }
  }

  _levelUp() {
    if (this.isGameOver) return;
    this.level++;
    this.baseSpeed  = Math.min(360, this.baseSpeed + 22);
    this.spawnDelay = Math.max(600, this.spawnDelay - 110);
    this._startSpawnTimer();

    SFX.levelUp();
    this.levelTxt.setText(`LV.${this.level}`);

    const msg = this.add.text(GW/2, GH/2, `⚡ LEVEL ${this.level}! ⚡`, {
      fontFamily:'monospace', fontSize:'32px', color:'#ffeb3b',
      stroke:'#ff6d00', strokeThickness:4
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({ targets:msg, alpha:1, yoyo:true, hold:600, duration:300, onComplete:()=>msg.destroy() });
  }

  _gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    SFX.gameOver();

    // Stop all items
    this.dataItems.getChildren().forEach(img => {
      if (img._data) img._data.alive = false;
      this.tweens.killTweensOf(img);
    });
    if (this.spawnTimer) this.spawnTimer.remove();

    // Save high score
    const hi = parseInt(localStorage.getItem('dc_hiscore') || '0');
    if (this.score > hi) localStorage.setItem('dc_hiscore', String(this.score));

    this.cameras.main.shake(500, 0.02);
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 30, 10, 10);
      this.time.delayedCall(520, () => {
        this.scene.start('GameOver', { score:this.score, hi:Math.max(this.score,hi), level:this.level });
      });
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
    const dt = delta / 1000;

    // Move items down
    this.dataItems.getChildren().forEach(img => {
      const d = img._data;
      if (!d || !d.alive) return;

      img.y += d.speed * dt;

      // Reached bottom
      if (img.y >= PLAY_BOT) {
        d.alive = false;
        if (d.itemType === 'bad') {
          // Bad item reached bottom — lose life
          this._explodeSmall(img.x, PLAY_BOT, 0xff0000);
          this._loseLife();
          this._resetCombo();
          SFX.miss();
          this._showFloating('MISS!', img.x, PLAY_BOT-20, '#ff4444');
        } else {
          // Good item scored
          const earned = this._addScore(d.pointVal);
          this._addCombo();
          SFX.score();
          this._showFloating(`+${earned}`, img.x, PLAY_BOT-20, '#00e676');
          // Robot bounce
          this.tweens.add({ targets:this.scoreRobot, y:PLAY_BOT+25, yoyo:true, duration:100, ease:'Bounce' });
        }
        img.destroy();
      }
    });

    // Multiplier color shift
    const colors = ['#00e5ff','#00ff99','#ffeb3b','#ff9100','#ff6680','#ff44ff'];
    const ci = Math.min(this.multiplier-1, colors.length-1);
    this.multTxt.setStyle({ color: colors[ci] });
  }
}

/* ── GAME OVER SCENE ──────────────────────────────────── */
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const { score=0, hi=0, level=1 } = data || {};
    const w=GW, h=GH;
    const isNewHi = score >= hi && score > 0;

    this.add.rectangle(w/2, h/2, w, h, C.BG);
    // Scanlines
    for (let y=0;y<h;y+=4) this.add.rectangle(w/2, y, w, 2, 0x000000, 0.08);

    // Panel
    this.add.rectangle(w/2, h/2, 420, 560, 0x00001a, 0.95);
    this.add.rectangle(w/2, h/2, 424, 564, 0, 0).setStrokeStyle(3, isNewHi ? C.YELLOW : C.RED);

    // Game Over text
    const goColor = isNewHi ? '#ffeb3b' : '#ff1744';
    const goStroke = isNewHi ? '#664400' : '#660011';
    this.add.text(w/2, h/2-240, 'GAME OVER', {
      fontFamily:'monospace', fontSize:'40px', color:goColor,
      stroke:goStroke, strokeThickness:5
    }).setOrigin(0.5);

    if (isNewHi) {
      this.add.text(w/2, h/2-195, '★  NEW  RECORD!  ★', {
        fontFamily:'monospace', fontSize:'18px', color:'#ffeb3b'
      }).setOrigin(0.5);
    }

    // Score
    this.add.text(w/2, h/2-150, 'YOUR SCORE', {
      fontFamily:'monospace', fontSize:'14px', color:'#8888cc'
    }).setOrigin(0.5);
    const scoreTxt = this.add.text(w/2, h/2-115, String(score).padStart(7,'0'), {
      fontFamily:'monospace', fontSize:'46px', color:'#ffeb3b',
      stroke:'#664400', strokeThickness:4
    }).setOrigin(0.5);
    this.tweens.add({ targets:scoreTxt, scaleX:1.08, scaleY:1.08, yoyo:true, repeat:-1, duration:600 });

    // Hi Score
    this.add.text(w/2, h/2-50, `HI-SCORE: ${String(hi).padStart(7,'0')}`, {
      fontFamily:'monospace', fontSize:'18px', color:isNewHi?'#ffeb3b':'#8888cc'
    }).setOrigin(0.5);

    // Level reached
    this.add.text(w/2, h/2, `LEVEL REACHED: ${level}`, {
      fontFamily:'monospace', fontSize:'16px', color:'#00e5ff'
    }).setOrigin(0.5);

    // Stats divider
    this.add.rectangle(w/2, h/2+30, 360, 2, C.DGREY);

    // Breakdown
    const breakdown = [
      `LIVES REMAINING: ${0}`,
      `SPEED FACTOR:    LV.${level}`,
    ];
    breakdown.forEach((line, i) => {
      this.add.text(w/2, h/2+60 + i*28, line, {
        fontFamily:'monospace', fontSize:'14px', color:'#6666aa'
      }).setOrigin(0.5);
    });

    // Buttons
    const playBtn = this.add.rectangle(w/2, h/2+170, 240, 56, 0x00aa33);
    this.add.rectangle(w/2, h/2+170, 244, 60, 0, 0).setStrokeStyle(3, C.GREEN);
    const playTxt = this.add.text(w/2, h/2+170, '▶  PLAY AGAIN', {
      fontFamily:'monospace', fontSize:'20px', color:'#fff'
    }).setOrigin(0.5);
    playBtn.setInteractive();
    playBtn.on('pointerdown', () => {
      SFX.levelUp();
      this.cameras.main.fadeOut(300, 10,10,30);
      this.time.delayedCall(320, () => this.scene.start('Game'));
    });
    this.tweens.add({ targets:[playBtn,playTxt], alpha:0.6, yoyo:true, repeat:-1, duration:700 });

    const menuBtn = this.add.rectangle(w/2, h/2+240, 200, 46, 0x111133);
    this.add.rectangle(w/2, h/2+240, 204, 50, 0, 0).setStrokeStyle(2, C.CYAN);
    this.add.text(w/2, h/2+240, 'MAIN MENU', {
      fontFamily:'monospace', fontSize:'17px', color:'#00e5ff'
    }).setOrigin(0.5);
    menuBtn.setInteractive();
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 10,10,30);
      this.time.delayedCall(320, () => this.scene.start('Menu'));
    });

    // Particle celebration for new hi
    if (isNewHi) {
      const p = this.add.particles(0, 0, 'particle', {
        x: { min:0, max:w }, y: -10,
        lifespan:2000, speedY:{min:80,max:200},
        speedX:{min:-30,max:30},
        scale:{start:1.5,end:0},
        tint:[0xffeb3b,0xff6d00,0x00e676,0x00e5ff,0xff00ff],
        quantity:1, frequency:80,
        blendMode:'ADD',
      });
    }

    this.cameras.main.fadeIn(400, 10,10,30);
  }
}

/* ── PHASER CONFIG ────────────────────────────────────── */
const config = {
  type: Phaser.AUTO,
  width:  GW,
  height: GH,
  backgroundColor: '#0a0a1a',
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,   // keep pixel art crisp
    pixelArt:  true,
  },
  input: {
    activePointers: 2,
  },
};

const game = new Phaser.Game(config);
