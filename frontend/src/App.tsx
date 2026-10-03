import GameCanvas from './pages/GameCanvas';
import Menu from './pages/Menu';
import Signup from './pages/SignUp';
import LogIn from './pages/Login';
import GameMenu from './pages/GameMenu';
import Disconnected from './pages/Disconnected';
import CreateRoom from './pages/CreateRoom';
import Room from './pages/Room';
import JoinRoom from './pages/JoinRoom';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useEffect, useState } from 'react';
import { type JoinedPayload, type LobbyRoom} from './types/game';
import { connectSocket, disconnectSocket} from './socket';
import {
    BrowserRouter,
    useNavigate,
    useLocation,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

type User = {
    id: number;
    username: string;
    email: string;
};

type CreatedRoom = {
    roomId: string;
    room: LobbyRoom;
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
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [createdRoom, setCreatedRoom] = useState<CreatedRoom | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<LobbyRoom | null>(null);
    const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);
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
        if (!user ||
            location.pathname !== '/game' ||
            joinedData
        ) {
            return;
        }

        const roomId = localStorage.getItem('gameRoomId');

        if (!roomId) return;

        const socket = connectSocket();

        const handleJoined = (data: JoinedPayload) => {
            console.log('Restored game room:', data.roomId);

            setJoinedData(data);
        };

        const handleJoinError = ({ message }: { message: string }) => {
            console.error('Could not restore game:', message);

            localStorage.removeItem('gameRoomId');
            setJoinedData(null);
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
    }, [
        user,
        location.pathname,
        joinedData
    ]);

    useEffect(() => {
        if (!user) {
            return;
        }

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

                if (!response.ok) {
                    throw new Error(`Health check failed: ${response.status}`);
                }

                failedChecks = 0;
            } catch (error) {
                failedChecks += 1;

                console.error(
                    `Health check failed ${failedChecks} time(s):`,
                    error
                );

                if (
                    failedChecks >= 3 &&
                    !stopped
                ) {
                    setUser(null);
                    setCreatedRoom(null);
                    setSelectedRoom(null);
                    setJoinedData(null);

                    localStorage.removeItem('gameRoomId');
                    navigate('/disconnected');
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
    }, [user, navigate]);

    async function logout() {
        await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
        });
        setUser(null);
        setCreatedRoom(null);
        setSelectedRoom(null);
        setJoinedData(null);
        localStorage.removeItem('gameRoomId');
        disconnectSocket();
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
                                setCreatedRoom(data);
                                setSelectedRoom(null);
                                setJoinedData(null);
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
                            onJoined={(room) => {
                                setCreatedRoom(null);
                                setSelectedRoom(room);
                                setJoinedData(null);
                                navigate(`/game-menu/room/${room.roomId}`);
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
                            createdRoom={createdRoom}
                            selectedRoom={selectedRoom}
                            joinedData={joinedData}
                            onStartGame={(
                                data
                            ) => {
                                setCreatedRoom(null);
                                setSelectedRoom(null);
                                setJoinedData(data);
                                localStorage.setItem('gameRoomId',data.roomId);
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
                    user && joinedData ? (
                        <GameCanvas
                            joinedData={
                                joinedData
                            }
                        />
                    ) : localStorage.getItem(
                          'gameRoomId'
                      ) ? (
                        <div>
                            Reconnecting to game...
                        </div>
                    ) : (
                        <Navigate to="/game-menu" />
                    )
                }
            />

            <Route
                path="/disconnected"
                element={
                    <Disconnected />
                }
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
}