import Phaser from "phaser";
import SoundManager from "./SoundManager.js";

export default class SpineBird {
  /**
   * Create an articulated 2D Spine Bird with genuine skeletal multi-part anatomy
   * (Tail, Feet, Body/Head, and Wing with shoulder pivot).
   */
  static create(scene, x, y, config = {}) {
    const scale = config.scale || 0.32; // Scaled to fit comfortably in layout
    const index = config.index || 1;
    const isInteractive = config.interactive !== false;
    // Consistent uniform facing direction (1 = left)
    const facingDir = config.facingDir !== undefined ? config.facingDir : 1;

    const container = scene.add.container(x, y);

    // Articulated Multi-part Spine Rig Root
    const birdRoot = scene.add.container(0, 0).setScale(scale * facingDir, scale);

    let tailSprite;
    let feetSprite;
    let bodySprite;
    let wingSprite;

    const hasSpineParts =
      scene.textures.exists("spine_bird_body") &&
      scene.textures.exists("spine_bird_wing") &&
      scene.textures.exists("spine_bird_tail");

    if (hasSpineParts) {
      // 1. Layer 1 (Backmost): Articulated Tail Feathers
      tailSprite = scene.add
        .image(116, 60, "spine_bird_tail")
        .setOrigin(0.12, 0.51);
      birdRoot.add(tailSprite);

      // 2. Layer 2 (Under): Feet
      if (scene.textures.exists("spine_bird_feet")) {
        feetSprite = scene.add
          .image(-26, 112, "spine_bird_feet")
          .setOrigin(0.5, 0.16);
        birdRoot.add(feetSprite);
      }

      // 3. Layer 3 (Middle): Body & Head (with eyes, beak, and chest)
      bodySprite = scene.add
        .image(-82, 4, "spine_bird_body")
        .setOrigin(0.5, 0.5);
      birdRoot.add(bodySprite);

      // 4. Layer 4 (Front Fore-layer): Wing with true shoulder joint pivot
      wingSprite = scene.add
        .image(-70, 18, "spine_bird_wing")
        .setOrigin(0.17, 0.84);
      birdRoot.add(wingSprite);
    } else {
      // Fallback single sprite
      const textureKey = scene.textures.exists("spine_bird_full")
        ? "spine_bird_full"
        : "level2_bird";
      bodySprite = scene.add.image(0, 0, textureKey).setOrigin(0.5, 0.5);
      birdRoot.add(bodySprite);
    }

    container.add(birdRoot);

    container.setSize(220, 160);
    container.birdRoot = birdRoot;
    container.birdSprite = birdRoot;
    container.starSprite = birdRoot; // compatibility alias
    container.wingSprite = wingSprite;
    container.tailSprite = tailSprite;
    container.feetSprite = feetSprite;
    container.bodySprite = bodySprite;
    container.birdIndex = index;
    container.starIndex = index; // compatibility alias
    container.isCounted = false;
    container.baseScale = scale;
    container.facingDir = facingDir;
    container.baseX = x;
    container.baseY = y;
    container.badges = [];

    // 1. Fluid In-Flight Hovering & Vertical Wave
    const bobOffset = config.bobOffset !== undefined ? config.bobOffset : 14;
    const bobDuration = 880 + (index % 3) * 130;

    container.bobTween = scene.tweens.add({
      targets: birdRoot,
      y: { from: -bobOffset, to: bobOffset },
      duration: bobDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 2. Realistic Skeletal Wing Flap (True shoulder joint rotation)
    const flapDuration = 250 + (index % 3) * 30;
    if (wingSprite) {
      container.wingTween = scene.tweens.add({
        targets: wingSprite,
        angle: { from: -24, to: 28 },
        scaleY: { from: 0.84, to: 1.12 },
        duration: flapDuration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      container.flapTween = scene.tweens.add({
        targets: birdRoot,
        scaleY: { from: scale * 0.86, to: scale * 1.12 },
        duration: flapDuration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 3. Realistic Tail Wag & Sway
    if (tailSprite) {
      container.tailTween = scene.tweens.add({
        targets: tailSprite,
        angle: { from: -7, to: 9 },
        duration: 500 + (index % 2) * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 4. Subtle Feet Hovering Tuck
    if (feetSprite) {
      container.feetTween = scene.tweens.add({
        targets: feetSprite,
        y: { from: 108, to: 116 },
        duration: 540,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 5. Subtle Body Breathing
    if (bodySprite) {
      container.bodyTween = scene.tweens.add({
        targets: bodySprite,
        scaleY: { from: 0.96, to: 1.03 },
        duration: 820,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 6. Gentle In-flight Banking / Tilt Sway
    const tiltDuration = 1250 + (index % 3) * 160;
    container.tiltTween = scene.tweens.add({
      targets: birdRoot,
      angle: { from: -4, to: 5 },
      duration: tiltDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 7. Dedicated High-Speed Flying Method along Random Curved Paths (Triggered after clicking number)
    container.flyTo = (targetX, targetY, options = {}) => {
      const duration = options.duration || 680;
      const delay = options.delay || 0;
      const onComplete = options.onComplete || (() => { });

      container.isFlying = true;
      container.setDepth(150);

      // Clean up idle floating & tilt tweens safely
      if (container.bobTween) container.bobTween.stop();
      if (container.tiltTween) container.tiltTween.stop();
      if (container.bodyTween) container.bodyTween.stop();

      // Fade out and remove counter badges cleanly
      if (container.badges && container.badges.length > 0) {
        container.badges.forEach((b) => {
          scene.tweens.add({
            targets: b,
            alpha: 0,
            scale: 0,
            duration: 150,
            onComplete: () => b.destroy(),
          });
        });
        container.badges = [];
      }

      // Fast, vigorous flight wing flapping flutter
      if (wingSprite) {
        if (container.wingTween) container.wingTween.stop();
        scene.tweens.add({
          targets: wingSprite,
          angle: { from: -40, to: 44 },
          scaleY: { from: 0.75, to: 1.2 },
          duration: 75,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      } else if (container.flapTween) {
        container.flapTween.stop();
        scene.tweens.add({
          targets: birdRoot,
          scaleY: { from: scale * 0.75, to: scale * 1.22 },
          duration: 75,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }

      // Generate randomized organic 3D-like curved trajectory
      const startX = container.x;
      const startY = container.y;

      // Randomize swooping curvature (alternating wide left/right swoops with loft and dips)
      const isEven = index % 2 === 0;
      const sideDir = isEven ? 1 : -1;
      const curveX1 = startX + sideDir * Phaser.Math.Between(180, 380);
      const curveY1 = startY + Phaser.Math.Between(40, 220); // initial downward/lateral swoop

      const curveX2 =
        targetX + (isEven ? -1 : 1) * Phaser.Math.Between(100, 280);
      const curveY2 = targetY + Phaser.Math.Between(140, 360); // upward climb arch

      const curve = new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(startX, startY),
        new Phaser.Math.Vector2(curveX1, curveY1),
        new Phaser.Math.Vector2(curveX2, curveY2),
        new Phaser.Math.Vector2(targetX, targetY),
      );

      // Trailing sparkle trail
      const trailTimer = scene.time.addEvent({
        delay: 45,
        callback: () => {
          if (!container.active) return;
          if (scene.starParticles) {
            scene.starParticles.emitParticleAt(container.x, container.y, 2);
          }
        },
        loop: true,
      });

      // Animate progress along the curve (0 to 1) with banking rotation
      const progressObj = { t: 0 };
      scene.tweens.add({
        targets: progressObj,
        t: 1,
        duration: duration,
        delay: delay,
        ease: "Sine.easeInOut",
        onUpdate: () => {
          if (!container.active) return;
          const t = progressObj.t;
          const pt = curve.getPoint(t);
          const tangent = curve.getTangent(t);

          container.setPosition(pt.x, pt.y);

          // Smooth scale reduction towards target
          const currentScale = Phaser.Math.Linear(scale, scale * 0.42, t);

          // Realistic dynamic banking tilt along flight velocity
          if (tangent) {
            const angleDeg = Phaser.Math.RadToDeg(
              Math.atan2(tangent.y, tangent.x),
            );
            if (tangent.x < 0) {
              // Flying left (natural facing)
              birdRoot.setScale(currentScale, currentScale);
              const bankAngle = Phaser.Math.Clamp(angleDeg + 180, -35, 35);
              birdRoot.setAngle(bankAngle);
            } else {
              // Flying right (flip horizontally)
              birdRoot.setScale(-currentScale, currentScale);
              const bankAngle = Phaser.Math.Clamp(angleDeg, -35, 35);
              birdRoot.setAngle(bankAngle);
            }
          }
        },
        onComplete: () => {
          trailTimer.remove();
          if (onComplete) onComplete();
          container.destroy();
        },
      });
    };

    if (isInteractive) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, 220, 160),
        Phaser.Geom.Rectangle.Contains,
      );
      container.input.cursor = "pointer";

      container.on("pointerdown", () => {
        if (scene.isInputLocked || scene.isPaused || container.isCounted) return;
        container.isCounted = true;
        scene.tappedCount++;

        SoundManager.playBirdChirp();
        SoundManager.playCount(scene.tappedCount);

        if (scene.starParticles) {
          scene.starParticles.emitParticleAt(container.x, container.y, 10);
        }

        // Rapid Joyful Wing Flutter on Tap
        if (wingSprite) {
          scene.tweens.add({
            targets: wingSprite,
            angle: { from: -38, to: 42 },
            duration: 75,
            yoyo: true,
            repeat: 4,
            ease: "Sine.easeInOut",
          });
        }

        // Joyful Chirp Hop & Bounce
        scene.tweens.add({
          targets: birdRoot,
          y: birdRoot.y - 28,
          duration: 150,
          yoyo: true,
          ease: "Back.easeOut",
        });

        scene.tweens.add({
          targets: container,
          scale: 1.22,
          duration: 110,
          yoyo: true,
          ease: "Quad.easeInOut",
        });

        // Add Number Badge above the bird
        const badge = scene.add.image(0, -75, "badge_count").setScale(0);
        const badgeText = scene.add
          .text(0, -75, `${scene.tappedCount}`, {
            fontFamily: '"Fredoka", "Arial Black", "Comic Sans MS", sans-serif',
            fontSize: "30px",
            fontStyle: "900",
            color: "#0369a1",
          })
          .setOrigin(0.5)
          .setScale(0);

        container.add([badge, badgeText]);
        container.badges.push(badge, badgeText);

        scene.tweens.add({
          targets: [badge, badgeText],
          scale: 1.15,
          duration: 220,
          ease: "Back.easeOut",
        });
      });
    }

    return container;
  }
}




