import  { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import UploadUI from './components/UploadUI';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');

    if (userId && userEmail) {
      setIsAuthenticated(true);
      setUser({ userId: userId, email: userEmail });
      setCurrentPage('upload');
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage('upload');
  };

  const handleRegister = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage('upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('login');
  };

  if (!isAuthenticated) {
    return (
      <div>
        {currentPage === 'login' && (
          <Login
            onLogin={handleLogin}
            switchToRegister={() => setCurrentPage('register')}
          />
        )}
        {currentPage === 'register' && (
          <Register
            onRegister={handleRegister}
            switchToLogin={() => setCurrentPage('login')}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: 'white',
        padding: '15px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 className="project-name" style={{ margin: 0 }}>Vaultaire</h2>
          <div>
            <span style={{ marginRight: '15px' }}>Welcome, {user?.email}</span>
            <button onClick={handleLogout} style={{
              background: '#ff4444',
              padding: '5px 15px'
            }}>
              Logout
            </button>
          </div>
        </div>
      </div>
      <UploadUI
        projectName="Vaultaire"
        userId={user?.userId}
      />
    </div>
  );
}

export default App;