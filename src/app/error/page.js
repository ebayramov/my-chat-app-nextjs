"use client";
import { useRouter } from 'next/navigation';
import './style.css';

export default function ErrorPage() {
    const router = useRouter();

    const handleHomeClick = () => {
        router.push('/home');
    };

    return (
      <div id="error-page-container">
        <h1 id="error-page-title">Room Not Found</h1>
        <p id="error-text-message">The room you are trying to access does not exist or has been deleted.</p>
        <button id="error-home-button" onClick={handleHomeClick}>Go to Home</button>
      </div>
    );
}
