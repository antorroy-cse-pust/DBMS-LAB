// import React, { createContext, useContext, useState, useEffect } from 'react';
// import api from '../services/api';

// const AuthContext = createContext(null);
// export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [settings, setSettings] = useState(null);
//   const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

//   useEffect(() => {
//     // Fetch settings first — no token needed (public endpoint)
//     fetchSettings();
//     // Then check if user is logged in
//     const token = localStorage.getItem('token');
//     if (token) {
//       api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       fetchMe();
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (darkMode) document.documentElement.classList.add('dark');
//     else document.documentElement.classList.remove('dark');
//     localStorage.setItem('darkMode', darkMode);
//   }, [darkMode]);

//   const fetchMe = async () => {
//     try {
//       const res = await api.get('/api/auth/me');
//       setUser(res.data.data);
//     } catch {
//       localStorage.removeItem('token');
//       delete api.defaults.headers.common['Authorization'];
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSettings = async () => {
//     try {
//       const res = await api.get('/api/settings');
//       setSettings(res.data.data);
//     } catch {
//       // silently ignore — settings not critical for app to work
//     }
//   };

//   const login = async (email, password) => {
//     const res = await api.post('/api/auth/login', { email, password });
//     const { user: userData, token } = res.data.data;
//     localStorage.setItem('token', token);
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     setUser(userData);
//     return userData;
//   };

//   const register = async (formData) => {
//     const res = await api.post('/api/auth/register', formData);
//     const { user: userData, token } = res.data.data;
//     localStorage.setItem('token', token);
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     setUser(userData);
//     return userData;
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     delete api.defaults.headers.common['Authorization'];
//     setUser(null);
//   };

//   const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

//   const updateSettings = (newSettings) => setSettings(newSettings);

//   const toggleDarkMode = () => setDarkMode(prev => !prev);

//   return (
//     <AuthContext.Provider value={{
//       user, loading, darkMode, settings,
//       login, register, logout, updateUser, updateSettings, toggleDarkMode
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };



import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    // Fetch settings first — no token needed (public endpoint)
    fetchSettings();
    // Then check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data.data);
    } catch {
      // silently ignore — settings not critical for app to work
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { user: userData, token } = res.data.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/api/auth/register', formData);
    const { user: userData, token } = res.data.data;
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  const updateSettings = (newSettings) => setSettings(newSettings);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <AuthContext.Provider value={{
      user, loading, darkMode, settings,
      login, register, logout, updateUser, updateSettings, toggleDarkMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};