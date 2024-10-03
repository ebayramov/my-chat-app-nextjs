"use client";

import { useState, useContext } from 'react';
import { AuthContext } from '../layout';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LoginPage() {
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { setLogged, setUsername } = useContext(AuthContext);

  const handleLogin = async () => {
    const res = await fetch('http://localhost:8080/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: localUsername, password, action: 'login' }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setLogged(true);
      setUsername(localUsername);
      router.push('/home');
    } else {
      setErrorMessage(data.message);
    }
  };

  const handleCreateProfile = async () => {
    const res = await fetch('http://localhost:8080/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: localUsername, password, action: 'create' }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setLogged(true);
      setUsername(localUsername);
      router.push('/');
    } else {
      setErrorMessage(data.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCreatingProfile) {
      handleCreateProfile();
    } else {
      handleLogin();
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="login-container p-4 shadow rounded bg-white">
        <h1 className="text-center mb-4">
          {isCreatingProfile ? 'Create Profile' : 'Login'}
        </h1>
        <form onSubmit={handleSubmit} className="mb-3">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          {errorMessage && <p className="text-danger text-center">{errorMessage}</p>}
          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-success">
              {isCreatingProfile ? 'Create Profile' : 'Login'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={() => setIsCreatingProfile(!isCreatingProfile)}
            className="btn btn-link text-decoration-none"
          >
            {isCreatingProfile ? 'Have an account? Login' : 'Create a new profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
