import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/warehouse';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    role: 'admin',
    name: 'Warehouse Manager',
    isActive: true
  },
  {
    id: 'op-1',
    username: 'operator1',
    role: 'operator',
    forkliftId: 'forklift-1',
    name: 'John Smith',
    isActive: true
  },
  {
    id: 'op-2',
    username: 'operator2',
    role: 'operator',
    forkliftId: 'forklift-2',
    name: 'Sarah Johnson',
    isActive: true
  },
  {
    id: 'op-3',
    username: 'operator3',
    role: 'operator',
    forkliftId: 'forklift-3',
    name: 'Mike Davis',
    isActive: true
  },
  {
    id: 'op-4',
    username: 'operator4',
    role: 'operator',
    forkliftId: 'forklift-4',
    name: 'Lisa Wilson',
    isActive: true
  },
  {
    id: 'op-5',
    username: 'operator5',
    role: 'operator',
    forkliftId: 'forklift-5',
    name: 'David Brown',
    isActive: true
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false
  });

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem('warehouse_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false
        });
      } catch (error) {
        localStorage.removeItem('warehouse_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = MOCK_USERS.find(u => u.username === username);
    
    if (user && (password === 'password' || password === 'admin123')) {
      const updatedUser = { ...user, lastLogin: Date.now() };
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        loading: false
      });
      localStorage.setItem('warehouse_user', JSON.stringify(updatedUser));
      return true;
    }
    
    setAuthState(prev => ({ ...prev, loading: false }));
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
    localStorage.removeItem('warehouse_user');
  };

  const switchUser = (userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      const updatedUser = { ...user, lastLogin: Date.now() };
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        loading: false
      });
      localStorage.setItem('warehouse_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      switchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
