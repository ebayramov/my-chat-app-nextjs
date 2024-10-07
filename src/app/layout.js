"use client";
import './globals.css';
import { createContext, useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Create the context
export const AuthContext = createContext();

export default function RootLayout({ children }) {
  const [logged, setLogged] = useState(() => {
    const savedLogged = localStorage.getItem('logged');
    return savedLogged === 'true' ? true : false;
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  const [notificationCount, setNotificationCount] = useState(() => {
    return localStorage.getItem('notificationCount') || 0;
  });

  const [roomAccess, setRoomAccess] = useState(() => {
    const savedAccess = localStorage.getItem('roomAccess');
    return savedAccess ? JSON.parse(savedAccess) : {};
  });

  useEffect(() => {
    localStorage.setItem('logged', logged);
    localStorage.setItem('username', username);
    localStorage.setItem('notificationCount', notificationCount);
    localStorage.setItem('roomAccess', JSON.stringify(roomAccess));
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
        <AuthContext.Provider value={{ logged, setLogged, username, setUsername, notificationCount, setNotificationCount, roomAccess, setRoomAccess }}>
          {children}
        </AuthContext.Provider>
      </body>
    </html>
  );
}
