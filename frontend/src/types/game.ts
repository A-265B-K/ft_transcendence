export interface PlayerData {
    userId: string;
    socketId: string;
    username: string;
    slot: number;
    hp: number;
    x: number;
    y: number;
}

export interface SpawnPoint {
    playerSlot: number;
    x: number;
    y: number;
}

export interface CastleZone {
    playerSlot: number;
    x: number;
    y: number;
    radius?: number;
}

export interface Obstacle {
    type: string;
    x: number;
    y: number;
    radius: number;
    blocksMovement: boolean;
}

export interface ResourceSpawn {
    type: "wood" | "stone";
    x: number;
    y: number;
}

export interface MovementData {
    [key: string]: unknown;
}

export interface MapData {
    mapId: string;
    width: number;
    height: number;
    spawnPoints: SpawnPoint[];
    castleZones: CastleZone[];
    obstacles: Obstacle[];
    resourceSpawns: ResourceSpawn[];
    movement: MovementData;
}

export interface JoinedPayload {
    roomId: string;
    player: PlayerData;
    players: PlayerData[];
    map: MapData;
}