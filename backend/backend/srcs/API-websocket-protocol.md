# ft_transcendence — Castle Game: WebSocket API

Documentation of the real-time communication protocol between frontend and backend, based on the current implementation (`onConnection.js`).

**Base URL:** `http://localhost:3000` (adjust for production/Docker environment)
**Client lib:** `socket.io-client` (or the script served at `/socket.io/socket.io.js`)

---

## Connecting

```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')
```

The connection handshake happens automatically. Use the native `connect` event to know when it's ready:

```js
socket.on('connect', () => {
  console.log('connected:', socket.id)
})
```

---

## REST Endpoints (Fastify)

| Method | Route | Returns | Description |
|---|---|---|---|
| GET | `/ping` | `{ ok: true }` | Server health-check |

> No game-related REST routes exist yet — all match logic currently lives in WebSocket events.

---

## WebSocket Events

### `join` — Frontend → Server

Requests entry into a room. The server automatically decides the room (finds one with space or creates a new one) — the frontend does **not** choose the room.

```js
socket.emit('join', {
  id: 'user-001',      // user identifier (not yet validated against real auth)
  username: 'flima'    // display name
})
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | User ID. Used to try to retrieve an existing player (currently via mock, later via alkuijte's auth) |
| `username` | string | yes | Used if the player is new |

---

### `joined` — Server → Frontend (direct reply)

Confirmation sent **only to the player who joined**, containing their initial state and assigned room.

```js
socket.on('joined', (data) => {
  console.log(data.roomId)
  console.log(data.player)
})
```

**Payload:**
```json
{
  "roomId": "room-uuid",
  "player": {
    "userID": "user-001",
    "socketID": "abc123",
    "username": "flima",
    "hp": 100,
    "x": 0,
    "y": 0
  }
}
```

---

### `player_joined` — Server → rest of the room

Notifies the players **already present in the room** that someone new has joined. **Not sent to the player who just joined** (only to the others).

```js
socket.on('player_joined', (username) => {
  console.log(`${username} joined the room`)
})
```

**Payload:** `username: string` (name only)

---

### `player_left` — Server → rest of the room

Notifies the room that a player has left (disconnected).

```js
socket.on('player_left', (username) => {
  console.log(`${username} left the room`)
})
```

**Payload:** `username: string` (name only)

> ⚠️ **Known limitation:** since this only identifies by `username`, two players with the same name in the same room can't be distinguished by this event. This should stop being an issue once real authentication (OAuth) guarantees unique names.

---

### `disconnect` — native Socket.IO event

Automatically triggered by the client when the connection is lost (tab closed, network drop, server restart). Doesn't need to be emitted manually — only listened to if the frontend wants to react:

```js
socket.on('disconnect', (reason) => {
  console.log('disconnected:', reason)
})
```

> **Note:** there is currently no session recovery. If the socket drops and reconnects, the server treats it as a **brand-new player** (new `socketID`, may land in a different room, loses `hp`/position). Reconnection with state preservation is planned for Sprint 3.

---

## Minimal integration example

```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

socket.on('connect', () => {
  socket.emit('join', { id: currentUser.id, username: currentUser.name })
})

socket.on('joined', ({ roomId, player }) => {
  // save roomId and player in frontend state
})

socket.on('player_joined', (username) => {
  // update the room's player list
})

socket.on('player_left', (username) => {
  // remove player from the list
})

socket.on('disconnect', (reason) => {
  // show a "reconnecting" state in the UI
})
```

---

## Not yet implemented (planned)

These events **don't exist** on the server yet — don't use them in production, they're listed here for alignment on what's coming next:

| Event | Direction | Expected payload | Description |
|---|---|---|---|
| `move` | Frontend → Server | `{ x, y }` or `{ dx, dy }` | Movement intent — server validates and broadcasts |
| `player_moved` | Server → room | `{ socketId, x, y }` | Validated position, broadcast to everyone |
| `attack` | Frontend → Server | `{ targetId }` | Attack intent — damage calculated server-side |
| `player_attacked` | Server → room | `{ attackerId, targetId, damage, targetHpAfter }` | Attack result |
| `player_died` | Server → room | `{ socketId }` | HP reached 0 |

---

*Last updated: based on `onConnection.js` after adjusting `player_left` to return `username` (consistent with `player_joined`).*
