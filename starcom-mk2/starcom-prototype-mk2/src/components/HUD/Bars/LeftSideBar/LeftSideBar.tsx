import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <nav className="sidebar">
      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/settings">User Settings</Link>
        </li>
        <li>
          <Link to="/filters">Filter Settings</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;