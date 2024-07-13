// AboutPopup.js

import React from 'react';
import './AboutPopup.css'; // Import the CSS file for styling

function AboutPopup({ onClose }) {
  return (
    <div className="about-popup-container">
      <div className="about-popup">
        <h2>About Starcom App 🚀</h2>
        <p>Welcome to Starcom App, a cutting-edge React web application designed to streamline your OSINT (Open Source Intelligence) operations. Our platform offers a powerful and intuitive command and control interface for global OSINT activities.</p>
        <p>Starcom App provides a seamless experience for intelligence professionals and analysts, enabling you to gather and analyze data from various sources with ease and efficiency.</p>
        <p>Key Features:</p>
        <ul>
            <li>Global Reach: Access OSINT data from around the world 🌍</li>
            <li>User-Friendly Interface: Intuitive design for ease of use 🖥️</li>
            <li>Data Collection: Gather information from diverse sources 📚</li>
            <li>Data Analysis: Tools to analyze and make sense of data 📊</li>
            <li>Security: Ensuring the utmost privacy and protection of your operations 🔒</li>
        </ul>
        <p>Explore the endless possibilities of Starcom App and enhance your OSINT capabilities today. Join our community of intelligence professionals and stay connected with us via Discord 🎮 and GitHub 🐙 to receive updates, share feedback, and collaborate on improvements.</p>
        <p>Thank you for choosing Starcom App for your OSINT needs! 🙌</p>
        <div className="about-button">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default AboutPopup;
