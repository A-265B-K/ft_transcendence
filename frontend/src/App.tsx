import GameCanvas from './pages/GameCanvas';
import Menu from './pages/Menu';
import Signup from './pages/SignUp';
import LogIn from './pages/Login';
import GameMenu from './pages/GameMenu';
import Disconnected from './pages/Disconnected';
import { useState, useEffect, useRef, startTransition } from 'react';
import { type JoinedPayload } from './types/game';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PasswordResetRequest from './pages/PasswordResetRequest';
import Settings from './pages/Settings';
import TwoFactorAuth from './pages/TwoFactorAuth';
import TwoFactorSettings from './pages/TwoFactorSettings';
import TwoFactorSetup from './pages/TwoFactorSetup';

import { connectSocket, disconnectSocket, getSocket } from './socket';
import {
    BrowserRouter,
    matchPath,
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
    const inGame = Boolean(matchPath('/game', path));
    const inRoom =
        inGame || Boolean(matchPath('/game-menu/room/:roomId', path));
    const wasInRoom = useRef(inRoom);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);
    const [gameSession, setGameSession] = useState(0);
    const [restoringGame, setRestoringGame] = useState(() =>
        Boolean(sessionStorage.getItem('gameRoomId'))
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
        if (wasInRoom.current && !inRoom) {
            getSocket()?.emit('leave_room');
            sessionStorage.removeItem('gameRoomId');
            setJoinedData(null);
            setRestoringGame(false);
        }
        wasInRoom.current = inRoom;
    }, [inRoom]);

    useEffect(() => {
        if (!user || !inRoom) return;

        const socket = connectSocket();

        const rejoin = () => {
            const roomId = sessionStorage.getItem('gameRoomId');
            if (roomId) socket.emit('join_room', { roomId });
        };

        const handleSessionReplaced = () => {
            console.warn('Room session taken over by another tab');
            navigate('/game-menu');
        };

        socket.io.on('reconnect', rejoin);
        socket.on('session_replaced', handleSessionReplaced);

        return () => {
            socket.io.off('reconnect', rejoin);
            socket.off('session_replaced', handleSessionReplaced);
        };
    }, [user, inRoom, navigate]);

    useEffect(() => {
        if (!user || !inGame) return;

        const roomId = sessionStorage.getItem('gameRoomId');

        if (!roomId) return;

        const socket = connectSocket();

        const handleJoined = (data: JoinedPayload) => {
            if (data.roomId !== roomId) return;

            console.log('Restored game room:', data.roomId);

            setJoinedData(data);
            setGameSession((session) => session + 1);
            setRestoringGame(false);
        };

        const handleJoinError = ({ message }: { message: string }) => {
            console.error('Could not restore game:', message);

            sessionStorage.removeItem('gameRoomId');

            setJoinedData(null);
            setRestoringGame(false);
        };

        socket.on('joined', handleJoined);
        socket.on('join_error', handleJoinError);

        if (!joinedData) socket.emit('join_room', { roomId });

        return () => {
            socket.off('joined', handleJoined);
            socket.off('join_error', handleJoinError);
        };
    }, [user, inGame, joinedData]);

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
                    navigate('/', { replace: true });
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
        disconnectSocket();
        setJoinedData(null);
        setRestoringGame(false);
        sessionStorage.removeItem('gameRoomId');
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
                                setRestoringGame(false);
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
                        <GameCanvas key={gameSession} joinedData={joinedData} />
                    ) : (
                        <Navigate to="/game-menu" />
                    )
                }
            />

            <Route
                path="/settings"
                element={user ? <Settings /> : <Navigate to="/login" replace />}
            />

            <Route
                path="/settings/password-reset"
                element={<PasswordResetRequest />}
            />

            <Route path="/settings/2fa" element={<TwoFactorSettings />} />

            <Route path="/settings/2fa/setup" element={<TwoFactorSetup />} />

            <Route
                path="/verify-2fa"
                element={
                    <TwoFactorAuth
                        onLoginSuccess={(loggedUser) => {
                            setUser(loggedUser);
                            connectSocket();
                            navigate('/game-menu', { replace: true });
                        }}
                    />
                }
            />

            <Route path="/disconnected" element={<Disconnected />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
