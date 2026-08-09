import { type MenuProps } from "./MenuProps";

export default function Menu({
    onCreateAccount,
    onLogin,
}: MenuProps) {
    return (
        <div
            className="Menu-container"
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                padding: "24px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "28px",
                    borderRadius: "24px",
                    background: "rgba(8, 16, 22, 0.78)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                    color: "#f4f7fb",
                    backdropFilter: "blur(14px)",
                    textAlign: "left",
                }}
            >
                <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                    Ready to play?
                </h2>

                <p
                    style={{
                        marginTop: 0,
                        marginBottom: "20px",
                        color: "rgba(244,247,251,0.7)",
                    }}
                >
                    Create an account or sign in.
                </p>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCreateAccount}
                    >
                        Create account
                    </button>

                    <button
                        type="button"
                        onClick={onLogin}
                    >
                        Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}