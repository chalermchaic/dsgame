// ============================================================
//  DATA CLEANER: OUTLIER INVADERS  — Phaser 3 Game  v1.1
//  Retro Arcade / Pixel Art  |  Portrait Mobile
//  Features: Easy/Normal/Hard, Pause, Warnings, Tutorial
// ============================================================

/* ── GLOBAL CONSTANTS ─────────────────────────────────── */
const GW   = 480;
const GH   = 854;
const LANE_COUNT  = 3;
const LANE_X      = [120, 240, 360];
const LANE_WIDTH  = 100;
const HUD_H       = 72;
const PLAY_TOP    = HUD_H + 8;
const PLAY_BOT    = GH - 70;
const PLAYER_X    = 28;
const PLAYER_Y    = PLAY_TOP + 200;

// Difficulty presets
const DIFF = {
  easy: {
    label: 'EASY',
    lives:      5,
    baseSpeed:  110,
    spawnDelay: 1900,
    badChance:  0.28,
    levelEvery: 35000,   // ms
    speedStep:  14,
    delayStep:  80,
    maxBad:     0.50,
    color:      '#00e676',
    hex:        0x00e676,
  },
  normal: {
    label: 'NORMAL',
    lives:      3,
    baseSpeed:  155,
    spawnDelay: 1400,
    badChance:  0.38,
    levelEvery: 25000,
    speedStep:  20,
    delayStep:  110,
    maxBad:     0.62,
    color:      '#ffeb3b',
    hex:        0xffeb3b,
  },
  hard: {
    label: 'HARD',
    lives:      3,
    baseSpeed:  210,
    spawnDelay: 950,
    badChance:  0.50,
    levelEvery: 18000,
    speedStep:  28,
    delayStep:  140,
    maxBad:     0.72,
    color:      '#ff1744',
    hex:        0xff1744,
  },
};

// Current selected difficulty (persisted across restart)
let selectedDiff = localStorage.getItem('dc_diff') || 'normal';

// Palette
const C = {
  BG:        0x0a0a1a,
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
};

/* ── SOUND SYSTEM ─────────────────────────────────────── */
class SoundSystem {
  constructor() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.enabled = true; }
    catch(e) { this.enabled = false; }
  }
  _play(freq, type, dur, vol=0.28, freqEnd=null) {
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
  shoot()      { this._play(880, 'sawtooth', 0.08, 0.18, 220); }
  destroy()    { this._play(440,'square',0.15,0.32,55); this._play(220,'sawtooth',0.12,0.22,880); }
  miss()       { this._play(110,'sawtooth',0.35,0.4,55); }
  score()      { this._play(660,'square',0.08,0.18,1100); }
  multiplier() { [523,784,1046].forEach((n,i)=> setTimeout(()=>this._play(n,'square',0.1,0.25),i*70)); }
  gameOver()   { [440,330,220,165].forEach((n,i)=> setTimeout(()=>this._play(n,'sawtooth',0.4,0.38,n*0.65),i*210)); }
  levelUp()    { [523,659,784,1046].forEach((n,i)=> setTimeout(()=>this._play(n,'square',0.1,0.28),i*75)); }
  countdown()  { this._play(440,'square',0.15,0.3); }
  go()         { [659,880].forEach((n,i)=>setTimeout(()=>this._play(n,'square',0.15,0.4),i*80)); }
  warning()    { this._play(880,'sawtooth',0.06,0.12,660); }
  pause()      { this._play(330,'square',0.12,0.2); }
}

const SFX = new SoundSystem();

/* ── TEXTURE FACTORY ──────────────────────────────────── */
function makeTextures(scene) {

  // NULL item — purple/magenta glitched square 64x64
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x4a0080); g.fillRect(4,4,56,56);
    g.fillStyle(0x8b00ff); g.fillRect(8,8,48,48);
    [12,22,32,42,52].forEach((y,i)=>{ if(i%2===0){g.fillStyle(0xff00ff); g.fillRect(8,y,48,4);} });
    g.fillStyle(0x2a003a); g.fillRect(16,18,32,28);
    g.fillStyle(0xffffff);
    g.fillRect(18,20,3,16); g.fillRect(21,23,3,4); g.fillRect(24,26,3,4); g.fillRect(27,20,3,16);
    g.fillRect(31,20,3,12); g.fillRect(34,32,6,4); g.fillRect(40,20,3,12);
    g.lineStyle(2,0xff00ff,0.8); g.strokeRect(2,2,60,60);
    g.lineStyle(1,0xaa00ff,0.5); g.strokeRect(0,0,64,64);
    g.generateTexture('null_item', 64, 64);
    g.destroy();
  })();

  // OUTLIER item — red spiky star 64x64
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x1a0000); g.fillRect(0,0,64,64);
    g.fillStyle(0xff1744);
    const pts=[32,4,38,22,58,22,44,34,50,54,32,42,14,54,20,34,6,22,26,22];
    const ps=[]; for(let i=0;i<pts.length;i+=2) ps.push({x:pts[i],y:pts[i+1]});
    g.fillPoints(ps,true);
    g.fillStyle(0xff6680);
    const pts2=[32,14,36,24,48,24,40,30,44,44,32,36,20,44,24,30,16,24,28,24];
    const ps2=[]; for(let i=0;i<pts2.length;i+=2) ps2.push({x:pts2[i],y:pts2[i+1]});
    g.fillPoints(ps2,true);
    g.fillStyle(0x8b0000); g.fillRect(26,26,12,12);
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
    g.lineStyle(5,0xffffff,1); g.beginPath(); g.moveTo(14,28); g.lineTo(24,38); g.lineTo(42,18); g.strokePath();
    g.lineStyle(2,0x00e676,1); g.strokeRect(2,2,52,52);
    g.generateTexture('valid_item', 56, 56);
    g.destroy();
  })();

  // LOG_OK item — orange square 56x56
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x3a1a00); g.fillRect(0,0,56,56);
    g.fillStyle(0xff6d00); g.fillRect(4,4,48,48);
    g.fillStyle(0xff9100); g.fillRect(8,8,40,40);
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

  // Player robot 80x110
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x334455); g.fillRect(10,95,18,12); g.fillRect(52,95,18,12);
    g.fillStyle(0x445566); g.fillRect(14,78,14,20); g.fillRect(52,78,14,20);
    g.fillStyle(0x2a3a4a); g.fillRect(8,42,64,40);
    g.fillStyle(0x3a4a5a); g.fillRect(12,46,56,32);
    g.fillStyle(0x00e5ff); g.fillRect(20,52,18,14);
    g.fillStyle(0xff6d00); g.fillRect(42,52,14,14);
    g.fillStyle(0x2a3a4a); g.fillRect(0,44,10,24); g.fillRect(70,44,10,24);
    g.fillStyle(0x1a2a3a); g.fillRect(16,8,48,38);
    g.fillStyle(0x2a3a4a); g.fillRect(20,12,40,30);
    g.fillStyle(0x00e5ff); g.fillRect(22,16,36,18);
    g.fillStyle(0x004d66); g.fillRect(26,18,28,14);
    g.fillStyle(0x00ffff); g.fillRect(28,20,8,8); g.fillRect(44,20,8,8);
    g.fillStyle(0xffffff); g.fillRect(30,22,3,3); g.fillRect(46,22,3,3);
    g.fillStyle(0xffeb3b); g.fillRect(32,4,16,10);
    g.fillStyle(0xffa000); g.fillRect(34,6,12,6);
    g.generateTexture('player', 80, 110);
    g.destroy();
  })();

  // Gun 60x22
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x1a1a2e); g.fillRect(0,6,50,12);
    g.fillStyle(0x2a3a4a); g.fillRect(0,7,48,10);
    g.fillStyle(0x00e5ff); g.fillRect(4,9,40,6);
    g.fillStyle(0x334455); g.fillRect(10,3,24,18);
    g.fillStyle(0xff6d00); g.fillRect(12,5,10,14);
    g.fillStyle(0xffeb3b); g.fillRect(48,8,12,6);
    g.generateTexture('gun', 60, 22);
    g.destroy();
  })();

  // Laser 48x8
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x006688); g.fillRect(0,2,48,4);
    g.fillStyle(0x00e5ff); g.fillRect(2,3,44,2);
    g.fillStyle(0xffffff); g.fillRect(4,3,10,2);
    g.generateTexture('laser', 48, 8);
    g.destroy();
  })();

  // Heart 24x22
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xff1744);
    const hp=[4,8,0,4,0,0,4,0,8,2,12,0,16,0,16,4,12,8,8,12];
    const hpts=[]; for(let i=0;i<hp.length;i+=2) hpts.push({x:hp[i]*1.5,y:hp[i+1]*1.5});
    g.fillPoints(hpts,true);
    g.fillStyle(0xff6680); g.fillRect(6,4,5,5);
    g.generateTexture('heart', 24, 22);
    g.destroy();
  })();

  // Empty heart
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x331122);
    const hp=[4,8,0,4,0,0,4,0,8,2,12,0,16,0,16,4,12,8,8,12];
    const hpts=[]; for(let i=0;i<hp.length;i+=2) hpts.push({x:hp[i]*1.5,y:hp[i+1]*1.5});
    g.fillPoints(hpts,true);
    g.generateTexture('heart_empty', 24, 22);
    g.destroy();
  })();

  // Score robot 60x80
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
    const sparks=[[40,8],[72,40],[40,72],[8,40],[60,12],[68,60],[20,64],[12,20]];
    g.fillStyle(0xffeb3b,1); sparks.forEach(([x,y])=>g.fillRect(x-3,y-3,6,6));
    g.generateTexture('explosion1', 80, 80);
    g.destroy();
  })();

  // Explosion frame 2 (100x100)
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xff6d00,0.6); g.fillCircle(50,50,46);
    g.fillStyle(0xffeb3b,0.5); g.fillCircle(50,50,36);
    g.fillStyle(0xff1744,0.3); g.fillCircle(50,50,24);
    const sparks=[[50,4],[96,50],[50,96],[4,50],[76,14],[86,76],[24,82],[14,24],[50,28],[72,28]];
    g.fillStyle(0xff9100,0.8); sparks.forEach(([x,y])=>g.fillRect(x-4,y-4,8,8));
    g.generateTexture('explosion2', 100, 100);
    g.destroy();
  })();

  // Particle 4x4
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffffff); g.fillRect(0,0,4,4);
    g.generateTexture('particle', 4, 4);
    g.destroy();
  })();

  // Warning ring 80x80 (pulsing alert)
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.lineStyle(5,0xff1744,1); g.strokeCircle(40,40,36);
    g.lineStyle(3,0xff6680,0.6); g.strokeCircle(40,40,28);
    g.generateTexture('warning_ring', 80, 80);
    g.destroy();
  })();

  // Pause icon 36x36
  (()=>{
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x334466); g.fillRect(0,0,36,36);
    g.fillStyle(0x00e5ff); g.fillRect(8,8,8,20); g.fillRect(20,8,8,20);
    g.lineStyle(2,0x00e5ff,0.5); g.strokeRect(1,1,34,34);
    g.generateTexture('pause_btn', 36, 36);
    g.destroy();
  })();
}

/* ── BOOT SCENE ───────────────────────────────────────── */
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() { makeTextures(this); this.scene.start('Menu'); }
}

/* ── MENU SCENE ───────────────────────────────────────── */
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const w=GW, h=GH;
    this.add.rectangle(w/2,h/2,w,h,C.BG);
    for (let y=0;y<h;y+=4) this.add.rectangle(w/2,y,w,2,0x000000,0.08);

    // Animated lane bg
    this.laneItems = [];
    LANE_X.forEach((lx,li)=>{
      this.add.rectangle(lx,h/2,LANE_WIDTH,h,C.LANE_BG,0.4);
      const types=['null_item','outlier_item','valid_item','log_item','image_item'];
      for(let i=0;i<3;i++){
        const t = types[Math.floor(Math.random()*types.length)];
        const img = this.add.image(lx,-80-i*240,t).setDisplaySize(46,46).setAlpha(0.3);
        this.laneItems.push({img, speed:80+li*15});
      }
    });

    // Title
    this.add.rectangle(w/2,200,440,130,0x000033,0.95);
    this.add.rectangle(w/2,200,444,134,0,0).setStrokeStyle(3,0x00e5ff);
    this.add.text(w/2,168,'DATA CLEANER',{fontFamily:'monospace',fontSize:'36px',color:'#ffeb3b',stroke:'#ff6d00',strokeThickness:4}).setOrigin(0.5);
    this.add.text(w/2,210,'OUTLIER  INVADERS',{fontFamily:'monospace',fontSize:'19px',color:'#00e5ff'}).setOrigin(0.5);
    this.add.text(w/2,240,'— RETRO ARCADE —',{fontFamily:'monospace',fontSize:'12px',color:'#7766aa'}).setOrigin(0.5);

    // HI-SCORE
    const hi = parseInt(localStorage.getItem('dc_hiscore')||'0');
    this.add.text(w/2,295,`HI-SCORE: ${String(hi).padStart(7,'0')}`,{fontFamily:'monospace',fontSize:'18px',color:'#ffeb3b'}).setOrigin(0.5);

    // ── DIFFICULTY SELECTOR ────────────────────────────
    this.add.text(w/2,345,'── SELECT DIFFICULTY ──',{fontFamily:'monospace',fontSize:'14px',color:'#00e5ff'}).setOrigin(0.5);

    this.diffBtns = {};
    const diffs = ['easy','normal','hard'];
    const dLabels = { easy:'EASY\n5❤ Slower', normal:'NORMAL\n3❤ Balanced', hard:'HARD\n3❤ Faster' };
    const dColors = { easy:0x003311, normal:0x1a1a00, hard:0x1a0000 };
    const dBorder = { easy:0x00e676, normal:0xffeb3b, hard:0xff1744 };

    diffs.forEach((d,i)=>{
      const bx = 100 + i*140, by=395;
      const bg = this.add.rectangle(bx,by,120,56,dColors[d]).setInteractive();
      const border = this.add.rectangle(bx,by,124,60,0,0).setStrokeStyle(2,dBorder[d]);
      const txt = this.add.text(bx,by,dLabels[d],{
        fontFamily:'monospace', fontSize:'13px', color:DIFF[d].color, align:'center'
      }).setOrigin(0.5);
      this.diffBtns[d] = { bg, border, txt };
      bg.on('pointerdown',()=>{
        selectedDiff = d;
        localStorage.setItem('dc_diff',d);
        this._updateDiffButtons();
        SFX.countdown();
      });
    });
    this._updateDiffButtons();

    // ── HOW TO PLAY ──
    this.add.rectangle(w/2,542,420,128,0x000022,0.9);
    this.add.rectangle(w/2,542,424,132,0,0).setStrokeStyle(2,C.PURPLE);
    this.add.text(w/2,490,'── HOW TO PLAY ──',{fontFamily:'monospace',fontSize:'13px',color:'#aa88ff'}).setOrigin(0.5);
    this.add.text(w/2,518,
      '💥 TAP  NULL / OUTLIER  → DESTROY  (+50 × multi)\n' +
      '✅ Let  VALID / LOG / IMAGE  fall to SCORE ZONE\n' +
      '⚠️  Bad item reaches bottom = lose ❤',
      {fontFamily:'monospace',fontSize:'13px',color:'#ccccee',align:'center',lineSpacing:7}
    ).setOrigin(0.5);

    // Legend
    const legend=[
      {tex:'null_item',sz:22,label:'NULL — BAD',col:'#ff66ff'},
      {tex:'outlier_item',sz:22,label:'OUTLIER — BAD',col:'#ff4466'},
      {tex:'valid_item',sz:20,label:'VALID — GOOD',col:'#00e676'},
      {tex:'log_item',sz:20,label:'LOG_OK — GOOD',col:'#ff9100'},
      {tex:'image_item',sz:20,label:'IMAGE — GOOD',col:'#82b1ff'},
    ];
    this.add.rectangle(w/2,674,420,110,0x000022,0.7);
    legend.forEach((l,i)=>{
      const y=630+i*22; const startX=50;
      this.add.image(startX,y,l.tex).setDisplaySize(l.sz,l.sz);
      this.add.text(startX+20,y,l.label,{fontFamily:'monospace',fontSize:'12px',color:l.col}).setOrigin(0,0.5);
      // Second column
      if(i<2){ /* already shown */ }
    });

    // START button
    const btnBg = this.add.rectangle(w/2,GH-48,280,56,0x00aa33);
    this.add.rectangle(w/2,GH-48,284,60,0,0).setStrokeStyle(3,C.GREEN);
    const btnTxt = this.add.text(w/2,GH-48,'▶  START GAME',{fontFamily:'monospace',fontSize:'22px',color:'#ffffff',stroke:'#006611',strokeThickness:3}).setOrigin(0.5);
    this.tweens.add({targets:[btnBg,btnTxt],alpha:0.65,yoyo:true,repeat:-1,duration:650,ease:'Sine.easeInOut'});

    this.input.once('pointerdown',()=>{
      SFX.levelUp();
      this.cameras.main.fadeOut(300,10,10,30);
      this.time.delayedCall(320,()=>this.scene.start('Game',{diff:selectedDiff}));
    });

    // Animate lanes
    this.time.addEvent({delay:16,callback:()=>{
      this.laneItems.forEach(({img,speed})=>{
        img.y+=speed*0.016; if(img.y>GH+60) img.y=-100;
      });
    },loop:true});

    this.cameras.main.fadeIn(400,10,10,30);
  }

  _updateDiffButtons() {
    Object.keys(this.diffBtns).forEach(d=>{
      const {bg,border,txt} = this.diffBtns[d];
      if(d===selectedDiff){
        bg.setFillStyle(DIFF[d].hex, 0.25);
        border.setStrokeStyle(3,DIFF[d].hex);
        txt.setStyle({color:DIFF[d].color,stroke:'#000',strokeThickness:2});
      } else {
        bg.setFillStyle(0x111122,1);
        border.setStrokeStyle(1,0x444466);
        txt.setStyle({color:'#666688',stroke:'',strokeThickness:0});
      }
    });
  }
}

/* ── GAME SCENE ───────────────────────────────────────── */
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create(data) {
    // Unlock audio context on first interaction
    if(SFX.ctx && SFX.ctx.state==='suspended') SFX.ctx.resume();

    this.diff = DIFF[data?.diff || selectedDiff];
    this._initState();
    this._buildBG();
    this._buildHUD();
    this._buildPlayer();
    this._buildScoreZone();
    this._buildParticles();

    this.dataItems  = this.add.group();
    this.lasers     = this.add.group();

    // Pause button
    this._buildPauseBtn();

    // Countdown then start
    this._showCountdown();
  }

  _initState() {
    const d = this.diff;
    this.score       = 0;
    this.lives       = d.lives;
    this.maxLives    = d.lives;
    this.multiplier  = 1;
    this.combo       = 0;
    this.level       = 1;
    this.baseSpeed   = d.baseSpeed;
    this.spawnDelay  = d.spawnDelay;
    this.isGameOver  = false;
    this.isPaused    = false;
    this.gameStarted = false;
    this.warningFlash= false;
  }

  _buildBG() {
    const w=GW,h=GH;
    this.add.rectangle(w/2,h/2,w,h,C.BG);
    LANE_X.forEach(lx=>{
      this.add.rectangle(lx,(PLAY_TOP+PLAY_BOT)/2,LANE_WIDTH-4,PLAY_BOT-PLAY_TOP,C.LANE_BG,0.6);
      this.add.rectangle(lx,(PLAY_TOP+PLAY_BOT)/2,1,PLAY_BOT-PLAY_TOP,C.LANE_LINE,0.6);
    });
    for(let y=PLAY_TOP+25;y<PLAY_BOT-20;y+=55){
      LANE_X.forEach(lx=>{
        const g=this.add.graphics();
        g.fillStyle(0x2a2a5a,0.15); g.fillTriangle(lx-8,y,lx+8,y+10,lx-8,y+20);
      });
    }
    this.add.rectangle(40,(PLAY_TOP+PLAY_BOT)/2,78,PLAY_BOT-PLAY_TOP,0x080818,0.85);
    this.add.rectangle(80,(PLAY_TOP+PLAY_BOT)/2,2,PLAY_BOT-PLAY_TOP,0x3344aa,0.7);
    this.add.rectangle(GW-40,(PLAY_TOP+PLAY_BOT)/2,78,PLAY_BOT-PLAY_TOP,0x080818,0.85);
    this.add.rectangle(GW-80,(PLAY_TOP+PLAY_BOT)/2,2,PLAY_BOT-PLAY_TOP,0x226622,0.7);
    for(let y=0;y<h;y+=4) this.add.rectangle(w/2,y,w,2,0x000000,0.07);
    // Danger zone line
    this.dangerLine = this.add.rectangle(GW/2,PLAY_BOT-55,GW,2,0xff1744,0.3);
    this.add.text(82,PLAY_BOT-64,'⚠ DANGER ZONE',{fontFamily:'monospace',fontSize:'9px',color:'#ff4444',alpha:0.6});

    // ── Tap Zone labels ── แสดงให้ผู้เล่นรู้ว่าแตะช่องไหน
    const zoneY = PLAY_TOP + 24;
    LANE_X.forEach((lx, i) => {
      const num = ['①','②','③'][i];
      this.add.text(lx, zoneY, num, {
        fontFamily:'monospace', fontSize:'16px', color:'#2a3a5a'
      }).setOrigin(0.5);
    });
  }

  _buildHUD() {
    this.add.rectangle(GW/2,HUD_H/2,GW,HUD_H,C.HUD_BG);
    this.add.rectangle(GW/2,HUD_H,GW,3,C.CYAN,0.5);

    const lbl={fontFamily:'monospace',fontSize:'10px',color:'#8888cc'};
    const val={fontFamily:'monospace',fontSize:'18px',color:'#ffeb3b',stroke:'#664400',strokeThickness:2};

    this.add.text(10,5,'SCORE',lbl);
    this.scoreTxt=this.add.text(10,18,'0000000',val);

    // Lives hearts
    this.add.text(GW/2,5,'LIVES',{...lbl,align:'center'}).setOrigin(0.5,0);
    this.heartImgs=[];
    const startHX = GW/2 - ((this.maxLives-1)*16);
    for(let i=0;i<this.maxLives;i++){
      this.heartImgs.push(this.add.image(startHX+i*32,36,'heart').setDisplaySize(22,20));
    }

    // Multiplier
    this.add.text(GW-10,5,'MULTI',{...lbl,align:'right'}).setOrigin(1,0);
    this.multTxt=this.add.text(GW-10,16,'x1',{fontFamily:'monospace',fontSize:'22px',color:'#00e5ff',stroke:'#003344',strokeThickness:2}).setOrigin(1,0);

    // Combo bar
    this.comboBar=this.add.rectangle(10,65,0,5,C.CYAN);
    this.comboBarBg=this.add.rectangle(GW/2,65,GW-20,5,0x111133);

    // Level
    this.levelTxt=this.add.text(GW/2,HUD_H-8,'LV.1',{fontFamily:'monospace',fontSize:'12px',color:'#7766aa'}).setOrigin(0.5,1);

    // Difficulty badge
    const dBadge=this.add.rectangle(GW-14,HUD_H-12,52,18,0x111133);
    this.add.text(GW-14,HUD_H-12,this.diff.label,{fontFamily:'monospace',fontSize:'10px',color:this.diff.color}).setOrigin(0.5);
  }

  _buildPlayer() {
    this.playerImg=this.add.image(PLAYER_X+10,PLAYER_Y,'player').setDisplaySize(60,82).setOrigin(0.5);
    this.gunImg=this.add.image(PLAYER_X+46,PLAYER_Y+16,'gun').setDisplaySize(56,20).setOrigin(0,0.5);
    this.add.text(PLAYER_X+20,PLAY_BOT+12,'DATA\nENG',{fontFamily:'monospace',fontSize:'9px',color:'#5599bb',align:'center'}).setOrigin(0.5,0);
  }

  _buildScoreZone() {
    const barY=PLAY_BOT;
    this.add.rectangle(GW/2,barY,GW,3,C.GREEN,0.8);
    this.scoreRobot=this.add.image(GW-28,PLAY_BOT+30,'score_robot').setDisplaySize(48,64).setOrigin(0.5,0);
    this.add.text(GW-28,GH-8,'SCORE\nZONE',{fontFamily:'monospace',fontSize:'9px',color:'#00e676',align:'center'}).setOrigin(0.5,1);
    this.scoreLine=this.add.rectangle(GW/2,barY,GW,6,C.GREEN,0.15);
    this.tweens.add({targets:this.scoreLine,alpha:0.4,yoyo:true,repeat:-1,duration:900});
  }

  _buildParticles() {
    this.particles=this.add.particles(0,0,'particle',{
      lifespan:{min:200,max:500},
      speed:{min:70,max:300},
      scale:{start:1.5,end:0},
      alpha:{start:1,end:0},
      tint:[0xffeb3b,0xff6d00,0xff1744,0xffffff],
      quantity:12,emitting:false,blendMode:'ADD',
    });
  }

  _buildPauseBtn() {
    const btn=this.add.image(GW-24,HUD_H/2,'pause_btn').setDisplaySize(36,36).setInteractive().setDepth(100);
    btn.on('pointerdown',()=>this._togglePause());
    this.pauseBtn=btn;

    // Pause overlay (hidden by default)
    this.pauseOverlay=this.add.container(0,0).setDepth(200).setVisible(false);
    const dim=this.add.rectangle(GW/2,GH/2,GW,GH,0x000000,0.75);
    const box=this.add.rectangle(GW/2,GH/2,340,220,0x000033,1);
    this.add.rectangle(GW/2,GH/2,344,224,0,0).setStrokeStyle(3,C.CYAN);
    const pt=this.add.text(GW/2,GH/2-70,'⏸  PAUSED',{fontFamily:'monospace',fontSize:'32px',color:'#00e5ff'}).setOrigin(0.5);
    const resumeBox=this.add.rectangle(GW/2,GH/2+10,220,50,0x003322).setInteractive();
    this.add.rectangle(GW/2,GH/2+10,224,54,0,0).setStrokeStyle(2,C.GREEN);
    const rt=this.add.text(GW/2,GH/2+10,'▶  RESUME',{fontFamily:'monospace',fontSize:'20px',color:'#00e676'}).setOrigin(0.5);
    const menuBox=this.add.rectangle(GW/2,GH/2+76,160,40,0x111133).setInteractive();
    this.add.rectangle(GW/2,GH/2+76,164,44,0,0).setStrokeStyle(2,0x4444aa);
    const mt=this.add.text(GW/2,GH/2+76,'MENU',{fontFamily:'monospace',fontSize:'16px',color:'#8888cc'}).setOrigin(0.5);
    resumeBox.on('pointerdown',()=>this._togglePause());
    menuBox.on('pointerdown',()=>{
      this.scene.start('Menu');
    });
    this.pauseOverlay.add([dim,box,pt,resumeBox,rt,menuBox,mt]);
  }

  _togglePause() {
    if(this.isGameOver||!this.gameStarted) return;
    this.isPaused=!this.isPaused;
    SFX.pause();
    this.pauseOverlay.setVisible(this.isPaused);
    if(this.isPaused){
      this.spawnTimer?.paused && (this.spawnTimer.paused=true);
      if(this.spawnTimer) this.spawnTimer.paused=true;
      if(this.levelTimer) this.levelTimer.paused=true;
    } else {
      if(this.spawnTimer) this.spawnTimer.paused=false;
      if(this.levelTimer) this.levelTimer.paused=false;
    }
  }

  _showCountdown() {
    const nums=['3','2','1','GO!'];
    const colors=['#ff6680','#ffeb3b','#00e5ff','#00ff88'];
    let i=0;
    const show=()=>{
      if(i>0) SFX.countdown();
      if(i===3) SFX.go();
      const t=this.add.text(GW/2,GH/2,nums[i],{
        fontFamily:'monospace', fontSize:i<3?'96px':'72px',
        color:colors[i], stroke:'#000', strokeThickness:8
      }).setOrigin(0.5).setDepth(50);
      this.tweens.add({targets:t,alpha:0,scaleX:1.8,scaleY:1.8,duration:800,ease:'Power2',onComplete:()=>t.destroy()});
      i++;
      if(i<nums.length){ this.time.delayedCall(900,show); }
      else { this.time.delayedCall(400,()=>this._startGame()); }
    };
    this.time.delayedCall(200,show);
  }

  _startGame() {
    this.gameStarted=true;
    this._startSpawnTimer();
    this.levelTimer=this.time.addEvent({delay:this.diff.levelEvery,callback:this._levelUp,callbackScope:this,loop:true});
    // ใช้ scene-level tap แทน item-level เพื่อรองรับ mobile touch
    this.input.on('pointerdown', this._onTap, this);
  }

  _startSpawnTimer() {
    if(this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer=this.time.addEvent({
      delay:this.spawnDelay, callback:this._spawnItem, callbackScope:this, loop:true
    });
  }

  _spawnItem() {
    if(this.isGameOver||this.isPaused) return;
    const lane=Phaser.Math.Between(0,LANE_COUNT-1);
    const lx=LANE_X[lane];

    const badChance=Math.min(this.diff.badChance + this.level*0.04, this.diff.maxBad);
    const isBad=Math.random()<badChance;

    let texKey,itemType,pointVal,labelText,labelColor;
    if(isBad){
      if(Math.random()<0.55){ texKey='null_item'; labelText='NULL'; labelColor='#ff00ff'; }
      else { texKey='outlier_item'; labelText='OUTLIER'; labelColor='#ff4466'; }
      itemType='bad'; pointVal=50;
    } else {
      const r=Math.random();
      if(r<0.45){ texKey='valid_item'; labelText='VALID'; labelColor='#00e676'; pointVal=30; }
      else if(r<0.75){ texKey='log_item'; labelText='LOG_OK'; labelColor='#ff9100'; pointVal=25; }
      else { texKey='image_item'; labelText='IMAGE'; labelColor='#82b1ff'; pointVal=20; }
      itemType='good';
    }

    const sz=isBad?58:52;
    const container=this.add.container(lx,PLAY_TOP-35);
    const img=this.add.image(0,0,texKey).setDisplaySize(sz,sz);

    // ── กรอบสี แยก BAD (แดง) vs GOOD (เขียว) ──
    const borderColor = isBad ? 0xff2244 : 0x00e676;
    const border = this.add.rectangle(0, 0, sz+8, sz+8, 0x000000, 0)
      .setStrokeStyle(isBad ? 3 : 2, borderColor, isBad ? 0.9 : 0.7);

    // ── badge มุมบนขวา: BAD=✕  GOOD=✓ ──
    const badge = this.add.text(sz/2-1, -sz/2+1, isBad?'✕':'✓', {
      fontFamily:'monospace', fontSize: isBad?'17px':'15px',
      color: isBad?'#ff2244':'#00e676', stroke:'#000000', strokeThickness:4
    }).setOrigin(1,0);

    // ── Label ใหญ่ขึ้น (13px) + พื้นหลังสีตาม BAD/GOOD ──
    const bgCol = isBad ? 0x440011 : 0x003311;
    const tagBg = this.add.rectangle(0, sz/2+13, labelText.length*8+16, 22, bgCol, 0.95)
      .setStrokeStyle(1, borderColor, 0.8);
    const tag = this.add.text(0, sz/2+13, labelText, {
      fontFamily:'monospace', fontSize:'13px', color:labelColor,
      stroke:'#000000', strokeThickness:3
    }).setOrigin(0.5);

    container.add([border, img, badge, tagBg, tag]);
    container.setSize(sz, sz+32);
    container.setInteractive(new Phaser.Geom.Rectangle(-sz/2,-sz/2,sz,sz+34),Phaser.Geom.Rectangle.Contains);

    // Glitch tween for bad items + กระพริบกรอบแดง
    if(isBad){
      this.tweens.add({targets:img,x:Phaser.Math.Between(-4,4),yoyo:true,repeat:-1,duration:70+Math.random()*60});
      this.tweens.add({targets:border,alpha:{from:0.5,to:1},yoyo:true,repeat:-1,duration:380});
    }

    const dataObj={container,img,lane,lx,itemType,pointVal,labelText,alive:true,warned:false,
      speed:this.baseSpeed + this.level*this.diff.speedStep};
    this.dataItems.add(container);
    container._data=dataObj;
    // ไม่ใช้ container.on('pointerdown') แล้ว — ใช้ scene-level tap แทน
  }

  // แปลง x coordinate → lane index
  _xToLane(x) {
    // ช่องซ้าย: 80-200, กลาง: 200-300, ขวา: 300-420
    if (x < 80)  return -1; // เขตผู้เล่น ไม่นับ
    if (x < 200) return 0;
    if (x < 300) return 1;
    if (x < 420) return 2;
    return -1; // เขต score zone ไม่นับ
  }

  _onTap(pointer) {
    if(this.isGameOver||this.isPaused||!this.gameStarted) return;

    // กัน tap บน HUD
    if(pointer.y < HUD_H) return;

    const lane = this._xToLane(pointer.x);
    if(lane < 0) return;

    // หา item ที่ต่ำสุด (ใกล้ bottom ที่สุด) ในช่องนี้
    let target = null;
    let lowestY = -Infinity;
    this.dataItems.getChildren().forEach(c => {
      const d = c._data;
      if(!d || !d.alive) return;
      if(d.lane === lane && c.y > lowestY) {
        lowestY = c.y;
        target = d;
      }
    });

    // แสดง tap flash บนช่องที่แตะ
    this._showLaneFlash(lane, pointer.y);

    if(!target) {
      // ไม่มี item ในช่อง — ยิงพลาด (ไม่เสียชีวิต)
      SFX.shoot();
      this._fireAt(LANE_X[lane], pointer.y, null);
      return;
    }

    this._onItemTap(target);
  }

  _showLaneFlash(lane, tapY) {
    const lx = LANE_X[lane];
    const flash = this.add.rectangle(lx, tapY, LANE_WIDTH-4, 60, 0xffffff, 0.25).setDepth(5);
    this.tweens.add({targets:flash, alpha:0, scaleY:2, duration:200,
      onComplete:()=>flash.destroy()});
    // วงกลมที่จุดแตะ
    const ring = this.add.ellipse(lx, tapY, 70, 70, 0xffffff, 0).setDepth(5);
    ring.setStrokeStyle(3, 0x00e5ff, 1);
    this.tweens.add({targets:ring, scaleX:2, scaleY:2, alpha:0, duration:300,
      onComplete:()=>ring.destroy()});
  }

  _onItemTap(dataObj) {
    if(!dataObj.alive||this.isGameOver||this.isPaused) return;
    dataObj.alive=false;
    const {container,itemType,pointVal,lx} = dataObj;
    const wx=container.x, wy=container.y;

    if(itemType==='bad'){
      this._fireAt(wx,wy,()=>{
        this._explode(wx,wy);
        container.destroy();
        const earned=this._addScore(pointVal);
        this._showFloating(`+${earned}`,wx,wy,'#ffeb3b');
        this._addCombo();
        SFX.destroy();
      });
    } else {
      this._fireAt(wx,wy,()=>{
        this._explodeSmall(wx,wy,0xff2200);
        container.destroy();
        this._loseLife();
        this._resetCombo();
        SFX.miss();
        this._showFloating('✗ VALID!',wx,wy,'#ff4444');
      });
    }
  }

  _fireAt(targetX, targetY, onHit) {
    SFX.shoot();
    const laserY=this.gunImg.y;
    const laser=this.add.image(PLAYER_X+56,laserY,'laser').setDisplaySize(10,8).setOrigin(0,0.5).setDepth(15);
    this.cameras.main.flash(50,0,160,255,false);
    const dist=Math.max(targetX-(PLAYER_X+56),10);
    this.tweens.add({
      targets:laser, displayWidth:dist, duration:dist*0.55, ease:'Linear',
      onComplete:()=>{
        this.tweens.add({targets:laser,alpha:0,duration:70,onComplete:()=>{laser.destroy();if(onHit)onHit();}});
      }
    });
    this.tweens.add({targets:this.gunImg,x:PLAYER_X+40,duration:50,yoyo:true,ease:'Power2'});
  }

  _explode(x,y) {
    this.particles.emitParticleAt(x,y,18);
    const e1=this.add.image(x,y,'explosion1').setDisplaySize(50,50).setAlpha(0.9).setDepth(10);
    const e2=this.add.image(x,y,'explosion2').setDisplaySize(20,20).setAlpha(0).setDepth(10);
    this.tweens.add({targets:e1,displayWidth:100,displayHeight:100,alpha:0,duration:250,ease:'Power2',onComplete:()=>e1.destroy()});
    this.tweens.add({targets:e2,displayWidth:110,displayHeight:110,alpha:0.5,duration:200,delay:60,ease:'Power2',onComplete:()=>e2.destroy()});
    this.cameras.main.shake(110,0.007);
  }

  _explodeSmall(x,y,tint) {
    this.particles.emitParticleAt(x,y,8);
    const e=this.add.image(x,y,'explosion1').setDisplaySize(30,30).setTint(tint).setDepth(10);
    this.tweens.add({targets:e,displayWidth:70,displayHeight:70,alpha:0,duration:200,onComplete:()=>e.destroy()});
    this.cameras.main.shake(200,0.016);
  }

  _addScore(pts) {
    const earned=pts*this.multiplier;
    this.score+=earned;
    this.scoreTxt.setText(String(this.score).padStart(7,'0'));
    this.tweens.add({targets:this.scoreTxt,scaleX:1.3,scaleY:1.3,yoyo:true,duration:80});
    return earned;
  }

  _showFloating(text,x,y,color='#ffeb3b') {
    const t=this.add.text(x,y,text,{fontFamily:'monospace',fontSize:'18px',color,stroke:'#000000',strokeThickness:3}).setOrigin(0.5).setDepth(20);
    this.tweens.add({targets:t,y:y-65,alpha:0,duration:900,ease:'Power2',onComplete:()=>t.destroy()});
  }

  _addCombo() {
    this.combo++;
    const comboW = Math.min(this.combo/15,1) * (GW-20);
    this.comboBar.setPosition(10+comboW/2,65).setSize(comboW,5);

    if(this.combo>=3){
      const nm=Math.min(10,1+Math.floor(this.combo/3));
      if(nm>this.multiplier){
        this.multiplier=nm;
        this.multTxt.setText(`x${this.multiplier}`);
        this.tweens.add({targets:this.multTxt,scaleX:1.6,scaleY:1.6,yoyo:true,duration:140});
        SFX.multiplier();
        this._showFloating(`COMBO x${this.multiplier}!`,GW/2,GH/2-60,'#00e5ff');
      }
    }
  }

  _resetCombo() {
    this.combo=0;
    this.multiplier=1;
    this.multTxt.setText('x1').setStyle({color:'#00e5ff'});
    this.comboBar.setSize(0,5);
  }

  _loseLife() {
    if(this.lives<=0) return;
    this.lives--;
    if(this.lives<this.heartImgs.length) this.heartImgs[this.lives].setTexture('heart_empty');
    const vign=this.add.rectangle(GW/2,GH/2,GW,GH,0xff0000,0.28).setDepth(50);
    this.tweens.add({targets:vign,alpha:0,duration:500,onComplete:()=>vign.destroy()});
    if(this.lives<=0) this.time.delayedCall(350,()=>this._gameOver());
  }

  _levelUp() {
    if(this.isGameOver||this.isPaused) return;
    this.level++;
    this.baseSpeed=Math.min(420,this.baseSpeed+this.diff.speedStep);
    this.spawnDelay=Math.max(480,this.spawnDelay-this.diff.delayStep);
    this._startSpawnTimer();
    SFX.levelUp();
    this.levelTxt.setText(`LV.${this.level}`);
    const msg=this.add.text(GW/2,GH/2,`⚡ LEVEL ${this.level} ⚡`,{
      fontFamily:'monospace',fontSize:'34px',color:'#ffeb3b',stroke:'#ff6d00',strokeThickness:4
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({targets:msg,alpha:1,yoyo:true,hold:700,duration:280,onComplete:()=>msg.destroy()});
    // Speed indicator
    const speedPct=Math.min(100,Math.round((this.baseSpeed/420)*100));
    this._showFloating(`SPEED ${speedPct}%`,GW/2,GH/2+60,'#ff6d00');
  }

  _gameOver() {
    if(this.isGameOver) return;
    this.isGameOver=true;
    SFX.gameOver();
    if(this.spawnTimer) this.spawnTimer.remove();
    if(this.levelTimer) this.levelTimer.remove();
    this.dataItems.getChildren().forEach(c=>{if(c._data)c._data.alive=false;this.tweens.killTweensOf(c);});
    const hi=parseInt(localStorage.getItem('dc_hiscore')||'0');
    if(this.score>hi) localStorage.setItem('dc_hiscore',String(this.score));
    this.cameras.main.shake(500,0.02);
    this.time.delayedCall(700,()=>{
      this.cameras.main.fadeOut(500,30,10,10);
      this.time.delayedCall(520,()=>this.scene.start('GameOver',{score:this.score,hi:Math.max(this.score,hi),level:this.level,diff:this.diff.label}));
    });
  }

  update(time,delta) {
    if(this.isGameOver||this.isPaused||!this.gameStarted) return;
    const dt=delta/1000;
    const warnY=PLAY_BOT-60;

    this.dataItems.getChildren().forEach(container=>{
      const d=container._data;
      if(!d||!d.alive) return;

      container.y+=d.speed*dt;

      // Warning flash when bad item enters danger zone
      if(d.itemType==='bad' && container.y>=warnY && !d.warned){
        d.warned=true;
        SFX.warning();
        this.tweens.add({targets:container,alpha:0.4,yoyo:true,repeat:3,duration:80,
          onComplete:()=>{if(container.active)container.setAlpha(1);}});
      }

      // Reached bottom
      if(container.y>=PLAY_BOT){
        d.alive=false;
        if(d.itemType==='bad'){
          this._explodeSmall(container.x,PLAY_BOT,0xff0000);
          this._loseLife();
          this._resetCombo();
          SFX.miss();
          this._showFloating('MISS!',container.x,PLAY_BOT-25,'#ff4444');
        } else {
          const earned=this._addScore(d.pointVal);
          this._addCombo();
          SFX.score();
          this._showFloating(`+${earned}`,container.x,PLAY_BOT-25,'#00e676');
          this.tweens.add({targets:this.scoreRobot,y:PLAY_BOT+20,yoyo:true,duration:100,ease:'Bounce'});
        }
        container.destroy();
      }
    });

    // Dynamic multiplier color
    const mc=['#00e5ff','#00ff99','#88ffaa','#ffeb3b','#ff9100','#ff6680','#ff44ff','#ff00ff','#ff2244','#ff0000'];
    const ci=Math.min(this.multiplier-1,mc.length-1);
    this.multTxt.setStyle({color:mc[ci]});
    // Pulse danger line
    const dangerAlpha=0.1+0.3*Math.sin(time*0.005);
    this.dangerLine.setAlpha(dangerAlpha);
  }
}

/* ── GAME OVER SCENE ──────────────────────────────────── */
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const {score=0,hi=0,level=1,diff='NORMAL'} = data||{};
    const w=GW,h=GH;
    const isNewHi=score>0&&score>=hi;

    this.add.rectangle(w/2,h/2,w,h,C.BG);
    for(let y=0;y<h;y+=4) this.add.rectangle(w/2,y,w,2,0x000000,0.08);

    this.add.rectangle(w/2,h/2,420,590,0x00001a,0.95);
    this.add.rectangle(w/2,h/2,424,594,0,0).setStrokeStyle(3,isNewHi?C.YELLOW:C.RED);

    const goColor=isNewHi?'#ffeb3b':'#ff1744';
    this.add.text(w/2,h/2-265,'GAME OVER',{fontFamily:'monospace',fontSize:'40px',color:goColor,stroke:isNewHi?'#664400':'#660011',strokeThickness:5}).setOrigin(0.5);
    if(isNewHi){
      const nt=this.add.text(w/2,h/2-220,'★  NEW RECORD!  ★',{fontFamily:'monospace',fontSize:'17px',color:'#ffeb3b'}).setOrigin(0.5);
      this.tweens.add({targets:nt,scaleX:1.1,scaleY:1.1,yoyo:true,repeat:-1,duration:500});
    }

    this.add.text(w/2,h/2-175,'YOUR SCORE',{fontFamily:'monospace',fontSize:'13px',color:'#8888cc'}).setOrigin(0.5);
    const st=this.add.text(w/2,h/2-143,String(score).padStart(7,'0'),{fontFamily:'monospace',fontSize:'44px',color:'#ffeb3b',stroke:'#664400',strokeThickness:4}).setOrigin(0.5);
    this.tweens.add({targets:st,scaleX:1.06,scaleY:1.06,yoyo:true,repeat:-1,duration:700});

    this.add.text(w/2,h/2-80,`HI-SCORE: ${String(hi).padStart(7,'0')}`,{fontFamily:'monospace',fontSize:'17px',color:isNewHi?'#ffeb3b':'#888888'}).setOrigin(0.5);

    this.add.rectangle(w/2,h/2-40,360,2,C.DGREY);

    const statStyle={fontFamily:'monospace',fontSize:'14px',color:'#7777aa'};
    this.add.text(w/2,h/2-14,`LEVEL REACHED: ${level}`,statStyle).setOrigin(0.5);
    this.add.text(w/2,h/2+12,`DIFFICULTY: ${diff}`,{...statStyle,color:DIFF[selectedDiff]?.color||'#cccc88'}).setOrigin(0.5);

    this.add.rectangle(w/2,h/2+38,360,2,C.DGREY);

    // Tip
    const tips=[
      'TIP: Let VALID items fall — don\'t tap them!',
      'TIP: Build combos for x10 multiplier bonus',
      'TIP: Items flash red when about to escape!',
      'TIP: EASY mode gives 5 lives to practice',
      'TIP: Multiplier resets when you make a mistake',
    ];
    const tip=tips[Math.floor(Math.random()*tips.length)];
    this.add.text(w/2,h/2+66,tip,{fontFamily:'monospace',fontSize:'12px',color:'#6666aa',wordWrap:{width:370},align:'center'}).setOrigin(0.5);

    // Buttons
    const playBg=this.add.rectangle(w/2,h/2+145,240,58,0x00aa33).setInteractive();
    this.add.rectangle(w/2,h/2+145,244,62,0,0).setStrokeStyle(3,C.GREEN);
    const pt=this.add.text(w/2,h/2+145,'▶  PLAY AGAIN',{fontFamily:'monospace',fontSize:'20px',color:'#fff'}).setOrigin(0.5);
    playBg.on('pointerdown',()=>{SFX.levelUp();this.cameras.main.fadeOut(300,10,10,30);this.time.delayedCall(320,()=>this.scene.start('Game',{diff:selectedDiff}));});
    this.tweens.add({targets:[playBg,pt],alpha:0.65,yoyo:true,repeat:-1,duration:750});

    const menuBg=this.add.rectangle(w/2,h/2+218,190,46,0x111133).setInteractive();
    this.add.rectangle(w/2,h/2+218,194,50,0,0).setStrokeStyle(2,C.CYAN);
    this.add.text(w/2,h/2+218,'CHANGE DIFFICULTY',{fontFamily:'monospace',fontSize:'14px',color:'#00e5ff'}).setOrigin(0.5);
    menuBg.on('pointerdown',()=>{this.cameras.main.fadeOut(300,10,10,30);this.time.delayedCall(320,()=>this.scene.start('Menu'));});

    if(isNewHi){
      this.add.particles(0,0,'particle',{
        x:{min:0,max:w},y:-10,lifespan:2200,speedY:{min:90,max:220},speedX:{min:-40,max:40},
        scale:{start:1.5,end:0},tint:[0xffeb3b,0xff6d00,0x00e676,0x00e5ff,0xff00ff],
        quantity:1,frequency:70,blendMode:'ADD',
      });
    }

    this.cameras.main.fadeIn(400,10,10,30);
  }
}

/* ── PHASER CONFIG ────────────────────────────────────── */
const config = {
  type: Phaser.AUTO,
  width: GW,
  height: GH,
  backgroundColor: '#0a0a1a',
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,
    pixelArt: true,
  },
  input: { activePointers: 2 },
};

new Phaser.Game(config);
