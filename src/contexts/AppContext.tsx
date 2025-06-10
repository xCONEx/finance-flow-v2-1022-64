import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Job } from '@/types';

interface AppContextType {
  jobs: Job[];
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  loading: boolean;
  refreshJobs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData, companyData, refreshUserData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      loadUserData();
    }
  }, [userData]);

  const loadUserData = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      console.log('📊 Carregando dados do usuário...');

      // Calcular valuePerHour se não existir
      let valuePerHour = userData.routine.valuePerHour;
      if (!valuePerHour && userData.routine.desiredSalary && userData.routine.workDays && userData.routine.dailyHours) {
        valuePerHour = userData.routine.desiredSalary / (userData.routine.workDays * userData.routine.dailyHours);
      }

      // Carregar jobs do usuário
      const userJobs = userData.jobs || [];
      setJobs(userJobs);
      console.log(`✅ ${userJobs.length} jobs carregados`);

      // Calcular totais
      let revenue = 0;
      let costs = 0;
      userJobs.forEach(job => {
        revenue += job.serviceValue;
        costs += job.totalCosts;
      });

      setTotalRevenue(revenue);
      setTotalCosts(costs);
      setProfit(revenue - costs);

      console.log('💰 Totais calculados:', { revenue, costs, profit });
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    console.log('🔄 Recarregando jobs...');
    if (user?.id) {
      await refreshUserData();
    }
  };

  return (
    <AppContext.Provider value={{
      jobs,
      totalRevenue,
      totalCosts,
      profit,
      loading,
      refreshJobs
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
