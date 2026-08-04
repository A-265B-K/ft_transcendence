// mapGenerator.js
import { randomUUID } from 'crypto'
import { MAP_WIDTH, MAP_HEIGHT, CASTLE_RADIUS, MIN_DIST_CASTLE } from "../constants.ts"


function generateSpawnAndCastleData(maxPlayers) {
  const minDistBetweenCastles = MIN_DIST_CASTLE 

  const castleZones = []
  let attempts = 0
  const maxAttempts = maxPlayers * 100

  while (castleZones.length < maxPlayers && attempts < maxAttempts) {
    attempts++
    const pos = randomPos()

    const tooClose = castleZones.some(
      (c) => distance(pos, c) < minDistBetweenCastles
    )

    if (tooClose) continue

    castleZones.push({
      playerSlot: castleZones.length + 1,
      x: pos.x,
      y: pos.y,
      radius: CASTLE_RADIUS,
    })
  }

  if (castleZones.length < maxPlayers) {
    console.warn(
  		`Could only place ${castleZones.length}/${maxPlayers} castles — map too small or minDistBetweenCastles too high`
	)
  }

  const spawnPoints = castleZones.map((c) => ({
    playerSlot: c.playerSlot,
    x: c.x,
    y: c.y,
  }))

  return { spawnPoints, castleZones }
}

function randomPos() {
  return {
    x: Math.floor(Math.random() * MAP_WIDTH),
    y: Math.floor(Math.random() * MAP_HEIGHT),
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// Garante que a posição não cai em cima de castelo nem muito perto de outro objeto já colocado
function isValidPosition(pos, castleZones, placedObjects, minDistFromCastle, minDistFromOthers) {
  for (const castle of castleZones) {
    if (distance(pos, castle) < castle.radius + minDistFromCastle) {
      return false
    }
  }

  for (const obj of placedObjects) {
    if (distance(pos, obj) < minDistFromOthers) {
      return false
    }
  }

  return true
}

function generateObstacles(castleZones, count = 15) {
  const obstacles = []
  const types = [
    { type: 'rock', radius: 4 },
    { type: 'tree', radius: 2 },
  ]

  let attempts = 0
  while (obstacles.length < count && attempts < count * 20) {
    attempts++
    const pos = randomPos()

    if (!isValidPosition(pos, castleZones, obstacles, 5, 4)) continue

    const template = types[Math.floor(Math.random() * types.length)]
    obstacles.push({
      type: template.type,
      x: pos.x,
      y: pos.y,
      radius: template.radius,
      blocksMovement: true,
    })
  }

  return obstacles
}

function generateResourceSpawns(castleZones, obstacles, count = 20) {
  const resources = []
  const types = [
    { type: 'wood', amount: 100, respawnTime: 30 },
    { type: 'stone', amount: 100, respawnTime: 45 },
  ]

  const occupied = [...obstacles]
  let attempts = 0

  while (resources.length < count && attempts < count * 20) {
    attempts++
    const pos = randomPos()

    if (!isValidPosition(pos, castleZones, occupied, 6, 5)) continue

    const template = types[Math.floor(Math.random() * types.length)]
    const resource = {
      id: `${template.type}_${resources.length + 1}`,
      type: template.type,
      x: pos.x,
      y: pos.y,
      amount: template.amount,
      respawnTime: template.respawnTime,
    }

    resources.push(resource)
    occupied.push(resource)
  }

  return resources
}

function generateMap(maxPlayers) {
  const { spawnPoints, castleZones } = generateSpawnAndCastleData(maxPlayers)
  const obstacles = generateObstacles(castleZones)
  const resourceSpawns = generateResourceSpawns(castleZones, obstacles)

  return {
    mapId: randomUUID(),
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawnPoints,
    castleZones,
    obstacles,
    resourceSpawns,
    movement: {
      playerSpeed: 5,
      boundaries: { minX: 0, maxX: MAP_WIDTH, minY: 0, maxY: MAP_HEIGHT },
    },
  }
}

export { generateMap }