import Phaser from "phaser";
import SoundManager from "./SoundManager.js";

export default class SpineBird {
  /**
   * Create an animated Spine Bird container in the specified Phaser scene.
   */
  static create(scene, x, y, config = {}) {
    const scale = config.scale || 0.32; // Scaled to fit comfortably in layout (840x564 original -> ~270x180)
    const index = config.index || 1;
    const isInteractive = config.interactive !== false;

    const container = scene.add.container(x, y);

    // Main bird sprite from public/assets/spine_bird/00_bird_reference_transparent.png
    const textureKey = scene.textures.exists("spine_bird_full")
      ? "spine_bird_full"
      : "level2_bird";

    const birdSprite = scene.add.image(0, 0, textureKey).setScale(scale);
    container.add(birdSprite);

    container.setSize(220, 160);
    container.birdSprite = birdSprite;
    container.starSprite = birdSprite; // compatibility alias
    container.birdIndex = index;
    container.starIndex = index; // compatibility alias
    container.isCounted = false;
    container.baseScale = scale;
    container.baseX = x;
    container.baseY = y;

    // 1. Fluid Flying / Hovering Bobbing Animation
    const bobOffset = config.bobOffset !== undefined ? config.bobOffset : 12;
    const bobDuration = 800 + (index % 3) * 140;

    container.bobTween = scene.tweens.add({
      targets: birdSprite,
      y: { from: -bobOffset, to: bobOffset },
      duration: bobDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 2. Realistic Spine-like Wing Flap & Breathing Animation
    const flapDuration = 320 + (index % 3) * 40;
    container.flapTween = scene.tweens.add({
      targets: birdSprite,
      scaleY: { from: scale * 0.88, to: scale * 1.08 },
      scaleX: { from: scale * 1.04, to: scale * 0.96 },
      duration: flapDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 3. Gentle Banking / In-flight Tilt Sway
    const tiltDuration = 1200 + (index % 3) * 180;
    container.tiltTween = scene.tweens.add({
      targets: birdSprite,
      angle: { from: -4, to: 5 },
      duration: tiltDuration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

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

        // Joyful Chirp Hop & Spin
        scene.tweens.add({
          targets: birdSprite,
          y: birdSprite.y - 28,
          scaleY: scale * 1.25,
          scaleX: scale * 1.15,
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
