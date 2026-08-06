export interface PlayerData {
    userID: string;
    socketID: string;
    username: string;
    slot: number;
    hp: number;
    x: number;
    y: number;
}

export interface JoinedPayload {
    roomId: string;
    player: PlayerData;
    players: PlayerData[];

    map: unknown;
}