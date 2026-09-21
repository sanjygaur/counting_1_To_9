import Phaser from "phaser";
import SoundManager from "./SoundManager.js";

export default class SpineBird {
  /**
   * Create an articulated Spine Bird container in the specified Phaser scene.
   */
  static create(scene, x, y, config = {}) {
    const scale = config.scale || 0.32; // Scaled to fit comfortably in layout
    const index = config.index || 1;
    const isInteractive = config.interactive !== false;

    const container = scene.add.container(x, y);

    const hasSpineParts =
      scene.textures.exists("spine_bird_body") &&
      scene.textures.exists("spine_bird_wing") &&
      scene.textures.exists("spine_bird_tail");

    let birdRoot;
    let wingSprite;
    let wingTipSprite;
    let tailSprite;
    let feetSprite;
    let bodySprite;
    let beakSprite;

    if (hasSpineParts) {
      // Articulated Multi-part Spine Rig Root
      birdRoot = scene.add.container(0, 0).setScale(scale);

      // 1. Tail (Behind Body)
      if (scene.textures.exists("spine_bird_tail")) {
        tailSprite = scene.add
          .image(130, -10, "spine_bird_tail")
          .setOrigin(0.15, 0.6);
        birdRoot.add(tailSprite);
      }

      // 2. Feet (Under Body)
      if (scene.textures.exists("spine_bird_feet")) {
        feetSprite = scene.add
          .image(-10, 110, "spine_bird_feet")
          .setOrigin(0.5, 0.2);
        birdRoot.add(feetSprite);
      }

      // 3. Body & Head (Central Anchor)
      bodySprite = scene.add
        .image(0, 0, "spine_bird_body")
        .setOrigin(0.5, 0.5);
      birdRoot.add(bodySprite);

      // 4. Beak (Front of Head)
      if (scene.textures.exists("spine_bird_beak")) {
        beakSprite = scene.add
          .image(-135, -20, "spine_bird_beak")
          .setOrigin(0.85, 0.5);
        birdRoot.add(beakSprite);
      }

      // 5. Main Wing (Front Fore-layer)
      if (scene.textures.exists("spine_bird_wing")) {
        wingSprite = scene.add
          .image(45, 10, "spine_bird_wing")
          .setOrigin(0.18, 0.82);
        birdRoot.add(wingSprite);
      }

      // 6. Wing Tip Feathers
      if (scene.textures.exists("spine_bird_wing_tip")) {
        wingTipSprite = scene.add
          .image(150, -110, "spine_bird_wing_tip")
          .setOrigin(0.2, 0.7);
        birdRoot.add(wingTipSprite);
      }

      container.add(birdRoot);
    } else {
      // Fallback Single Texture
      const textureKey = scene.textures.exists("spine_bird_full")
        ? "spine_bird_full"
        : "level2_bird";
      birdRoot = scene.add.image(0, 0, textureKey).setScale(scale);
      container.add(birdRoot);
    }

    container.setSize(220, 160);
    container.birdRoot = birdRoot;
    container.birdSprite = birdRoot;
    container.starSprite = birdRoot; // compatibility alias
    container.wingSprite = wingSprite;
    container.wingTipSprite = wingTipSprite;
    container.tailSprite = tailSprite;
    container.feetSprite = feetSprite;
    container.bodySprite = bodySprite;
    container.beakSprite = beakSprite;
    container.birdIndex = index;
    container.starIndex = index; // compatibility alias
    container.isCounted = false;
    container.baseScale = scale;
    container.baseX = x;
    container.baseY = y;
    container.badges = [];

    // 1. Smooth Flight Hovering & Bobbing
    const bobOffset = config.bobOffset !== undefined ? config.bobOffset : 14;
    const bobDuration = 900 + (index % 3) * 140;

    container.bobTween = scene.tweens.add({
      targets: birdRoot,
      y: { from: -bobOffset, to: bobOffset },
      duration: bobDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 2. Realistic Smooth Spine Wing Flap & Tip Oscillation
    const flapDuration = 260 + (index % 3) * 30;
    if (wingSprite) {
      container.wingTween = scene.tweens.add({
        targets: wingSprite,
        angle: { from: -22, to: 28 },
        scaleY: { from: 0.84, to: 1.12 },
        duration: flapDuration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      if (wingTipSprite) {
        container.wingTipTween = scene.tweens.add({
          targets: wingTipSprite,
          angle: { from: -16, to: 22 },
          y: { from: -106, to: -116 },
          duration: flapDuration,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    } else {
      container.flapTween = scene.tweens.add({
        targets: birdRoot,
        scaleY: { from: scale * 0.88, to: scale * 1.08 },
        scaleX: { from: scale * 1.04, to: scale * 0.96 },
        duration: flapDuration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 3. Tail Wag & Sway
    if (tailSprite) {
      container.tailTween = scene.tweens.add({
        targets: tailSprite,
        angle: { from: -8, to: 10 },
        duration: 520 + (index % 2) * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 4. Subtle Body Breathing
    if (bodySprite) {
      container.bodyTween = scene.tweens.add({
        targets: bodySprite,
        scaleY: { from: 0.96, to: 1.04 },
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // 5. Gentle In-flight Banking / Tilt Sway
    const tiltDuration = 1300 + (index % 3) * 160;
    container.tiltTween = scene.tweens.add({
      targets: birdRoot,
      angle: { from: -4, to: 5 },
      duration: tiltDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 6. Dedicated High-Speed Flying Method (Triggered after clicking correct number)
    container.flyTo = (targetX, targetY, options = {}) => {
      const duration = options.duration || 580;
      const delay = options.delay || 0;
      const onComplete = options.onComplete || (() => {});

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

      // Fast, dynamic flight wing flapping
      if (wingSprite) {
        if (container.wingTween) container.wingTween.stop();
        scene.tweens.add({
          targets: wingSprite,
          angle: { from: -38, to: 42 },
          scaleY: { from: 0.78, to: 1.18 },
          duration: 90,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        if (wingTipSprite && container.wingTipTween) {
          container.wingTipTween.stop();
          scene.tweens.add({
            targets: wingTipSprite,
            angle: { from: -24, to: 28 },
            duration: 90,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          });
        }
      }

      // Bank bird gracefully upward along flight path
      scene.tweens.add({
        targets: birdRoot,
        angle: -16,
        duration: 200,
        ease: "Quad.easeOut",
      });

      // Trailing sparkle trail
      const trailTimer = scene.time.addEvent({
        delay: 50,
        callback: () => {
          if (!container.active) return;
          if (scene.starParticles) {
            scene.starParticles.emitParticleAt(container.x, container.y, 2);
          }
        },
        loop: true,
      });

      // Smooth flight trajectory swooping to target
      scene.tweens.add({
        targets: container,
        x: targetX,
        y: targetY,
        scale: scale * 0.45,
        duration: duration,
        delay: delay,
        ease: "Cubic.easeInOut",
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
            angle: { from: -36, to: 42 },
            duration: 80,
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


