import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
    apiKey: "AIzaSyAIO4Qo-kuobCIpRh-XTye5Fs_-9uZmzlY",
    authDomain: "financeflow-e0fae.firebaseapp.com",
    projectId: "financeflow-e0fae",
    storageBucket: "financeflow-e0fae.firebasestorage.app",
    messagingSenderId: "970984329138",
    appId: "1:970984329138:web:429a185b8bab1971991eab"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

export interface FirestoreUser {
  uid: string;
  email: string;
  name?: string;
  photoURL?: string;
  logobase64: string;
  equipments: any[];
  expenses: any[];
  jobs: any[];
  routine: {
    dailyHours: number;
    dalilyValue: number;
    desiredSalary: number;
    workDays: number;
    valuePerHour?: number;
  };
  userType: 'individual' | 'company_owner' | 'company_colab' | 'admin';
  phone?: string;
  company?: string;
  imageuser?: string;
  personalInfo?: {
    phone?: string;
    company?: string;
  };
  subscription?: string | {
    plan: string;
    status: string;
  };
  banned?: boolean;
  createdAt?: string;
}

export const firestoreService = {
  async getUserData(uid: string): Promise<FirestoreUser> {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        return userDocSnap.data() as FirestoreUser;
      } else {
        console.log("No such document!");
        return {
          uid: '',
          email: '',
          logobase64: '',
          equipments: [],
          expenses: [],
          jobs: [],
          routine: {
            dailyHours: 8,
            dalilyValue: 0,
            desiredSalary: 0,
            workDays: 22
          },
          userType: 'individual'
        };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },

  async createUser(userData: FirestoreUser): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', userData.uid);
      await setDoc(userDocRef, userData);
      console.log("Document written with ID: ", userData.uid);
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  async updateUserType(uid: string, userType: 'individual' | 'company_owner' | 'company_colab' | 'admin'): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, { userType: userType });
      console.log(`User ${uid} updated to type: ${userType}`);
    } catch (error) {
      console.error("Error updating user type: ", error);
      throw error;
    }
  },

  async updateUserField(uid: string, field: string, value: any): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, { [field]: value });
      console.log(`User ${uid} updated field ${field}`);
    } catch (error) {
      console.error(`Error updating user ${uid} field ${field}: `, error);
      throw error;
    }
  },

  async getAllCompanies(): Promise<any[]> {
    try {
      const companiesCollection = collection(db, 'companies');
      const companiesSnapshot = await getDocs(companiesCollection);
      return companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching companies: ", error);
      throw error;
    }
  },

  async getAllUsers(): Promise<any[]> {
    try {
      const usersCollection = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersCollection);
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching users: ", error);
      throw error;
    }
  },

  async banUser(userId: string, banned: boolean): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', userId);
      await updateDoc(userDocRef, { banned });
      console.log(`User ${userId} ${banned ? 'banned' : 'unbanned'}`);
    } catch (error) {
      console.error("Error updating user ban status: ", error);
      throw error;
    }
  },

  async updateUserSubscription(userId: string, subscription: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', userId);
      await updateDoc(userDocRef, { subscription });
      console.log(`User ${userId} subscription updated to ${subscription}`);
    } catch (error) {
      console.error("Error updating user subscription: ", error);
      throw error;
    }
  },

  async createCompany(companyData: any): Promise<string> {
    try {
      const companiesCollection = collection(db, 'companies');
      const docRef = await addDoc(companiesCollection, companyData);
      console.log("Company created with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating company: ", error);
      throw error;
    }
  },

  async updateCompanyField(companyId: string, field: string, value: any): Promise<void> {
    try {
      const companyDocRef = doc(db, 'companies', companyId);
      await updateDoc(companyDocRef, { [field]: value });
      console.log(`Company ${companyId} updated field ${field}`);
    } catch (error) {
      console.error(`Error updating company ${companyId} field ${field}: `, error);
      throw error;
    }
  },

  async getCompanyInvites(companyId: string): Promise<any[]> {
    try {
      const invitesQuery = query(
        collection(db, 'invites'),
        where('companyId', '==', companyId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(invitesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching company invites:', error);
      throw error;
    }
  },

  async sendCompanyInvite(inviteData: any): Promise<void> {
    try {
      const invitesCollection = collection(db, 'invites');
      await addDoc(invitesCollection, {
        ...inviteData,
        sentAt: new Date(),
        createdAt: new Date().toISOString()
      });
      console.log('Company invite sent successfully');
    } catch (error) {
      console.error('Error sending company invite:', error);
      throw error;
    }
  },

  async removeCollaboratorFromCompany(companyId: string, memberUid: string): Promise<void> {
    try {
      const companyDocRef = doc(db, 'companies', companyId);
      const companyDoc = await getDoc(companyDocRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        const updatedCollaborators = companyData.collaborators?.filter(
          (collab: any) => collab.uid !== memberUid
        ) || [];
        
        await updateDoc(companyDocRef, { collaborators: updatedCollaborators });
        console.log(`Collaborator ${memberUid} removed from company ${companyId}`);
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  },

  async getKanbanBoard(companyId: string): Promise<any> {
    try {
      const boardDocRef = doc(db, 'kanban_boards', companyId);
      const boardDocSnap = await getDoc(boardDocRef);

      if (boardDocSnap.exists()) {
        return boardDocSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching kanban board:", error);
      throw error;
    }
  },

  async saveKanbanBoard(companyId: string, boardData: any): Promise<void> {
    try {
      const boardDocRef = doc(db, 'kanban_boards', companyId);
      await setDoc(boardDocRef, {
        ...boardData,
        companyId,
        updatedAt: new Date().toISOString()
      });
      console.log(`Kanban board saved for company ${companyId}`);
    } catch (error) {
      console.error("Error saving kanban board:", error);
      throw error;
    }
  },

  async getCompanyData(companyId: string): Promise<any> {
    try {
      const companyDocRef = doc(db, 'companies', companyId);
      const companyDocSnap = await getDoc(companyDocRef);

      if (companyDocSnap.exists()) {
        return companyDocSnap.data();
      } else {
        console.log("No such company!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      throw error;
    }
  },

  async getAnalyticsData(): Promise<any> {
    try {
      // Mock analytics data for now - replace with actual implementation
      const users = await this.getAllUsers();
      const companies = await this.getAllCompanies();
      
      return {
        overview: {
          totalUsers: users.length,
          totalCompanies: companies.length,
          totalRevenue: 0,
          activeUsers: users.filter(u => !u.banned).length
        },
        userStats: {
          conversionRate: 15.5,
          userTypes: {
            individual: users.filter(u => u.userType === 'individual').length,
            company_owner: users.filter(u => u.userType === 'company_owner').length,
            employee: users.filter(u => u.userType === 'company_colab').length,
            admin: users.filter(u => u.userType === 'admin').length
          }
        },
        businessStats: {
          totalJobs: 0,
          approvedJobs: 0,
          pendingJobs: 0,
          averageJobValue: 0,
          jobApprovalRate: 85.2
        },
        recentActivity: {
          newUsersThisMonth: 12,
          newCompaniesThisMonth: 3,
          newJobsThisMonth: 25
        },
        productivity: {
          taskCompletionRate: 78.5,
          averageTasksPerUser: 4.2
        }
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  },

  async updateField(collection: string, docId: string, field: string, value: any) {
    try {
      const docRef = doc(db, collection, docId);
      await updateDoc(docRef, { [field]: value });
      console.log(`✅ Campo ${field} atualizado em ${collection}/${docId}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar campo ${field}:`, error);
      throw error;
    }
  },

  async getUserInvites(userEmail: string) {
    try {
      const invitesQuery = query(
        collection(db, 'invites'),
        where('email', '==', userEmail),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(invitesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      throw error;
    }
  },

  async acceptInvite(inviteId: string, userId: string, companyId: string) {
    try {
      // Atualizar status do convite
      await updateDoc(doc(db, 'invites', inviteId), {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });

      // Atualizar tipo do usuário
      await this.updateUserType(userId, 'company_colab');

      console.log('✅ Convite aceito com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      throw error;
    }
  },

  async updateInviteStatus(inviteId: string, status: string) {
    try {
      await updateDoc(doc(db, 'invites', inviteId), {
        status,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Status do convite atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status do convite:', error);
      throw error;
    }
  },

  async updateUserData(uid: string, userData: Partial<FirestoreUser>): Promise<void> {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, userData);
      console.log(`User ${uid} data updated`);
    } catch (error) {
      console.error("Error updating user data: ", error);
      throw error;
    }
  },
};
