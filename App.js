import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ClientProfile from './pages/ClientProfile';
import ContractorProfile from './pages/ContractorProfile';
import CreateOffer from './pages/CreateOffer';
import OffersList from './pages/OffersList';
import OfferDetails from './pages/OfferDetails';

// Create auth context
export const AuthContext = createContext(null);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || '{}'),
    isAuthenticated: !!localStorage.getItem('token')
  });

  useEffect(() => {
    // Verify token validity with backend
    const verifyToken = async () => {
      if (authState.token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authState.token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            // Token is invalid, clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthState({
              token: null,
              user: {},
              isAuthenticated: false
            });
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthState({
            token: null,
            user: {},
            isAuthenticated: false
          });
        }
      }
    };

    verifyToken();
  }, [authState.token]);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      token,
      user,
      isAuthenticated: true
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: {},
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={
                authState.isAuthenticated ? 
                  <Navigate to={`/${authState.user.role}-profile`} replace /> :
                  <Login />
              } />
              <Route path="/register" element={
                authState.isAuthenticated ? 
                  <Navigate to={`/${authState.user.role}-profile`} replace /> :
                  <Register />
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/client-profile" element={
                <ProtectedRoute>
                  <ClientProfile />
                </ProtectedRoute>
              } />
              <Route path="/contractor-profile" element={
                <ProtectedRoute>
                  <ContractorProfile />
                </ProtectedRoute>
              } />
              <Route path="/offers" element={<OffersList />} />
              <Route path="/offers/create" element={
                <ProtectedRoute>
                  <CreateOffer />
                </ProtectedRoute>
              } />
              <Route path="/offers/:id" element={<OfferDetails />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

export default App; 