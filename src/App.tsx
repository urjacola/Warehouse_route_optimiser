import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { useWarehouseSimulation } from './hooks/useWarehouseSimulation';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { loginForklift, logoutForklift } = useWarehouseSimulation();

  useEffect(() => {
    if (user && user.role === 'operator' && user.forkliftId) {
      loginForklift(user.forkliftId);
    }
    
    return () => {
      if (user && user.role === 'operator' && user.forkliftId) {
        logoutForklift(user.forkliftId);
      }
    };
  }, [user, loginForklift, logoutForklift]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'operator') {
    return <OperatorDashboard />;
  }

  return <LoginPage />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
