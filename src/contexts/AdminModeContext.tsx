"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type SimulatedUserType = 'engineer' | 'hardware' | null;

interface AdminModeContextType {
  isTestMode: boolean;
  toggleTestMode: () => void;
  simulatedUserType: SimulatedUserType;
  setSimulatedUserType: (type: SimulatedUserType) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export const AdminModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isTestMode');
    return saved === 'true';
  });

  const [simulatedUserType, setSimulatedUserType] = useState<SimulatedUserType>(() => {
    const saved = localStorage.getItem('simulatedUserType');
    return (saved as SimulatedUserType) || 'engineer';
  });

  const toggleTestMode = () => {
    setIsTestMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('isTestMode', String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    localStorage.setItem('simulatedUserType', simulatedUserType || '');
  }, [simulatedUserType]);

  return (
    <AdminModeContext.Provider value={{ isTestMode, toggleTestMode, simulatedUserType, setSimulatedUserType }}>
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