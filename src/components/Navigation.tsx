import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/echo-ai-hub">EchoAI Hub</Link></li>
        <li><Link to="/goals-hub">Goals Hub</Link></li>
        <li><Link to="/mind-map">Mind Map</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation;
