"use client";

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '../../layout';
import io from 'socket.io-client';
import './style.css'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const socket = io('http://localhost:4000');
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
                        socket.emit('joinRoom', { roomId });
                    }
                }
            } catch (error) {
                router.push('/error');
            }
        }

        async function fetchMessages() {
            const res = await fetch(`http://localhost:8080/messages.php?room_id=${roomId}`);
            const data = await res.json();
            setMessages(data.messages);
        }

        fetchRoomName();
        fetchMessages();

        socket.on('message', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        return () => {
            socket.off('message');
        };
    }, [roomId, roomAccess, router]);

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

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
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

    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearchQuery(value); // Update the input value

        if (value) {
            try {
                const res = await fetch(`http://localhost:8080/searchUsers.php?query=${value}`);
                const data = await res.json();
                setUserResults(data.users);
            } catch (error) {
                console.error('Error searching users:', error);
            }
        } else {
            setUserResults([]);
        }

        setSelectedUser('');
        setIsSendButtonEnabled(false);
    };


    const handleUserSelection = (username) => {
        setSelectedUser(username);
        setSearchQuery(username);
        setUserResults([]);
        setIsSendButtonEnabled(true);
    };


    useEffect(() => {
        if (selectedUser && searchQuery !== selectedUser) {
            setIsSendButtonEnabled(false);
        }
    }, [searchQuery, selectedUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const inviteInput = document.getElementById('inviteInput');
            const userList = document.getElementById('userList');
            if (inviteInput && !inviteInput.contains(event.target) && userList && !userList.contains(event.target)) {
                setUserResults([]);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);


    const handleInvite = async () => {
        if (selectedUser) {
            const invitationData = { roomId, roomName: selectedRoom, invitedBy: username };
            if (isPublic === 0) {
                invitationData.password = roomPassword; // Encrypt this on server-side before sending
            }
            socket.emit('sendInvitation', { ...invitationData, invitedUser: selectedUser });

            socket.on('invitationStatus', ({ status, message }) => {
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Only image files are allowed.');
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                alert('The image size cannot exceed 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            setImage(file);
        }
    };

    const handleExitRoom = () => {
        setRoomAccess((prevAccess) => {
            const newAccess = { ...prevAccess };
            delete newAccess[roomId];
            return newAccess;
        });
        router.push('/');
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

    const handleDeleteClick = (msg) => {
        setMessageToDelete(msg);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`http://localhost:8080/deleteMessage.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: messageToDelete.id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setMessages(messages.filter((m) => m.id !== messageToDelete.id));
                setShowDeleteModal(false);
                setMessageToDelete(null);
            } else {
                console.error('Failed to delete message:', data.message);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
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
                            <p className='messageText'><strong>{msg.user}</strong>  <span dangerouslySetInnerHTML={{ __html: msg.message.replaceAll('\n', '<br>') }} /> </p>
                            {msg.image_url && <img src={msg.image_url} alt="sent image" className="image" />}
                            {msg.user === username && (
                                <span className="deleteIcon" onClick={() => handleDeleteClick(msg)}><i className="fas fa-trash-alt"></i></span>
                            )}
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


