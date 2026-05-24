import React, { createContext, useContext, useState, useEffect } from 'react';
import { Domain, ProfileConfig } from '../types';
import { PROFILES, getProfile, ALL_PROFILE_IDS } from '../lib/profiles';

interface WorkspaceContextProps {
  domain: Domain;
  profile: ProfileConfig;
  isProfileSelected: boolean;
  setDomain: (domain: Domain) => void;
  getLabel: (key: string) => string;
  getVisibleModules: () => string[];
  isModuleVisible: (moduleId: string) => boolean;
  getRequiredFields: (entityType: string) => string[];
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [domain, setDomainState] = useState<Domain>('CEO');
  const [isProfileSelected, setIsProfileSelected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('assistant_os_profile') as Domain;
    if (saved && ALL_PROFILE_IDS.includes(saved)) {
      setDomainState(saved);
      setIsProfileSelected(true);
    }
  }, []);

  const profile = getProfile(domain);

  const setDomain = (newDomain: Domain) => {
    setDomainState(newDomain);
    setIsProfileSelected(true);
    localStorage.setItem('assistant_os_profile', newDomain);
  };

  const getLabel = (key: string) => {
    return profile.labels[key] || key;
  };

  const getVisibleModules = () => {
    return profile.modules;
  };

  const isModuleVisible = (moduleId: string) => {
    return profile.modules.includes(moduleId);
  };

  const getRequiredFields = (entityType: string) => {
    return profile.requiredFields[entityType] || [];
  };

  return (
    <WorkspaceContext.Provider value={{
      domain,
      profile,
      isProfileSelected,
      setDomain,
      getLabel,
      getVisibleModules,
      isModuleVisible,
      getRequiredFields,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
