import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

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
  logobase64: string;
  equipments: any[];
  expenses: any[];
  jobs: any[];
  routine: {
    dailyHours: number;
    dalilyValue: number;
    desiredSalary: number;
    workDays: number;
  };
  userType: 'individual' | 'company_owner' | 'company_colab' | 'admin';
  phone?: string;
  company?: string;
  imageuser?: string;
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
      // Substitua 'analytics' pelo nome da sua coleção de analytics
      const analyticsCollection = collection(db, 'analytics');
      const analyticsSnapshot = await getDocs(analyticsCollection);
      return analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
};
