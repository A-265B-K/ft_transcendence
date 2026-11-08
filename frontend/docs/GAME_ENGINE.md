# PixiJS Game Engine

## Initialization

`GameCanvas` creates `new Game()` and calls
`game.start(container, joinedData, socket)`. `Game.start()`:

1. initializes `Application` with window resizing and device-pixel density;
2. appends `app.canvas` to the supplied React `div`;
3. awaits `loadGameTextures()`;
4. creates `GameScene`;
5. adds `scene.world` to the stage and registers the ticker callback.

`Game.destroy()` removes the ticker, destroys input listeners, clears boulders,
and destroys the Pixi application.

## Frame loop

The ticker updates weapon animation and remote hit timers before calling
`GameScene.update()`. The scene updates predicted local movement, emits
`player_move` only when movement changes, updates the camera and background,
renders visible map tiles, updates catapults, and advances boulders.

## World and projection

The logical map is calculated based on the amount of players. `isoX` and `isoY` project grid coordinates
using 64x32 tiles. `GameMap` uses a fixed pool of 3,500 sprites and hides
sprites outside the current camera view. Server `resourceSpawns` become wood or
iron map cells; other cells are grass.

## Entities

- `Player`: local input, movement, direction, inventory, armor, sprite
  animation, and equipped weapon.
- `RemotePlayer`: server-positioned player sprite, directional animation,
  weapon, and hit flash.
- `Castle`: level texture (1–4), health bar, label, and destroyed state.
- `Catapult`: interpolated movement, health bar, directional idle/moving/firing
  textures, firing flash, and timed broken fade.
- `Weapon`: shared texture/sprite base. Sword and axe swing; dagger and spear
  stab. Weapon textures are configured once by `GameScene`.

## Controls and actions

`Input` maps W/A/S/D to movement, F to `player_attack`, and R to `castleattack`.
`GameScene.requestattack()` waits for the server ack `{ ok: boolean }` before
playing the local weapon animation. Castle and catapult projectiles are visual
interpolations only; hit resolution is not implemented in the frontend.

## React overlay

`GameCanvas` overlays React UI over the Pixi canvas. A 32 ms interval reads
inventory, castle pointer, and castle-proximity snapshots. Socket handlers
update HP, castle health/level, armor, opponents, spectating, and end-game
state. The Escape key pauses the ticker; leaving destroys the engine and
disconnects the shared socket.
