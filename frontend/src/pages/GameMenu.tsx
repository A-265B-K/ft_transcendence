import { connectSocket } from "../socket";
import { useEffect, useState } from "react";
import type { GameMenuProps } from "./gameMenuProps";
import type { JoinedPayload } from "../types/game";

type LobbyRoom = {
  roomId: string;
  name: string;
  code?: string;
  playerCount: number;
  maxPlayers: number;
};

export default function GameMenu({
  user,
  onStartGame,
  onLogout,
}: GameMenuProps) {
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);

  const [createdRoom, setCreatedRoom] = useState<LobbyRoom | null>(null);

  const [joinedData, setJoinedData] = useState<JoinedPayload | null>(null);

  const [copied, setCopied] = useState(false);

  const createdRoomId = createdRoom?.roomId;

  useEffect(() => {
    if (!createdRoomId) return;

    const socket = connectSocket();

    const handleRoomUpdate = (data: {
      roomId: string;
      playerCount: number;
      maxPlayers: number;
    }) => {
      if (data.roomId !== createdRoomId) return;

      setCreatedRoom((current) => {
        if (!current) return current;

        return {
          ...current,
          playerCount: data.playerCount,
          maxPlayers: data.maxPlayers,
        };
      });
    };

    socket.on("room_update", handleRoomUpdate);

    return () => {
      socket.off("room_update", handleRoomUpdate);
    };
  }, [createdRoomId]);

  function createRoom() {
    if (loading) return;

    const name = roomName.trim();

    if (!name) {
      setError("Enter a room name.");
      return;
    }

    setLoading(true);
    setError("");

    const socket = connectSocket();

    socket.once("joined", (data) => {
      console.log("Created and joined room:", data);

      setJoinedData(data);
      setCreatedRoom(data.room);
      setLoading(false);
      setShowCreateRoom(false);
      setRoomName("");
    });

    socket.once("join_error", ({ message }) => {
      setError(message);
      setLoading(false);
    });

    socket.emit("create_room", {
      name,
    });
  }

  function joinRoom() {
    if (loading) return;

    setError("");

    const socket = connectSocket();

    socket.once("rooms_list", (roomList: LobbyRoom[]) => {
      console.log("Available rooms:", roomList);

      setRooms(roomList);
      setShowRooms(true);
    });

    socket.once("join_error", ({ message }) => {
      setError(message);
    });

    socket.emit("get_rooms");
  }

  function joinSelectedRoom(roomId: string) {
    if (loading) return;

    setLoading(true);
    setError("");

    const socket = connectSocket();

    socket.once("joined", (data) => {
      console.log("Joined room:", data);
      onStartGame(data);
    });

    socket.once("join_error", ({ message }) => {
      setError(message);
      setLoading(false);
    });

    socket.emit("join_room", {
      roomId,
    });
  }

  function joinWithCode() {
    if (loading) return;

    const code = roomCode.trim().toUpperCase();

    if (!code) {
      setError("Enter a room code.");
      return;
    }

    setLoading(true);
    setError("");

    const socket = connectSocket();

    socket.once("room_info", (room) => {
      console.log("Room found:", room);

      setLoading(false);
      setRooms([room]);
      setShowRooms(true);
    });

    socket.once("join_error", ({ message }) => {
      setError(message);
      setLoading(false);
    });

    socket.emit("get_room_by_code", {
      code,
    });
  }

  function startCreatedRoom() {
    if (!joinedData) return;

    onStartGame(joinedData);
  }

  async function copyRoomCode() {
    if (!createdRoom?.code) return;

    try {
      await navigator.clipboard.writeText(createdRoom.code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Could not copy the room code.");
    }
  }

  function closeCreateRoom() {
    setShowCreateRoom(false);
    setRoomName("");
    setError("");
  }

  function closeRooms() {
    setShowRooms(false);
    setRooms([]);
    setError("");
  }

  function leaveCreatedRoom() {
    setCreatedRoom(null);
    setJoinedData(null);
    setError("");
  }

  if (createdRoom) {
    return (
      <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
          <h2 className="mb-2 text-2xl font-bold">Room Created</h2>

          <p className="mb-6 text-white/50">Share the code with your friends</p>

          <div className="rounded-2xl border border-[#ffcf5c]/30 bg-[#ffcf5c]/10 p-5">
            <p className="text-sm text-white/50">Room name</p>

            <p className="mb-5 text-xl font-bold">{createdRoom.name}</p>

            <p className="text-sm text-white/50">Room code</p>

            <p className="my-2 text-4xl font-bold tracking-[0.25em] text-[#ffcf5c]">
              {createdRoom.code}
            </p>

            <button
              type="button"
              onClick={copyRoomCode}
              className="mt-2 rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-lg font-bold">
                {createdRoom.playerCount} / {createdRoom.maxPlayers}
              </p>

              <p className="text-sm text-white/50">players</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/40">
            Waiting for your friends to join...
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={startCreatedRoom}
              disabled={!joinedData}
              className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
            >
              Start Game
            </button>

            <button
              type="button"
              onClick={leaveCreatedRoom}
              className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-linear-to-b from-[#10212a] to-[#081016] text-[#f4f7fb]">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#081016]/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <h2 className="mb-2 text-2xl font-bold">Welcome {user.username}</h2>

        <p className="mb-6 text-white/60">Game Lobby</p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {showCreateRoom ? (
          <div className="grid gap-3">
            <h3 className="text-lg font-bold">Create Room</h3>

            <input
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Room name"
              maxLength={30}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-[#ffcf5c] disabled:opacity-50"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={createRoom}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#ffcf5c] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>

              <button
                type="button"
                onClick={closeCreateRoom}
                disabled={loading}
                className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : showRooms ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Available Rooms</h3>

              <button
                type="button"
                onClick={joinRoom}
                disabled={loading}
                className="text-sm text-white/50 transition hover:text-white"
              >
                Refresh
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6">
                <p className="text-sm text-white/50">No rooms available.</p>

                <p className="mt-1 text-xs text-white/30">
                  Create a room and invite your friends.
                </p>
              </div>
            ) : (
              <div className="grid max-h-80 gap-2 overflow-y-auto">
                {rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="min-w-0 text-left">
                      <p className="truncate font-bold">{room.name}</p>

                      <p className="text-sm text-white/50">
                        {room.playerCount} / {room.maxPlayers} players
                      </p>

                      {room.code && (
                        <p className="mt-1 text-xs text-white/30">
                          Code: {room.code}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => joinSelectedRoom(room.roomId)}
                      disabled={loading || room.playerCount >= room.maxPlayers}
                      className="ml-3 rounded-xl bg-[#ffcf5c] px-4 py-2 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-40"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={closeRooms}
              disabled={loading}
              className="rounded-xl border border-white/15 px-4 py-3 transition hover:bg-white/10 disabled:opacity-50"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateRoom(true);
                setError("");
              }}
              disabled={loading}
              className="rounded-xl bg-linear-to-r from-[#ffcf5c] to-[#ff9f43] px-4 py-3 font-bold text-[#10212a] transition hover:brightness-110 disabled:opacity-50"
            >
              Create Room
            </button>

            <button
              type="button"
              onClick={joinRoom}
              disabled={loading}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10 disabled:opacity-50"
            >
              Join Room
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
                placeholder="Room code"
                maxLength={6}
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center uppercase outline-none placeholder:text-white/30 focus:border-[#ffcf5c] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={joinWithCode}
                disabled={loading}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-bold transition hover:bg-white/10 disabled:opacity-50"
              >
                Join
              </button>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={loading}
              className="mt-3 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[#f4f7fb] transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
