import GameCanvas from './pages/GameCanvas';
import Menu from './pages/Menu';
import Signup from './pages/SignUp';
import LogIn from './pages/Login';
import GameMenu from './pages/GameMenu';
import Disconnected from './pages/Disconnected';
import { useState, useEffect, startTransition } from 'react';
import { type JoinedPayload } from './types/game';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { connectSocket, disconnectSocket } from './socket';
import {
    BrowserRouter,
    useNavigate,
    Routes,
    Route,
    Navigate,
    useLocation
} from 'react-router-dom';
import CreateRoom from './pages/CreateRoom';
import Room from './pages/Room';
import JoinRoom from './pages/JoinRoom';

type User = {
    id: number;
    username: string;
    email: string;
};

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

function AppContent() {
    const navigate = useNavigate();
    const path = useLocation().pathname;
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);
    const [restoringGame, setRestoringGame] = useState(() =>
        Boolean(localStorage.getItem('gameRoomId'))
    );

    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch('/api/auth/me', {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();

                    console.log('Restored session:', data.user);

                    setUser(data.user);
                }
            } catch (error) {
                console.log('Session check failed', error);
            } finally {
                setLoading(false);
            }
        }
        checkSession();
    }, []);

    useEffect(() => {
        if (!user) return;

        const roomId = localStorage.getItem('gameRoomId');

        if (!roomId) return;

        const socket = connectSocket();

        const handleJoined = (data: JoinedPayload) => {
            console.log('Restored game room:', data.roomId);

            setJoinedData(data);
            setRestoringGame(false);
        };

        const handleJoinError = ({ message }: { message: string }) => {
            console.error('Could not restore game:', message);

            localStorage.removeItem('gameRoomId');

            setRestoringGame(false);
        };

        socket.once('joined', handleJoined);

        socket.once('join_error', handleJoinError);

        const joinRoom = () => {
            socket.emit('join_room', { roomId });
        };

        if (socket.connected) {
            joinRoom();
        } else {
            socket.once('connect', joinRoom);
        }

        return () => {
            socket.off('joined', handleJoined);
            socket.off('join_error', handleJoinError);
            socket.off('connect', joinRoom);
        };
    }, [user]);

    useEffect(() => {
        if (!user && path !== '/disconnected') return;

        let stopped = false;
        let failedChecks = 0;

        async function checkServer() {
            const controller = new AbortController();

            // Allow requests up to 2 seconds
            const timeout = window.setTimeout(() => {
                controller.abort();
            }, 2000);

            try {
                const response = await fetch('/api/ping', {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });

                if (!response.ok)
                    throw new Error(`Health check failed: ${response.status}`);
                else if (response.ok && !stopped && path === '/disconnected')
                    reconnect();
                failedChecks = 0;
            } catch (error) {
                failedChecks += 1;

                console.error(
                    `Health check failed ${failedChecks} time(s):`,
                    error
                );

                // Three failures × two seconds between checks
                if (failedChecks >= 3 && !stopped && path !== '/disconnected') {
                    startTransition(() => {
                        setUser(null);
                        setJoinedData(null);
                        navigate('/disconnected');
                    });
                    disconnectSocket();
                }
            } finally {
                window.clearTimeout(timeout);
            }
            async function reconnect() {
                const session = await fetch('/api/auth/me', {
                    credentials: 'include',
                    signal: controller.signal
                });
                if (session.ok) {
                    const { user } = await session.json();
                    startTransition(() => {
                        setUser(user);
                        navigate('/game-menu', { replace: true });
                    });
                } else navigate('/game-menu', { replace: true });
            }
        }

        checkServer();

        const interval = window.setInterval(checkServer, 2000);

        return () => {
            stopped = true;
            window.clearInterval(interval);
        };
    }, [user, navigate, path]);

    async function logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
        navigate('/');
    }

    if (loading) {
        return <div>Checking session...</div>;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Menu
                        onCreateAccount={() => {
                            navigate('/signup');
                        }}
                        onLogin={() => {
                            navigate('/login');
                        }}
                    />
                }
            />

            <Route
                path="/signup"
                element={
                    <Signup
                        onBack={() => {
                            navigate('/');
                        }}
                    />
                }
            />

            <Route
                path="/login"
                element={
                    <LogIn
                        onBack={() => {
                            navigate('/');
                        }}
                        onLoginSuccess={(loggedUser) => {
                            setUser(loggedUser);
                            navigate('/game-menu');
                        }}
                        onForgotPassword={() => {
                            navigate('/forgot-password');
                        }}
                    />
                }
            />

            <Route
                path="/forgot-password"
                element={
                    <ForgotPassword
                        onBack={() => {
                            navigate('/login');
                        }}
                    />
                }
            />

            <Route
                path="/reset-password"
                element={
                    <ResetPassword
                        onBack={() => {
                            navigate('/login');
                        }}
                    />
                }
            />

            <Route
                path="/game-menu"
                element={
                    user ? (
                        <GameMenu user={user} onLogout={logout} />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/game-menu/create-room"
                element={
                    user ? (
                        <CreateRoom
                            onBack={() => {
                                navigate('/game-menu');
                            }}
                            onCreated={(data) => {
                                setJoinedData(data);
                                navigate(`/game-menu/room/${data.roomId}`);
                            }}
                        />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/game-menu/join-room"
                element={
                    user ? (
                        <JoinRoom
                            onBack={() => {
                                navigate('/game-menu');
                            }}
                            onJoined={(data) => {
                                setJoinedData(data);
                                navigate(`/game-menu/room/${data.roomId}`);
                            }}
                        />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/game-menu/room/:roomId"
                element={
                    user ? (
                        <Room
                            joinedData={joinedData}
                            onStartGame={(data) => {
                                setJoinedData(data);
                                navigate('/game');
                            }}
                        />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/game"
                element={
                    restoringGame ? (
                        <div>Reconnecting to game...</div>
                    ) : user && joinedData ? (
                        <GameCanvas joinedData={joinedData} />
                    ) : (
                        <Navigate to="/game-menu" />
                    )
                }
            />

            <Route path="/disconnected" element={<Disconnected />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
