type User = {
    id: number;
    username: string;
    email: string;
};

export type TwoFactorAuthProps = {
    onLoginSuccess: (user: User) => void;
};
