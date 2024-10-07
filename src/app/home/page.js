"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from './../layout';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap'; // Import Bootstrap Components
import './style.css';

export default function HomePage() {
    const router = useRouter();
    const { logged, setLogged, username, notificationCount, setNotificationCount, setRoomAccess } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [invitations, setInvitations] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false); // State to toggle notification dropdown

    useEffect(() => {
        if (!logged) {
            router.push('/login');
        } else {
            setLoading(false);
            fetchInvitations();
        }
    }, [logged, router]);

    const fetchInvitations = async () => {
        try {
            const res = await fetch(`http://localhost:8080/fetchInvitations.php?username=${username}`);
            const data = await res.json();
            if (data.status === 'success') {
                setInvitations(data.invitations);
                setNotificationCount(data.invitations.filter(inv => inv.active === 1).length);
            }
        } catch (error) {
            console.error('Error fetching invitations:', error);
        }
    };

    const handleLogout = () => {
        setLogged(false);
        localStorage.removeItem('logged');
        router.push('/login');
    };

    const acceptInvitation = async (roomId, roomName, password, invitationId) => {
        const res = await fetch(`http://localhost:8080/updateInvitation.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: invitationId }),
        });
        const data = await res.json();
        if (data.status === 'success' && notificationCount > 0) {
            setNotificationCount((prevCount) => prevCount - 1);
        }

        if (password) {
            setRoomAccess((prevAccess) => ({ ...prevAccess, [roomId]: true }));
            router.push(`/room/${roomId}?invitation=${encodeURIComponent(password)}`);
        } else {
            router.push(`/room/${roomId}`);
        }
    };

    const deleteInvitation = async (invitationId) => {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation && invitation.active === 1 && notificationCount > 0) {
            setNotificationCount((prevCount) => prevCount - 1);
        }
        try {
            const res = await fetch(`http://localhost:8080/deleteInvitation.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: invitationId }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchInvitations();
            }
        } catch (error) {
            console.error('Error deleting invitation:', error);
        }
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    if (loading) {
        return null;
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar bg="success" variant="dark" expand="lg" id="navbar">
                <Container id="container">
                    <Navbar.Brand href="/home">Chat Application</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="/joinRoom">Join Room</Nav.Link>
                            <Nav.Link href="/createRoom">Create Room</Nav.Link>
                        </Nav>

                        <Dropdown align="end" show={showNotifications} onToggle={toggleNotifications}>
                            <Dropdown.Toggle variant="link" id="notification-toggle">
                                <i className="fa-solid fa-bell" style={{ color: 'white', fontSize: '24px' }}></i>
                                {notificationCount > 0 && <Badge bg="danger" pill>{notificationCount}</Badge>}
                            </Dropdown.Toggle>

                            <Dropdown.Menu id="notification-dropdown-menu">

                                <Dropdown.Header>Invitations</Dropdown.Header>
                                {invitations.length > 0 ? (
                                    invitations.map((invitation) => (
                                        <div key={invitation.id} className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="flex-grow-1">
                                                <p className="m-0">
                                                    <strong>{invitation.invitedBy}</strong> invited you to <strong>{invitation.roomName}</strong>
                                                </p>
                                            </div>
                                            <div className="d-flex">
                                                <Button
                                                    size="sm"
                                                    variant={invitation.active ? "primary" : "secondary"}
                                                    onClick={() => acceptInvitation(invitation.roomId, invitation.roomName, invitation.password, invitation.id)}
                                                    disabled={!invitation.active}
                                                    className="me-2"
                                                >
                                                    {invitation.active ? 'Accept' : 'Accepted'}
                                                </Button>
                                                {invitation.active ? <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => deleteInvitation(invitation.id)}
                                                    id="btn-danger"
                                                >
                                                    Decline
                                                </Button> : ""}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center">No invitations</p>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>

                        <Button onClick={handleLogout} variant="danger" className="ms-3" id="btn-danger2">
                            Logout
                        </Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center py-4" id="container2">
                <h2 className="mb-4" id="title">Welcome to Chat Application, {username}!</h2>
                <p>
                    This is a real-time messaging application that allows you to join rooms, invite others, and have private or group conversations.
                </p>
                <p>
                    You can join existing rooms, create new rooms, or manage your invitations from the notification bell above.
                    Stay connected and start chatting with your friends, colleagues, or team members in real time!
                </p>

                <p>
                    With our advanced notifications system, you’ll never miss an invitation to a chat room. Check your notifications regularly to join new rooms or accept invitations.
                </p>

                <div className="my-4">
                    <h3>Get started by creating or joining a room</h3>
                    <div className="d-flex justify-content-center">
                        <Button href="/joinRoom" variant="primary" className="mx-2" id="btn-primary">
                            Join Room
                        </Button>
                        <Button href="/createRoom" variant="success" className="mx-2" id="btn-success">
                            Create Room
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
}
