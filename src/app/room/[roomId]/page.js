"use client";

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../layout';
import io from 'socket.io-client';
import './style.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function RoomPage() {
    const { roomId } = useParams();
    const router = useRouter();
    const { username, roomAccess, setRoomAccess } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSendButtonEnabled, setIsSendButtonEnabled] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [isPublic, setIsPublic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [roomPassword, setRoomPassword] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const messagesEndRef = useRef(null);
    const [socket, setSocket] = useState(null); // Store socket instance in state

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const socketConnection = io('http://localhost:4000'); // Initialize socket on client side only
            setSocket(socketConnection);
            
            socketConnection.on('message', (msg) => {
                setMessages((prevMessages) => [...prevMessages, msg]);
            });

            return () => {
                socketConnection.disconnect();
            };
        }
    }, []);

    useEffect(() => {
        async function fetchRoomName() {
            try {
                const res = await fetch(`http://localhost:8080/roomName.php?id=${roomId}`);
                const data = await res.json();
                if (data.error) {
                    router.push('/error');
                } else {
                    setSelectedRoom(data.name);
                    setIsPublic(data.isPublic);
                    setRoomPassword(data.password);
                    if (data.isPublic === 0 && !roomAccess[roomId]) {
                        router.push('/joinRoom');
                    } else {
                        setLoading(false);
                        socket?.emit('joinRoom', { roomId });
                    }
                }
            } catch (error) {
                router.push('/error');
            }
        }

        async function fetchMessages() {
            try {
                const res = await fetch(`http://localhost:8080/messages.php?room_id=${roomId}`);
                const data = await res.json();
                setMessages(data.messages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }

        fetchRoomName();
        fetchMessages();

        return () => {
            socket?.off('message');
        };
    }, [roomId, roomAccess, router, socket]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                const activeElement = document.activeElement;

                if (event.shiftKey) {
                    setMessage((prevMessage) => prevMessage + '\n');
                } else {
                    if (activeElement.id === 'messagingInput') {
                        sendMessage();
                    } else if (activeElement.id === 'inviteInput' && selectedUser) {
                        handleInvite();
                    }
                }
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [selectedUser, message]);

    useEffect(() => {
        setIsSendButtonEnabled(message.trim() !== '' || image !== null);
    }, [message, image]);

    useEffect(() => {
        // Scroll to the bottom whenever messages change
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const sendMessage = async () => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('roomId', roomId);
        formData.append('message', message);

        if (image) {
            formData.append('image', image);
        }

        try {
            const res = await fetch('http://localhost:8080/messages.php', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.status === 'success') {
                socket.emit('message', { id: data.id, user: username, message, room_id: roomId, image_url: data.image_url });
            } else {
                console.error('Failed to send message:', data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }

        setImage(null);
        setImagePreview('');
        setMessage('');
    };

    const handleInvite = async () => {
        if (selectedUser) {
            const invitationData = { roomId, roomName: selectedRoom, invitedBy: username };
            if (isPublic === 0) {
                invitationData.password = roomPassword; // Encrypt this on server-side before sending
            }
            socket?.emit('sendInvitation', { ...invitationData, invitedUser: selectedUser });

            socket?.on('invitationStatus', ({ status, message }) => {
                if (status === 'success') {
                    alert(message);  // Display success message
                } else {
                    alert(`Error: ${message}`);  // Display error message
                }
            });

            setSelectedUser('');
            setSearchQuery('');
            setUserResults([]);
        }
    };

    const groupMessagesByDate = (messages) => {
        const groupedMessages = {};
        messages.forEach((msg) => {
            const date = dayjs(msg.created_at).startOf('day').format('YYYY-MM-DD');
            if (!groupedMessages[date]) {
                groupedMessages[date] = [];
            }
            groupedMessages[date].push(msg);
        });
        return groupedMessages;
    };

    const renderMessageGroups = () => {
        const groupedMessages = groupMessagesByDate(messages);
        return Object.keys(groupedMessages).map((date, index) => {
            const dateLabel = dayjs(date).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd',
                sameElse: 'DD/MM/YYYY'
            });

            return (
                <div key={index} className="messageGroup">
                    <div className="dateLabel">{dateLabel}</div>
                    {groupedMessages[date].map((msg, idx) => (
                        <div key={idx} className={`message ${msg.user === username ? 'sent' : 'received'}`}>
                            <p className='messageText'>
                                <strong>{msg.user}</strong>
                                <span dangerouslySetInnerHTML={{ __html: msg.message.replaceAll('\n', '<br>') }} />
                            </p>
                            {msg.image_url && <img src={msg.image_url} alt="sent image" className="image" />}
                            <span className="timeLabel">{dayjs(msg.created_at).format('HH:mm')}</span>
                        </div>
                    ))}
                </div>
            );
        });
    };

    if (loading) {
        return <div></div>;
    }

    return (
        <div id="mainContainer">
            {/* Left side: Messages */}
            <div id="leftContainer">
                <h1 id='room-header'>Chat Room: {selectedRoom}</h1>
                <div className="messages">
                    {renderMessageGroups()}
                    <div ref={messagesEndRef} />
                </div>
                <div id="inputContain">
                    {imagePreview && (
                        <div className="imagePreview">
                            <img src={imagePreview} alt="preview" className="previewImage" />
                        </div>
                    )}

                    <textarea
                        id="messagingInput"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                    />

                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="imageInput"
                        onChange={handleImageChange}
                    />

                    <label htmlFor="imageInput" className="attachmentButton">
                        <i className="fa-solid fa-paperclip"></i>
                    </label>
                    <button onClick={sendMessage} id="send-message" disabled={!isSendButtonEnabled}>Send</button>
                </div>
            </div>

            {/* Right side: Invite Users & Exit */}
            <div className="rightContainer">
                <div>
                    <h3>Invite Users</h3>
                    <input
                        type="text"
                        id="inviteInput" // For targeting the input in the click handler
                        className="searchInput"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search users..."
                    />
                    {userResults.length > 0 && (
                        <ul id="userList">
                            {userResults.map((user) => (
                                <li
                                    key={user.username}
                                    onClick={() => handleUserSelection(user.username)}
                                    className="userListItem"
                                >
                                    {user.username}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button onClick={handleInvite} disabled={!isSendButtonEnabled} className="inviteButton">
                        Send Invitation
                    </button>
                </div>

                <button onClick={handleExitRoom} className="exitButton">Exit Room</button>
            </div>

            {showDeleteModal && (
                <div id="modal-deletion">
                    <div id="modalContent">
                        <p>Are you sure you want to delete this message?</p>
                        <button onClick={confirmDelete} id="confirmButton">Yes</button>
                        <button onClick={() => setShowDeleteModal(false)} id="cancelButton">No</button>
                    </div>
                </div>
            )}
        </div>
    );
}
