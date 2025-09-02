import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EchoAIHubPage from './pages/EchoAIHubPage';
import GoalsHubPage from './pages/GoalsHubPage';
import MindMapPage from './pages/MindMapPage';
import Navigation from './components/Navigation';

const AppRoutes = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/echo-ai-hub" element={<EchoAIHubPage />} />
        <Route path="/goals-hub" element={<GoalsHubPage />} />
        <Route path="/mind-map" element={<MindMapPage />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
