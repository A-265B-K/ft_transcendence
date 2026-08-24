export type LoginProps = {
	onBack: () => void;
	onLoginSuccess: (user: {
		id: number;
		username: string;
		email: string;
	}) => void;
	onForgotPassword: () => void;
};