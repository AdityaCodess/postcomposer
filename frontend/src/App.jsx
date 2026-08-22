import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Auth/Login';
import Home from './components/Home';       // NEW
import Privacy from './components/Privacy'; // NEW

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Auth Route */}
        <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Route */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;