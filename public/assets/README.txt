SPINE BIRD STARTER BUNDLE
===========================

This bundle was prepared from the supplied 210x141 bird image.

FILES
-----
00_bird_reference_transparent.png
    Full bird with black background removed.

01_body_head.png
    Main body/head artwork.

02_main_wing.png
    Large visible wing.

03_wing_tip.png
    Upper feather/tip section for extra deformation.

04_tail.png
    Tail artwork.

05_beak.png
    Beak artwork.

06_feet.png
    Feet artwork.

07_spine_rig_reference.png
    Suggested bone placement reference.

SUGGESTED SPINE HIERARCHY
-------------------------
root
└── body
    ├── head
    ├── wing
    │   └── wingTip
    ├── tail
    │   └── tailTip
    ├── beak
    └── feet

IMPORTANT
---------
These are starter cut-outs made from a flattened source image. Because the
original image was not supplied as separate layered artwork, some edges and
overlap areas may need cleanup in Photoshop/GIMP/Aseprite before production.

SUGGESTED ANIMATIONS
--------------------
fly:
    wing flap + small body bob + tail movement

glide:
    wing extended + very small body/tail movement

turn:
    body rotation + wing adjustment

For the first Spine test, animate only:
    wing rotation
    wingTip rotation
    tail rotation
    tailTip rotation
    small body rotation

PHASER
------
Let Spine handle the character animation. Let Phaser control:
    x/y movement
    overall rotation
    flight speed
    fly/glide state
    screen/world movement
