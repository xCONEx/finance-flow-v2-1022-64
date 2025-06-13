
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestore';
import { Job, MonthlyCost, WorkItem, WorkRoutine, Task } from '../types';

interface AppContextType {
  jobs: Job[];
  monthlyCosts: MonthlyCost[];
  workItems: WorkItem[];
  workRoutine: WorkRoutine | null;
  tasks: Task[];
  loading: boolean;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  addMonthlyCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt'>) => Promise<void>;
  updateMonthlyCost: (id: string, updates: Partial<MonthlyCost>) => Promise<void>;
  deleteMonthlyCost: (id: string) => Promise<void>;
  addWorkItem: (item: Omit<WorkItem, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkItem: (id: string, updates: Partial<WorkItem>) => Promise<void>;
  deleteWorkItem: (id: string) => Promise<void>;
  updateWorkRoutine: (routine: Omit<WorkRoutine, 'userId'>) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [workRoutine, setWorkRoutine] = useState<WorkRoutine | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      console.log('🔄 Carregando dados do AppContext...');
      
      const [jobsData, costsData, itemsData, routineData, tasksData] = await Promise.all([
        firestoreService.getUserJobs(user.id),
        firestoreService.getUserMonthlyCosts(user.id),
        firestoreService.getUserWorkItems(user.id),
        firestoreService.getUserWorkRoutine(user.id),
        firestoreService.getUserTasks(user.id)
      ]);

      setJobs(jobsData);
      setMonthlyCosts(costsData);
      setWorkItems(itemsData);
      setWorkRoutine(routineData);
      setTasks(tasksData);

      console.log('✅ Dados carregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user, userData]);

  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    const newJob: Job = {
      ...jobData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firestoreService.saveUserData(user.id, {
      ...userData!,
      jobs: [...(userData?.jobs || []), newJob]
    });

    setJobs(prev => [...prev, newJob]);
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    if (!user || !userData) return;

    const updatedJobs = userData.jobs.map((job: Job) => 
      job.id === id ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
    );

    await firestoreService.saveUserData(user.id, {
      ...userData,
      jobs: updatedJobs
    });

    setJobs(updatedJobs);
  };

  const deleteJob = async (id: string) => {
    if (!user || !userData) return;

    const filteredJobs = userData.jobs.filter((job: Job) => job.id !== id);

    await firestoreService.saveUserData(user.id, {
      ...userData,
      jobs: filteredJobs
    });

    setJobs(filteredJobs);
  };

  const addMonthlyCost = async (costData: Omit<MonthlyCost, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const newCost: MonthlyCost = {
      ...costData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    await firestoreService.saveUserData(user.id, {
      ...userData!,
      expenses: [...(userData?.expenses || []), newCost]
    });

    setMonthlyCosts(prev => [...prev, newCost]);
  };

  const updateMonthlyCost = async (id: string, updates: Partial<MonthlyCost>) => {
    if (!user || !userData) return;

    const updatedCosts = userData.expenses.map((cost: MonthlyCost) => 
      cost.id === id ? { ...cost, ...updates } : cost
    );

    await firestoreService.saveUserData(user.id, {
      ...userData,
      expenses: updatedCosts
    });

    setMonthlyCosts(updatedCosts);
  };

  const deleteMonthlyCost = async (id: string) => {
    if (!user || !userData) return;

    const filteredCosts = userData.expenses.filter((cost: MonthlyCost) => cost.id !== id);

    await firestoreService.saveUserData(user.id, {
      ...userData,
      expenses: filteredCosts
    });

    setMonthlyCosts(filteredCosts);
  };

  const addWorkItem = async (itemData: Omit<WorkItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const newItem: WorkItem = {
      ...itemData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    await firestoreService.saveUserData(user.id, {
      ...userData!,
      equipments: [...(userData?.equipments || []), newItem]
    });

    setWorkItems(prev => [...prev, newItem]);
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>) => {
    if (!user || !userData) return;

    const updatedItems = userData.equipments.map((item: WorkItem) => 
      item.id === id ? { ...item, ...updates } : item
    );

    await firestoreService.saveUserData(user.id, {
      ...userData,
      equipments: updatedItems
    });

    setWorkItems(updatedItems);
  };

  const deleteWorkItem = async (id: string) => {
    if (!user || !userData) return;

    const filteredItems = userData.equipments.filter((item: WorkItem) => item.id !== id);

    await firestoreService.saveUserData(user.id, {
      ...userData,
      equipments: filteredItems
    });

    setWorkItems(filteredItems);
  };

  const updateWorkRoutine = async (routineData: Omit<WorkRoutine, 'userId'>) => {
    if (!user) return;

    const newRoutine: WorkRoutine = {
      ...routineData,
      userId: user.id
    };

    await firestoreService.saveUserData(user.id, {
      ...userData!,
      routine: {
        dailyHours: routineData.workHoursPerDay,
        dalilyValue: routineData.valuePerDay,
        desiredSalary: routineData.desiredSalary,
        workDays: routineData.workDaysPerMonth
      }
    });

    setWorkRoutine(newRoutine);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    // Save to Firestore using task service
    try {
      await firestoreService.saveUserTask(newTask);
    } catch (error) {
      console.error('❌ Erro ao salvar tarefa:', error);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);

    // Update in Firestore
    try {
      const updatedTask = updatedTasks.find(task => task.id === id);
      if (updatedTask) {
        await firestoreService.updateUserTask(updatedTask);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (id: string) => {
    const filteredTasks = tasks.filter(task => task.id !== id);
    setTasks(filteredTasks);

    // Delete from Firestore
    try {
      await firestoreService.deleteUserTask(id);
    } catch (error) {
      console.error('❌ Erro ao deletar tarefa:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      jobs,
      monthlyCosts,
      workItems,
      workRoutine,
      tasks,
      loading,
      addJob,
      updateJob,
      deleteJob,
      addMonthlyCost,
      updateMonthlyCost,
      deleteMonthlyCost,
      addWorkItem,
      updateWorkItem,
      deleteWorkItem,
      updateWorkRoutine,
      addTask,
      updateTask,
      deleteTask,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
