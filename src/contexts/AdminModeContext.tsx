import React, { createContext, useContext, useEffect, useState } from 'react';

interface AdminModeContextType {
  isTestMode: boolean;
  toggleTestMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export const AdminModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isTestMode');
    return saved === 'true';
  });

  const toggleTestMode = () => {
    setIsTestMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('isTestMode', String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    // If we want to force a reload when mode changes to ensure all hooks refetch with correct filters
    // This is optional but recommended as per plan
  }, [isTestMode]);

  return (
    <AdminModeContext.Provider value={{ isTestMode, toggleTestMode }}>
      {children}
    </AdminModeContext.Provider>
  );
};

export const useAdminMode = () => {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider');
  }
  return context;
};
