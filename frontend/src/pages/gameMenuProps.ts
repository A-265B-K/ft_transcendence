import { type JoinedPayload } from "../types/game";

export type GameMenuProps = {
    user: {
        id: number;
        username: string;
        email: string;
    };

    onLogout: () => void;
    onStartGame: (data: JoinedPayload) => void;
};