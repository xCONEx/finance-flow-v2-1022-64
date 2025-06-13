
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Job, MonthlyCost, WorkItem, WorkRoutine, Task } from '../types';

export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  logobase64: string;
  imageuser?: string;
  phone?: string;
  company?: string;
  personalInfo?: {
    phone?: string;
    company?: string;
  };
  companyId?: string;
  companyName?: string;
  equipments: any[];
  expenses: any[];
  jobs: any[];
  routine?: {
    dailyHours: number;
    dalilyValue: number;
    desiredSalary: number;
    workDays: number;
  };
  userType?: 'admin' | 'enterprise' | 'individual';
  subscription?: 'free' | 'premium' | 'enterprise';
  banned?: boolean;
}

export const firestoreService = {
  getUserData: async (uid: string): Promise<FirestoreUser | null> => {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        return docSnap.data() as FirestoreUser;
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  createUser: async (user: FirestoreUser): Promise<void> => {
    try {
      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, user);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  saveUserData: async (uid: string, data: Partial<FirestoreUser>): Promise<void> => {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, data);
    } catch (error) {
      console.error("Error saving user data:", error);
      throw error;
    }
  },

  updateUserField: async (uid: string, field: string, value: any): Promise<void> => {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, { [field]: value });
    } catch (error) {
      console.error("Error updating user field:", error);
      throw error;
    }
  },

  getAllUsers: async (): Promise<any[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getAnalyticsData: async (): Promise<any> => {
    try {
      const users = await this.getAllUsers();
      const totalUsers = users?.length || 0;
      const adminUsers = users?.filter(u => u?.userType === 'admin')?.length || 0;
      const enterpriseUsers = users?.filter(u => u?.userType === 'enterprise')?.length || 0;
      const individualUsers = users?.filter(u => u?.userType === 'individual')?.length || 0;

      return {
        overview: {
          totalUsers,
          totalAgencias: 0,
          totalRevenue: 0,
          activeUsers: totalUsers
        },
        userStats: {
          userTypes: {
            admin: adminUsers,
            individual: individualUsers,
            company_owner: enterpriseUsers,
            employee: 0
          },
          conversionRate: 0
        },
        businessStats: {
          totalJobs: 0,
          approvedJobs: 0,
          pendingJobs: 0,
          averageJobValue: 0,
          jobApprovalRate: 0
        },
        recentActivity: {
          newUsersThisMonth: 0,
          newCompaniesThisMonth: 0,
          newJobsThisMonth: 0
        },
        productivity: {
          taskCompletionRate: 0,
          averageTasksPerUser: 0
        }
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  },

  // Jobs
  getUserJobs: async (userId: string): Promise<Job[]> => {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || '',
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || ''
      })) as Job[];
    } catch (error) {
      console.error('Error fetching user jobs:', error);
      throw error;
    }
  },

  // Monthly Costs
  getUserMonthlyCosts: async (userId: string): Promise<MonthlyCost[]> => {
    try {
      const q = query(
        collection(db, 'monthlyCosts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || ''
      })) as MonthlyCost[];
    } catch (error) {
      console.error('Error fetching user monthly costs:', error);
      throw error;
    }
  },

  // Work Items
  getUserWorkItems: async (userId: string): Promise<WorkItem[]> => {
    try {
      const q = query(
        collection(db, 'workItems'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || ''
      })) as WorkItem[];
    } catch (error) {
      console.error('Error fetching user work items:', error);
      throw error;
    }
  },

  // Work Routine
  getUserWorkRoutine: async (userId: string): Promise<WorkRoutine | null> => {
    try {
      const q = query(
        collection(db, 'workRoutine'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          userId: doc.id,
          ...doc.data()
        } as WorkRoutine;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user work routine:', error);
      return null;
    }
  },

  // Tasks
  getUserTasks: async (userId: string): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || ''
      })) as Task[];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  },

  saveUserTask: async (task: Task): Promise<void> => {
    try {
      const taskDocRef = doc(db, 'tasks', task.id);
      await setDoc(taskDocRef, task);
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  },

  updateUserTask: async (task: Task): Promise<void> => {
    try {
      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, task as any);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  deleteUserTask: async (taskId: string): Promise<void> => {
    try {
      const taskDocRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskDocRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }
};
