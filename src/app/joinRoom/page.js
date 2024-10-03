"use client";

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { AuthContext } from '../layout';
import './style.css'

const socket = io('http://localhost:4000');

export default function JoinRoomPage() {
  const { setRoomAccess } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [privateRooms, setPrivateRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isPrivate, setIsPrivate] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isPinValid, setIsPinValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchRooms() {
      const res = await fetch('http://localhost:8080/joinRoom.php');
      const data = await res.json();
      setRooms(data.rooms);
      setPrivateRooms(data.rooms.filter(room => room.isPublic == 0));
      setPublicRooms(data.rooms.filter(room => room.isPublic == 1));
    }
    fetchRooms();
  }, []);

  const joinRoom = () => {
    if (!selectedRoom) {
      setErrorMessage('Please select a room to join');
      return;
    }

    if (!isPrivate) {
      const roomData = { roomId: selectedRoom, password };
      socket.emit('joinRoom', roomData);
      socket.on('joinedRoom', (roomId) => {
        router.push(`/room/${roomId}`);
      });
    }
  };

  const handleJoinRoomClick = async () => {
    if (!selectedRoom) {
      setErrorMessage('Please select a room to join');
      return; 
  }

    if (isPrivate && !password) {
      setErrorMessage('Password is required to enter the room!');
      return;
    }

    const res = await fetch('http://localhost:8080/joinRoom.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId: selectedRoom, password }),
    });

    const data = await res.json();

    if (isPrivate) {
      const selectedPrivateRoom = privateRooms.find(room => room.id === selectedRoom);
      if (selectedPrivateRoom && data.status !== 'success') {
        setErrorMessage('Password is not correct');
        return;
      } else {
        setRoomAccess((prevAccess) => ({ ...prevAccess, [selectedRoom]: true }));
        router.push(`/room/${data.roomId}`);
      }
    }
    setErrorMessage('');
    joinRoom();
  };

  const handleForgotPasswordClick = () => {
    if (isPrivateRoomSelected()) {
      setIsForgotPassword(true);
    }
  };

  const handlePinChange = (e) => {
    const input = e.target.value;
    if (/^\d{0,4}$/.test(input)) {
      setPin(input);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setModalMessage('PIN must be exactly 4 digits!');
      return;
    }

    const selectedPrivateRoom = privateRooms.find(room => room.id === selectedRoom);
    if (selectedPrivateRoom && selectedPrivateRoom.pin === pin) {
      setIsPinValid(true);
      setModalMessage('');
    } else {
      setModalMessage('PIN is not correct');
      setIsPinValid(false);
    }
  };

  const handleNewPasswordSubmit = () => {
    if (!newPassword || !confirmPassword) {
      setModalMessage('Please fill in all password fields!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalMessage('Passwords do not match!');
      return;
    }

    const roomData = { roomId: selectedRoom, newPassword };
    socket.emit('changePassword', roomData);

    socket.on('passwordChanged', (response) => {
      if (response.status === 'success') {
        setPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setIsForgotPassword(false);
        setErrorMessage('Password has been changed successfully!');
      } else {
        setErrorMessage('Failed to change the password.');
      }
    });
  };

  const isPrivateRoomSelected = () => {
    return privateRooms.some(room => room.id === selectedRoom);
  };

  return (
    <div className="page-container">
      {!isForgotPassword &&
        <>
          <div className="form-container">
            <h1 className='htitle'>Join a Room</h1>
            <div className="room-toggle-buttons">
              <button className="public-room" onClick={() => setIsPrivate(false)}>Public Rooms</button>
              <button className="private-room" onClick={() => setIsPrivate(true)}>Private Rooms</button>
            </div>
            {isPrivate !== null && (
              <div>
                <select className="room-select" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
                  <option value="">Select a room</option>
                  {(isPrivate ? privateRooms : publicRooms).map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                {isPrivate && (
                  <div>
                    <input
                      type="password"
                      className="password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                    />
                    <button
                      className="forgot-password"
                      onClick={handleForgotPasswordClick}
                      disabled={!isPrivateRoomSelected()}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button className="join-room-button" onClick={handleJoinRoomClick}>Join Room</button>
                {/* Home Button */}
                <button className="home-page-button" onClick={() => router.push('/home')}>
                  Home Page
                </button>
              </div>
            )}
          </div>
        </>
      }

      {isForgotPassword && (
        <>
          <div className="modal">
            <div className="modal-content">
              <h2>Reset Password</h2>
              <input
                type="text"
                className="pin-input"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter 4-digit PIN"
                maxLength="4"
              />
              <button className="submit-pin" onClick={handlePinSubmit}>Submit PIN</button>
              {modalMessage && <p className="error-message">{modalMessage}</p>}
              {isPinValid && (
                <div>
                  <input
                    type="password"
                    className="password-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                  />
                  <input
                    type="password"
                    className="password-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                  />
                  <button className="submit-pin" onClick={handleNewPasswordSubmit}>Submit New Password</button>
                </div>
              )}
              <button className="close-modal" onClick={() => setIsForgotPassword(false)}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
