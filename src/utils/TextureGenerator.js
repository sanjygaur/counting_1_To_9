export default class TextureGenerator {
  static createAllTextures(scene) {
    // Only generate the auxiliary textures actually used by the game
    this.createStar(scene);
    this.createBadge(scene);
  }

  static createBackground(scene) {
    if (scene.textures.exists('bg_orchard')) return;
    const canvas = scene.textures.createCanvas('bg_orchard', 1080, 1920);
    const ctx = canvas.getContext();

    // Sky gradient (vertical 1080x1920)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1300);
    skyGrad.addColorStop(0, '#5ab9f8');
    skyGrad.addColorStop(0.5, '#a4e1ff');
    skyGrad.addColorStop(1, '#e3f7ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Fluffy clouds in upper sky
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    [
      { x: 200, y: 220, r: 65 },
      { x: 260, y: 200, r: 85 },
      { x: 340, y: 230, r: 70 },
      { x: 760, y: 280, r: 70 },
      { x: 840, y: 250, r: 90 },
      { x: 920, y: 280, r: 75 }
    ].forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Distant Rolling Hills
    ctx.fillStyle = '#8bd376';
    ctx.beginPath();
    ctx.moveTo(0, 1250);
    ctx.quadraticCurveTo(320, 1140, 680, 1220);
    ctx.quadraticCurveTo(940, 1280, 1080, 1200);
    ctx.lineTo(1080, 1920);
    ctx.lineTo(0, 1920);
    ctx.fill();

    // Foreground Meadow / Orchard Hill
    const grassGrad = ctx.createLinearGradient(0, 1280, 0, 1920);
    grassGrad.addColorStop(0, '#52b738');
    grassGrad.addColorStop(0.6, '#388e3c');
    grassGrad.addColorStop(1, '#256328');
    ctx.fillStyle = grassGrad;
    ctx.beginPath();
    ctx.moveTo(0, 1340);
    ctx.quadraticCurveTo(450, 1270, 850, 1310);
    ctx.quadraticCurveTo(990, 1330, 1080, 1300);
    ctx.lineTo(1080, 1920);
    ctx.lineTo(0, 1920);
    ctx.fill();

    canvas.refresh();
  }

  static createTree(scene) {
    if (scene.textures.exists('tree_orchard')) return;
    const canvas = scene.textures.createCanvas('tree_orchard', 900, 860);
    const ctx = canvas.getContext();

    // Trunk
    const trunkGrad = ctx.createLinearGradient(380, 360, 520, 860);
    trunkGrad.addColorStop(0, '#8d5524');
    trunkGrad.addColorStop(0.5, '#6a3c13');
    trunkGrad.addColorStop(1, '#4e2808');
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(380, 420);
    ctx.bezierCurveTo(400, 560, 360, 720, 310, 860);
    ctx.lineTo(590, 860);
    ctx.bezierCurveTo(540, 720, 500, 560, 520, 420);
    ctx.closePath();
    ctx.fill();

    // Bark details
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(420, 490);
    ctx.bezierCurveTo(440, 600, 410, 720, 390, 830);
    ctx.moveTo(480, 520);
    ctx.bezierCurveTo(500, 640, 475, 740, 490, 840);
    ctx.stroke();

    // Canopy (Large, lush overlapping layered green circles)
    const folios = [
      { x: 450, y: 320, r: 260, c: '#2e7d32' },
      { x: 280, y: 360, r: 200, c: '#388e3c' },
      { x: 620, y: 360, r: 200, c: '#388e3c' },
      { x: 350, y: 210, r: 190, c: '#43a047' },
      { x: 550, y: 210, r: 190, c: '#43a047' },
      { x: 450, y: 170, r: 170, c: '#4caf50' },
      { x: 270, y: 280, r: 140, c: '#66bb6a' },
      { x: 630, y: 280, r: 140, c: '#66bb6a' }
    ];

    folios.forEach(f => {
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sunlit leaf highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(430, 160, 120, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createApple(scene) {
    if (scene.textures.exists('apple_red')) return;
    const canvas = scene.textures.createCanvas('apple_red', 120, 120);
    const ctx = canvas.getContext();

    // Stem
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, 48);
    ctx.quadraticCurveTo(66, 22, 80, 14);
    ctx.stroke();

    // Green Leaf
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.moveTo(66, 32);
    ctx.quadraticCurveTo(92, 20, 96, 36);
    ctx.quadraticCurveTo(78, 48, 66, 32);
    ctx.fill();

    // Apple body gradient
    const grad = ctx.createRadialGradient(48, 65, 8, 60, 77, 48);
    grad.addColorStop(0, '#ff6b6b');
    grad.addColorStop(0.4, '#e61e25');
    grad.addColorStop(0.85, '#b71118');
    grad.addColorStop(1, '#81070d');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(60, 52);
    ctx.bezierCurveTo(34, 40, 17, 65, 20, 88);
    ctx.bezierCurveTo(23, 111, 46, 117, 60, 105);
    ctx.bezierCurveTo(74, 117, 97, 111, 100, 88);
    ctx.bezierCurveTo(103, 65, 86, 40, 60, 52);
    ctx.closePath();
    ctx.fill();

    // Glossy 3D specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(43, 65, 11, 20, -Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createGoldenApple(scene) {
    if (scene.textures.exists('apple_gold')) return;
    const canvas = scene.textures.createCanvas('apple_gold', 120, 120);
    const ctx = canvas.getContext();

    // Stem
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, 48);
    ctx.quadraticCurveTo(66, 22, 80, 14);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = '#8bc34a';
    ctx.beginPath();
    ctx.moveTo(66, 32);
    ctx.quadraticCurveTo(92, 20, 96, 36);
    ctx.quadraticCurveTo(78, 48, 66, 32);
    ctx.fill();

    // Golden gradient
    const grad = ctx.createRadialGradient(48, 65, 8, 60, 77, 48);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.35, '#ffd54f');
    grad.addColorStop(0.8, '#ffb300');
    grad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(60, 52);
    ctx.bezierCurveTo(34, 40, 17, 65, 20, 88);
    ctx.bezierCurveTo(23, 111, 46, 117, 60, 105);
    ctx.bezierCurveTo(74, 117, 97, 111, 100, 88);
    ctx.bezierCurveTo(103, 65, 86, 40, 60, 52);
    ctx.closePath();
    ctx.fill();

    // Glossy highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(43, 65, 11, 20, -Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();

    canvas.refresh();
  }

  static createBasket(scene) {
    if (scene.textures.exists('basket_wicker')) return;
    const canvas = scene.textures.createCanvas('basket_wicker', 260, 190);
    const ctx = canvas.getContext();

    // Handle
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(130, 90, 70, Math.PI, 0);
    ctx.stroke();

    // Body gradient
    const grad = ctx.createLinearGradient(0, 80, 0, 185);
    grad.addColorStop(0, '#d7995b');
    grad.addColorStop(1, '#9c5a1f');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(45, 80);
    ctx.lineTo(215, 80);
    ctx.quadraticCurveTo(195, 185, 130, 185);
    ctx.quadraticCurveTo(65, 185, 45, 80);
    ctx.closePath();
    ctx.fill();

    // Rim
    ctx.fillStyle = '#f0b070';
    ctx.beginPath();
    ctx.ellipse(130, 80, 90, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c4314';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Wicker ribs
    ctx.strokeStyle = 'rgba(92, 51, 23, 0.4)';
    ctx.lineWidth = 4;
    for (let i = -60; i <= 60; i += 25) {
      ctx.beginPath();
      ctx.moveTo(130 + i, 85);
      ctx.lineTo(130 + i * 0.7, 175);
      ctx.stroke();
    }

    canvas.refresh();
  }

  static createButtons(scene) {
    const states = [
      { key: 'btn_default', top: '#ffb300', bot: '#f57c00', border: '#b26a00' },
      { key: 'btn_hover',   top: '#ffd54f', bot: '#ff9800', border: '#e65100' },
      { key: 'btn_correct', top: '#81c784', bot: '#388e3c', border: '#1b5e20' },
      { key: 'btn_wrong',   top: '#e57373', bot: '#d32f2f', border: '#b71c1c' }
    ];

    states.forEach(s => {
      if (scene.textures.exists(s.key)) return;
      const w = 460, h = 150, r = 26;
      const canvas = scene.textures.createCanvas(s.key, w, h);
      const ctx = canvas.getContext();

      // Outer shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      this.drawRoundedRect(ctx, 6, 12, w - 12, h - 12, r);
      ctx.fill();

      // Body gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, s.top);
      grad.addColorStop(1, s.bot);
      ctx.fillStyle = grad;
      this.drawRoundedRect(ctx, 6, 6, w - 12, h - 18, r);
      ctx.fill();

      // Stroke
      ctx.strokeStyle = s.border;
      ctx.lineWidth = 6;
      this.drawRoundedRect(ctx, 6, 6, w - 12, h - 18, r);
      ctx.stroke();

      // Top gloss highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      this.drawRoundedRect(ctx, 14, 12, w - 28, 42, 14);
      ctx.fill();

      canvas.refresh();
    });
  }

  static createBadge(scene) {
    if (scene.textures.exists('badge_count')) return;
    const canvas = scene.textures.createCanvas('badge_count', 54, 54);
    const ctx = canvas.getContext();

    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(27, 27, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(27, 27, 20, 0, Math.PI * 2);
    ctx.stroke();

    canvas.refresh();
  }

  static createStar(scene) {
    if (scene.textures.exists('particle_star')) return;
    const canvas = scene.textures.createCanvas('particle_star', 60, 60);
    const ctx = canvas.getContext();

    ctx.fillStyle = '#ffeb3b';
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;

    const cx = 30, cy = 30, spikes = 5, outerR = 27, innerR = 12;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerR;
      let y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    canvas.refresh();
  }

  static createClockIcon(scene) {
    if (scene.textures.exists('icon_sun_clock')) return;
    const canvas = scene.textures.createCanvas('icon_sun_clock', 72, 72);
    const ctx = canvas.getContext();

    // Sun body
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(36, 36, 24, 0, Math.PI * 2);
    ctx.fill();

    // Rays
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(36 + Math.cos(a) * 27, 36 + Math.sin(a) * 27);
      ctx.lineTo(36 + Math.cos(a) * 34, 36 + Math.sin(a) * 34);
      ctx.stroke();
    }

    // Friendly face
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.arc(30, 33, 3, 0, Math.PI * 2);
    ctx.arc(42, 33, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(36, 38, 9, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    canvas.refresh();
  }

  static createSoundIcons(scene) {
    // Sound ON
    if (!scene.textures.exists('btn_sound_on')) {
      const canvasOn = scene.textures.createCanvas('btn_sound_on', 84, 84);
      const ctx = canvasOn.getContext();

      // Circular button background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(42, 42, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#43a047';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Speaker body
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.rect(18, 32, 12, 20);
      ctx.fill();

      // Speaker cone
      ctx.beginPath();
      ctx.moveTo(30, 32);
      ctx.lineTo(46, 20);
      ctx.lineTo(46, 64);
      ctx.lineTo(30, 52);
      ctx.closePath();
      ctx.fill();

      // Sound waves arcs
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Inner wave
      ctx.beginPath();
      ctx.arc(44, 42, 14, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Outer wave
      ctx.beginPath();
      ctx.arc(44, 42, 24, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      canvasOn.refresh();
    }

    // Sound OFF
    if (!scene.textures.exists('btn_sound_off')) {
      const canvasOff = scene.textures.createCanvas('btn_sound_off', 84, 84);
      const ctx = canvasOff.getContext();

      // Circular button background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(42, 42, 38, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Speaker body
      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.rect(18, 32, 12, 20);
      ctx.fill();

      // Speaker cone
      ctx.beginPath();
      ctx.moveTo(30, 32);
      ctx.lineTo(46, 20);
      ctx.lineTo(46, 64);
      ctx.lineTo(30, 52);
      ctx.closePath();
      ctx.fill();

      // Red slash strike-through
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(18, 66);
      ctx.lineTo(66, 18);
      ctx.stroke();

      canvasOff.refresh();
    }
  }

  static createPauseIcons(scene) {
    if (scene.textures.exists('btn_pause')) return;
    const canvas = scene.textures.createCanvas('btn_pause', 84, 84);
    const ctx = canvas.getContext();

    // Circular white background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(42, 42, 38, 0, Math.PI * 2);
    ctx.fill();

    // Amber / orange border
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Two rounded vertical pause bars (||)
    ctx.fillStyle = '#e65100';
    this.drawRoundedRect(ctx, 28, 24, 9, 36, 4);
    ctx.fill();
    this.drawRoundedRect(ctx, 47, 24, 9, 36, 4);
    ctx.fill();

    canvas.refresh();
  }

  static drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
