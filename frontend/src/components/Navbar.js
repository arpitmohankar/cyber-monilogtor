import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar({ theme, setTheme }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="logo">🛡️</span>
          <span className="brand-text">Cyber Monitor</span>
        </div>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/logs" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">📋</span> Logs
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">⚙️</span> Settings
            </NavLink>
          </li>
        </ul>
        <button 
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
