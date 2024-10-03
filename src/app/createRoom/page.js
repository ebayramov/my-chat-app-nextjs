"use client";

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { AuthContext } from '../layout';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const { username, setRoomAccess } = useContext(AuthContext);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [socket, setSocket] = useState(null);  // Initialize socket state

  // Initialize socket.io client only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const socketConnection = io('http://localhost:4000');
      setSocket(socketConnection);

      return () => {
        // Cleanup on component unmount
        if (socketConnection) {
          socketConnection.disconnect();
        }
      };
    }
  }, []);  // Empty dependency array ensures this runs only on mount

  const createRoom = () => {
    const roomData = { roomName, isPrivate, password, pin, createdBy: username };
    if (socket) {
      socket.emit('createRoom', roomData);
      socket.on('roomCreated', (newRoom) => {
        if (isPrivate) {
          setRoomAccess((prevAccess) => ({ ...prevAccess, [newRoom.id]: true }))
        }
        router.push(`/room/${newRoom.id}`);
      });
    }
  };

  const handleCreateRoomClick = () => {
    if (isPrivate && (!password || !pin)) {
      setErrorMessage('Password and PIN are required to create a private room!');
      return;
    }
    if (isPrivate && pin.length !== 4) {
      setErrorMessage('PIN must be exactly 4 digits!');
      return;
    }
    setErrorMessage('');
    createRoom();
  };

  const handlePinChange = (e) => {
    const input = e.target.value;
    if (/^\d{0,4}$/.test(input)) {
      setPin(input);
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h1 className="title">Create a Room</h1>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room Name"
          className="input"
        />
        <div className="radio-container">
          <label className="radio-label">
            <input
              type="radio"
              value={1}
              checked={!isPrivate}
              onChange={() => { setIsPrivate(false); setErrorMessage(''); }}
              className="radio-input"
            />
            Public Room
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value={0}
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="radio-input"
            />
            Private Room
          </label>
        </div>

        {isPrivate && (
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input"
            />
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="4-digit PIN"
              maxLength="4"
              className="input"
            />
          </div>
        )}

        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <button onClick={handleCreateRoomClick} className="create-button">
          Create Room
        </button>
        <button id="home-page-button" onClick={() => router.push('/home')}>
          Home Page
        </button>
      </div>
    </div>
  );
}
