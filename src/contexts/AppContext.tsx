
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Job, MonthlyCost, WorkItem, Task } from '@/types';
import { firestoreService } from '../services/firestore';

interface WorkRoutine {
  desiredSalary: number;
  workDaysPerMonth: number;
  workHoursPerDay: number;
  valuePerDay: number;
  valuePerHour: number;
}

interface AppContextType {
  // Jobs
  jobs: Job[];
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  loading: boolean;
  refreshJobs: () => Promise<void>;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  
  // Monthly Costs
  monthlyCosts: MonthlyCost[];
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt'>) => Promise<void>;
  updateMonthlyCost: (id: string, cost: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  
  // Work Items
  workItems: WorkItem[];
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkItem: (id: string, item: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Work Routine
  workRoutine: WorkRoutine | null;
  updateWorkRoutine: (routine: Partial<WorkRoutine>) => Promise<void>;
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
  const { user, userData, refreshUserData } = useAuth();
  
  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);
  const [profit, setProfit] = useState(0);
  
  // Other entities state
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  
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

      // Load jobs
      const userJobs = userData.jobs || [];
      setJobs(userJobs);

      // Load monthly costs
      const userMonthlyCosts = userData.expenses || [];
      setMonthlyCosts(userMonthlyCosts);

      // Load work items
      const userWorkItems = userData.equipments || [];
      setWorkItems(userWorkItems);

      // Load tasks (mock data for now)
      const userTasks: Task[] = [];
      setTasks(userTasks);

      // Load work routine
      if (userData.routine) {
        const routine: WorkRoutine = {
          desiredSalary: userData.routine.desiredSalary || 0,
          workDaysPerMonth: userData.routine.workDays || 22,
          workHoursPerDay: userData.routine.dailyHours || 8,
          valuePerDay: userData.routine.dalilyValue || 0,
          valuePerHour: userData.routine.valuePerHour || 0
        };
        setWorkRoutine(routine);
      }

      // Calculate totals
      let revenue = 0;
      let costs = 0;
      userJobs.forEach(job => {
        revenue += job.serviceValue || 0;
        costs += job.totalCosts || 0;
      });

      setTotalRevenue(revenue);
      setTotalCosts(costs);
      setProfit(revenue - costs);

      console.log('✅ Dados carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Jobs methods
  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return;
    
    const newJob: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.id
    };

    const updatedJobs = [...jobs, newJob];
    await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
    setJobs(updatedJobs);
    await refreshUserData();
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    if (!user?.id) return;
    
    const updatedJobs = jobs.map(job => 
      job.id === id ? { ...job, ...jobData, updatedAt: new Date().toISOString() } : job
    );
    
    await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
    setJobs(updatedJobs);
    await refreshUserData();
  };

  const deleteJob = async (id: string) => {
    if (!user?.id) return;
    
    const updatedJobs = jobs.filter(job => job.id !== id);
    await firestoreService.updateUserField(user.id, 'jobs', updatedJobs);
    setJobs(updatedJobs);
    await refreshUserData();
  };

  // Monthly Costs methods
  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id' | 'createdAt'>) => {
    if (!user?.id) return;
    
    const newCost: MonthlyCost = {
      ...costData,
      id: `cost_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id
    };

    const updatedCosts = [...monthlyCosts, newCost];
    await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
    setMonthlyCosts(updatedCosts);
    await refreshUserData();
  };

  const updateMonthlyCost = async (id: string, costData: Partial<MonthlyCost>) => {
    if (!user?.id) return;
    
    const updatedCosts = monthlyCosts.map(cost => 
      cost.id === id ? { ...cost, ...costData } : cost
    );
    
    await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
    setMonthlyCosts(updatedCosts);
    await refreshUserData();
  };

  const deleteMonthlyCost = async (id: string) => {
    if (!user?.id) return;
    
    const updatedCosts = monthlyCosts.filter(cost => cost.id !== id);
    await firestoreService.updateUserField(user.id, 'expenses', updatedCosts);
    setMonthlyCosts(updatedCosts);
    await refreshUserData();
  };

  // Work Items methods
  const addWorkItem = async (itemData: Omit<WorkItem, 'id' | 'createdAt'>) => {
    if (!user?.id) return;
    
    const newItem: WorkItem = {
      ...itemData,
      id: `item_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id
    };

    const updatedItems = [...workItems, newItem];
    await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
    setWorkItems(updatedItems);
    await refreshUserData();
  };

  const updateWorkItem = async (id: string, itemData: Partial<WorkItem>) => {
    if (!user?.id) return;
    
    const updatedItems = workItems.map(item => 
      item.id === id ? { ...item, ...itemData } : item
    );
    
    await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
    setWorkItems(updatedItems);
    await refreshUserData();
  };

  const deleteWorkItem = async (id: string) => {
    if (!user?.id) return;
    
    const updatedItems = workItems.filter(item => item.id !== id);
    await firestoreService.updateUserField(user.id, 'equipments', updatedItems);
    setWorkItems(updatedItems);
    await refreshUserData();
  };

  // Tasks methods
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user?.id) return;
    
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: user.id
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    // Note: Tasks are not stored in Firestore yet, keeping in memory for now
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...taskData } : task
    );
    setTasks(updatedTasks);
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
  };

  // Work Routine methods
  const updateWorkRoutine = async (routineData: Partial<WorkRoutine>) => {
    if (!user?.id || !workRoutine) return;
    
    const updatedRoutine = { ...workRoutine, ...routineData };
    
    await firestoreService.updateUserField(user.id, 'routine', {
      desiredSalary: updatedRoutine.desiredSalary,
      workDays: updatedRoutine.workDaysPerMonth,
      dailyHours: updatedRoutine.workHoursPerDay,
      dalilyValue: updatedRoutine.valuePerDay,
      valuePerHour: updatedRoutine.valuePerHour
    });
    
    setWorkRoutine(updatedRoutine);
    await refreshUserData();
  };

  const refreshJobs = async () => {
    console.log('🔄 Recarregando jobs...');
    if (user?.id) {
      await refreshUserData();
    }
  };

  return (
    <AppContext.Provider value={{
      // Jobs
      jobs,
      totalRevenue,
      totalCosts,
      profit,
      loading,
      refreshJobs,
      addJob,
      updateJob,
      deleteJob,
      
      // Monthly Costs
      monthlyCosts,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      
      // Work Items
      workItems,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      
      // Tasks
      tasks,
      addTask,
      updateTask,
      deleteTask,
      
      // Work Routine
      workRoutine,
      updateWorkRoutine
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
