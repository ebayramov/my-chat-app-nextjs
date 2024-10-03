"use client";
import './globals.css';
import { createContext, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Create the context
export const AuthContext = createContext();

export default function RootLayout({ children }) {
  const [logged, setLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [roomAccess, setRoomAccess] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogged = localStorage.getItem('logged');
      const savedUsername = localStorage.getItem('username');
      const savedNotificationCount = localStorage.getItem('notificationCount');
      const savedRoomAccess = localStorage.getItem('roomAccess');

      setLogged(savedLogged === 'true');
      setUsername(savedUsername || '');
      setNotificationCount(savedNotificationCount || 0);
      setRoomAccess(savedRoomAccess ? JSON.parse(savedRoomAccess) : {});
    }
  }, []); // Runs only once when the component is mounted

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('logged', logged);
      localStorage.setItem('username', username);
      localStorage.setItem('notificationCount', notificationCount);
      localStorage.setItem('roomAccess', JSON.stringify(roomAccess));
    }
  }, [logged, username, notificationCount, roomAccess]);

  return (
    <html lang="en">
      <head>
        <title>Chat Application</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body>
        <AuthContext.Provider 
          value={{ logged, setLogged, username, setUsername, notificationCount, setNotificationCount, roomAccess, setRoomAccess }}>
          {children}
        </AuthContext.Provider>
      </body>
    </html>
  );
}
