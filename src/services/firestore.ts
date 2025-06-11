import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirestoreUser {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  logobase64?: string;
  equipments?: any[];
  expenses?: any[];
  jobs?: any[];
  routine?: any;
  personalInfo?: {
    phone?: string;
    company?: string;
  };
  imageuser?: string;
  userType?: 'individual' | 'company_owner' | 'employee' | 'admin';
  subscription?: 'free' | 'premium' | 'enterprise';
  banned?: boolean;
  companyId?: string;
}

export interface AgencyData {
  id: string;
  ownerUID: string;
  collaborators?: any;
  [key: string]: any;
}

const isUserCollaborator = (collaborators: any, userUID: string): boolean => {
  if (!collaborators) return false;
  if (Array.isArray(collaborators)) {
    return collaborators.includes(userUID);
  }
  if (typeof collaborators === 'object') {
    return collaborators.hasOwnProperty(userUID) && collaborators[userUID] === true;
  }
  return false;
};

const addCollaboratorToStructure = (currentCollaborators: any, userUID: string) => {
  if (!currentCollaborators) return [userUID];
  if (Array.isArray(currentCollaborators)) {
    return currentCollaborators.includes(userUID) 
      ? currentCollaborators 
      : [...currentCollaborators, userUID];
  }
  if (typeof currentCollaborators === 'object') {
    return {
      ...currentCollaborators,
      [userUID]: true
    };
  }
  return [userUID];
};

const removeCollaboratorFromStructure = (currentCollaborators: any, userUID: string) => {
  if (!currentCollaborators) return currentCollaborators;
  if (Array.isArray(currentCollaborators)) {
    return currentCollaborators.filter(uid => uid !== userUID);
  }
  if (typeof currentCollaborators === 'object') {
    const { [userUID]: _, ...rest } = currentCollaborators;
    return rest;
  }
  return currentCollaborators;
};

export const firestoreService = {
  async createUser(user: FirestoreUser) {
    const userRef = doc(db, 'usuarios', user.uid);
    await setDoc(userRef, user);
  },

  async getUserData(uid: string) {
    const userRef = doc(db, 'usuarios', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? (userDoc.data() as FirestoreUser) : null;
  },

  async updateUserField(uid: string, field: string, value: any) {
    const userRef = doc(db, 'usuarios', uid);
    await updateDoc(userRef, {
      [field]: value,
      updatedAt: serverTimestamp()
    });
  },

  async deleteUser(uid: string) {
    const userRef = doc(db, 'usuarios', uid);
    await deleteDoc(userRef);
  },

  async getUserAgency(uid: string): Promise<AgencyData | null> {
    try {
      const agenciasRef = collection(db, 'agencias');
      const snapshot = await getDocs(agenciasRef);
      for (const docSnapshot of snapshot.docs) {
        const agencyData = { id: docSnapshot.id, ...docSnapshot.data() } as AgencyData;
        if (agencyData.ownerUID === uid) {
          return agencyData;
        }
        if (isUserCollaborator(agencyData.collaborators, uid)) {
          return agencyData;
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar agência:', error);
      return null;
    }
  },

  async getAllAgencies(): Promise<AgencyData[]> {
    const agenciasRef = collection(db, 'agencias');
    const snapshot = await getDocs(agenciasRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencyData));
  },

  async addCollaboratorToCompany(companyId: string, collaboratorUID: string) {
    const agencyRef = doc(db, 'agencias', companyId);
    const agencyDoc = await getDoc(agencyRef);
    if (!agencyDoc.exists()) {
      throw new Error('Agência não encontrada');
    }
    const currentData = agencyDoc.data();
    const updatedCollaborators = addCollaboratorToStructure(currentData.collaborators, collaboratorUID);
    await updateDoc(agencyRef, {
      collaborators: updatedCollaborators,
      updatedAt: serverTimestamp()
    });
    await this.updateUserField(collaboratorUID, 'userType', 'employee');
    await this.updateUserField(collaboratorUID, 'companyId', companyId);
  },

  async saveKanbanBoard(agencyId: string, boardData: any) {
    const boardRef = doc(db, 'kanban_boards', agencyId);
    await setDoc(boardRef, {
      agencyId,
      ...boardData,
      updatedAt: serverTimestamp()
    });
  },

  async getKanbanBoard(agencyId: string) {
    const boardRef = doc(db, 'kanban_boards', agencyId);
    const boardDoc = await getDoc(boardRef);
    return boardDoc.exists() ? boardDoc.data() : null;
  },

  async sendInvite(inviteData: any) {
    const invitesRef = collection(db, 'invites');
    const newInvite = {
      email: inviteData.email,
      agencyId: inviteData.companyId,
      agencyName: inviteData.companyName,
      invitedBy: inviteData.invitedBy,
      role: inviteData.role,
      status: 'pending',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(invitesRef, newInvite);
    return docRef.id;
  },

  async getCompanyInvites(companyId: string) {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('agencyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async removeCompanyMember(companyId: string, memberId: string) {
    const agencyRef = doc(db, 'agencias', companyId);
    const agencyDoc = await getDoc(agencyRef);
    if (!agencyDoc.exists()) return;
    const currentData = agencyDoc.data();
    const updatedCollaborators = removeCollaboratorFromStructure(currentData.collaborators, memberId);
    await updateDoc(agencyRef, {
      collaborators: updatedCollaborators,
      updatedAt: serverTimestamp()
    });
    await this.updateUserField(memberId, 'userType', 'individual');
    await this.updateUserField(memberId, 'companyId', null);
  },

  async updateField(collectionName: string, docId: string, field: string, value: any) {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: value,
      updatedAt: serverTimestamp()
    });
  },

  async getAgencyData(agencyId: string): Promise<AgencyData | null> {
    const agencyRef = doc(db, 'agencias', agencyId);
    const agencyDoc = await getDoc(agencyRef);
    return agencyDoc.exists() ? { id: agencyDoc.id, ...agencyDoc.data() } as AgencyData : null;
  },

  async getAllUsers() {
    const usersRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAllCompanies() {
    const companiesRef = collection(db, 'agencias');
    const snapshot = await getDocs(companiesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getAnalyticsData() {
    const [users, companies] = await Promise.all([
      this.getAllUsers(),
      this.getAllCompanies()
    ]);
    const totalUsers = users.length;
    const totalCompanies = companies.length;
    const activeUsers = users.filter(u => !u.banned).length;
    const userTypes = {
      individual: users.filter(u => u.userType === 'individual').length,
      company_owner: users.filter(u => u.userType === 'company_owner').length,
      employee: users.filter(u => u.userType === 'employee').length,
      admin: users.filter(u => u.userType === 'admin').length
    };
    const subscriptionStats = {
      free: users.filter(u => !u.subscription || u.subscription === 'free').length,
      premium: users.filter(u => u.subscription === 'premium').length,
      enterprise: users.filter(u => u.subscription === 'enterprise').length
    };
    return {
      overview: {
        totalUsers,
        totalCompanies,
        activeUsers,
        totalRevenue: subscriptionStats.premium * 29 + subscriptionStats.enterprise * 99
      },
      userStats: {
        userTypes,
        subscriptionStats,
        conversionRate: totalUsers > 0 ? ((subscriptionStats.premium + subscriptionStats.enterprise) / totalUsers) * 100 : 0
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
        taskCompletionRate: 85,
        averageTasksPerUser: 5.2
      }
    };
  },

  async banUser(userId: string, banned: boolean) {
    await this.updateUserField(userId, 'banned', banned);
  }
};
