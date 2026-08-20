# Map — Frontend Documentation

This document describes the data structure returned by the server when a player joins a room, and how the frontend should consume and render this data.

## Event and payload

When a player joins a room (`socket.emit('join', ...)`), the server responds with the `joined` event:

```javascript
socket.emit('joined', {
  roomId,
  player,
  map: room.map,
  players: room.players
})
```

The frontend should listen for this event once, when joining the room:

```javascript
socket.on('joined', (data) => {
  const { roomId, player, map, players } = data
  // initialize the game with this data
})
```

---

## Payload fields

### `roomId` (string)

UUID of the room the player joined. Used to identify the room in future events (e.g. reconnection, logs).

### `player` (object)

Data for the player who just joined — the client that received the event.

```javascript
{
  userID: "abc123",
  socketID: "xYz9...",
  username: "flima",
  slot: 1,
  hp: 100,
  x: 10,
  y: 10
}
```

| Field | Type | Description |
|---|---|---|
| `userID` | string | Persistent user ID (comes from authentication) |
| `socketID` | string | Current socket.io connection ID |
| `username` | string | Display name |
| `slot` | number | Player's slot in the room (1 to `ROOM_MAX_SIZE`) — determines which `castleZone`/`spawnPoint` belongs to them |
| `hp` | number | Current HP |
| `x`, `y` | number | Current position on the map (initially equal to the slot's `spawnPoint`) |

### `players` (array)

List of **all** players currently in the room, including the one who just joined. Same format as the `player` object above, one item per player.

Use this list to know which `castleZones`/`spawnPoints` are already occupied:

```javascript
const occupiedSlots = new Set(players.map(p => p.slot))
```

### `map` (object)

The map generated for this room. Full structure below.

---

## `map` structure

```javascript
{
  mapId: "f3a1...",
  width: 100,
  height: 100,
  spawnPoints: [...],
  castleZones: [...],
  obstacles: [...],
  resourceSpawns: [...],
  movement: {
    playerSpeed: 5,
    boundaries: { minX: 0, maxX: 100, minY: 0, maxY: 100 }
  }
}
```

### `mapId` (string)

Unique UUID of the generated map. Mainly used for debugging/logging — doesn't need to be shown to the player.

### `width`, `height` (number)

Map dimensions in game units (not pixels). Use these values to calculate render scale:

```javascript
const scale = canvasWidthInPixels / map.width
```

### `spawnPoints` (array)

Each player's starting position, one per slot.

```javascript
{ playerSlot: 1, x: 10, y: 10 }
```

| Field | Type | Description |
|---|---|---|
| `playerSlot` | number | Slot this position belongs to (1 to `maxPlayers`) |
| `x`, `y` | number | Spawn coordinate |

The frontend uses this to know where to position the player upon joining. Currently matches the center of the same slot's `castleZone`.

### `castleZones` (array)

Each player's territory area.

```javascript
{ playerSlot: 1, x: 10, y: 10, radius: 8 }
```

| Field | Type | Description |
|---|---|---|
| `playerSlot` | number | Slot that owns this zone |
| `x`, `y` | number | Zone center |
| `radius` | number | Castle area radius |

**Suggested rendering**: draw as a semi-transparent circle. If the slot is present in `players` (occupied), use a solid fill; if not, use a dashed border to indicate "vacant" (see `map-test-client.html` for a reference implementation).

### `obstacles` (array)

Terrain elements that block movement (rocks, trees).

```javascript
{ type: "rock", x: 50, y: 50, radius: 4, blocksMovement: true }
```

| Field | Type | Description |
|---|---|---|
| `type` | `"rock"` \| `"tree"` | Visual type of the obstacle |
| `x`, `y` | number | Center position |
| `radius` | number | Collision radius |
| `blocksMovement` | boolean | Currently always `true` — indicates the player cannot walk over it |

**Collision**: the frontend should treat each obstacle as a solid circle when calculating player movement (check whether the target position is farther than `radius` from every obstacle).

### `resourceSpawns` (array)

Resource collection points (wood, iron).

```javascript
{
  id: "wood_1",
  type: "wood",
  x: 20,
  y: 40,
  amount: 100,
  respawnTime: 30
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier for the resource node — use it when sending a harvest action (`tile:harvest` or similar) |
| `type` | `"wood"` | Resource type |
| `x`, `y` | number | Node position |
| `amount` | number | Amount available to collect |
| `respawnTime` | number | Seconds until the resource reappears after being depleted |

**Important**: the client should **never** decide whether a resource was collected — it only sends the intent (`tile:harvest`, with the resource `id`) and waits for the server to confirm via an update event (e.g. `tile:updated`) before reflecting the change visually. See the "server is the source of truth" rule in `team_plan.md`.

### `movement` (object)

Valid movement rules for this map.

```javascript
{
  playerSpeed: 5,
  boundaries: { minX: 0, maxX: 100, minY: 0, maxY: 100 }
}
```

| Field | Type | Description |
|---|---|---|
| `playerSpeed` | number | Player movement speed (units per tick/second — confirm exact unit with backend) |
| `boundaries` | object | Absolute map limits — the player should never cross these values |

---

## Recommended frontend usage flow

1. Listen for `joined`, extract `map`, `player`, `players`.
2. Initialize the camera/canvas using `map.width` and `map.height`.
3. Render `castleZones` (highlighting occupied vs vacant slots).
4. Render `obstacles` and `resourceSpawns` as sprites/shapes at their corresponding positions.
5. Position the local player at `player.x`, `player.y`.
6. Use `movement.boundaries` to clamp player movement client-side (client-side validation is only for visual responsiveness — the server always revalidates).
7. Listen for incremental events (e.g. `player_joined`, `tile:updated`) to update state without re-rendering the entire map.

## Reference implementation example

See `map-test-client.html` for a minimal HTML/vanilla JS client that connects via socket.io, receives this payload, and renders everything on a `<canvas>`.
