export type GameMenuProps = {
    user: {
        id: number;
        username: string;
        email: string;
    };

    onLogout: () => void;
};
