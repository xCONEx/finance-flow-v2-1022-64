
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
  userType?: 'individual' | 'owner' | 'collaborator' | 'admin';
  subscription?: 'free' | 'premium' | 'enterprise';
  banned?: boolean;
  agencyId?: string;
}

export interface AgencyData {
  id: string;
  ownerUID: string;
  name: string;
  members?: string[];
  collaborators?: string[]; // Added for backward compatibility
  permissions?: {
    [uid: string]: 'admin' | 'editor' | 'viewer';
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface UserContextData {
  uid: string;
  email: string;
  displayName?: string;
  userType: 'owner' | 'collaborator' | 'individual' | 'admin';
  agencyName?: string;
  agencyId?: string;
  hasAgencyData: boolean;
  permissions?: 'admin' | 'editor' | 'viewer';
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
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async getUserData(uid: string): Promise<FirestoreUser | null> {
    try {
      const userRef = doc(db, 'usuarios', uid);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? (userDoc.data() as FirestoreUser) : null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  },

  async getUserAuthData(uid: string): Promise<UserContextData | null> {
    try {
      console.log('🔍 Verificando dados de autenticação para UID:', uid);
      
      // Verificar se é admin pelo email
      const userData = await this.getUserData(uid);
      if (userData?.email === 'adm.financeflow@gmail.com') {
        console.log('👑 Usuário é ADMIN');
        return {
          uid,
          email: userData.email,
          displayName: userData.name,
          userType: 'admin',
          hasAgencyData: false
        };
      }

      // Buscar se é dono de alguma agência
      const agenciesRef = collection(db, 'agencias');
      const ownerQuery = query(agenciesRef, where('ownerUID', '==', uid));
      const ownerSnapshot = await getDocs(ownerQuery);

      if (!ownerSnapshot.empty) {
        const agencyDoc = ownerSnapshot.docs[0];
        const agencyData = { id: agencyDoc.id, ...agencyDoc.data() } as AgencyData;
        console.log('👑 Usuário é DONO da agência:', agencyData.name);
        
        return {
          uid,
          email: userData?.email || '',
          displayName: userData?.name,
          userType: 'owner',
          agencyName: agencyData.name,
          agencyId: agencyData.id,
          hasAgencyData: true,
          permissions: 'admin'
        };
      }

      // Buscar se é colaborador de alguma agência
      const allAgenciesSnapshot = await getDocs(agenciesRef);
      for (const agencyDoc of allAgenciesSnapshot.docs) {
        const agencyData = { id: agencyDoc.id, ...agencyDoc.data() } as AgencyData;
        
        if (agencyData.members && agencyData.members.includes(uid)) {
          const userPermission = agencyData.permissions?.[uid] || 'viewer';
          console.log('👥 Usuário é COLABORADOR da agência:', agencyData.name, 'com permissão:', userPermission);
          
          return {
            uid,
            email: userData?.email || '',
            displayName: userData?.name,
            userType: 'collaborator',
            agencyName: agencyData.name,
            agencyId: agencyData.id,
            hasAgencyData: true,
            permissions: userPermission
          };
        }
      }

      // Se não é dono nem colaborador, é individual
      console.log('👤 Usuário é INDIVIDUAL');
      return {
        uid,
        email: userData?.email || '',
        displayName: userData?.name,
        userType: 'individual',
        hasAgencyData: false
      };

    } catch (error) {
      console.error('❌ Erro ao verificar dados de autenticação:', error);
      return null;
    }
  },

  async getAgencyData(agencyId: string): Promise<AgencyData | null> {
    try {
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      return agencyDoc.exists() ? { id: agencyDoc.id, ...agencyDoc.data() } as AgencyData : null;
    } catch (error) {
      console.error('Erro ao buscar dados da agência:', error);
      return null;
    }
  },

  async createAgency(agencyData: Omit<AgencyData, 'id'>) {
    const agenciesRef = collection(db, 'agencias');
    const docRef = await addDoc(agenciesRef, {
      ...agencyData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async addCollaboratorToAgency(agencyId: string, collaboratorUID: string, permission: 'editor' | 'viewer' = 'viewer') {
    try {
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (!agencyDoc.exists()) {
        throw new Error('Agência não encontrada');
      }

      const currentData = agencyDoc.data() as AgencyData;
      const currentMembers = currentData.members || [];
      const currentPermissions = currentData.permissions || {};

      // Adicionar colaborador se não existir
      if (!currentMembers.includes(collaboratorUID)) {
        currentMembers.push(collaboratorUID);
      }

      // Definir permissão
      currentPermissions[collaboratorUID] = permission;

      await updateDoc(agencyRef, {
        members: currentMembers,
        permissions: currentPermissions,
        updatedAt: serverTimestamp()
      });

      // Atualizar dados do usuário
      await this.updateUserField(collaboratorUID, 'userType', 'collaborator');
      await this.updateUserField(collaboratorUID, 'agencyId', agencyId);

    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      throw error;
    }
  },

  async removeCollaboratorFromAgency(agencyId: string, collaboratorUID: string) {
    try {
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (!agencyDoc.exists()) return;

      const currentData = agencyDoc.data() as AgencyData;
      const currentMembers = currentData.members || [];
      const currentPermissions = currentData.permissions || {};

      // Remover colaborador
      const updatedMembers = currentMembers.filter(uid => uid !== collaboratorUID);
      delete currentPermissions[collaboratorUID];

      await updateDoc(agencyRef, {
        members: updatedMembers,
        permissions: currentPermissions,
        updatedAt: serverTimestamp()
      });

      // Atualizar dados do usuário
      await this.updateUserField(collaboratorUID, 'userType', 'individual');
      await this.updateUserField(collaboratorUID, 'agencyId', null);

    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      throw error;
    }
  },

  async getUserInvites(email: string) {
    try {
      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('email', '==', email), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      return [];
    }
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
    const authData = await this.getUserAuthData(uid);
    if (authData?.agencyId) {
      return await this.getAgencyData(authData.agencyId);
    }
    return null;
  },

  async getAllAgencies(): Promise<AgencyData[]> {
    const agenciasRef = collection(db, 'agencias');
    const snapshot = await getDocs(agenciasRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencyData));
  },

  async addCollaboratorToCompany(companyId: string, collaboratorUID: string) {
    await this.addCollaboratorToAgency(companyId, collaboratorUID, 'editor');
  },

  async saveKanbanBoard(agencyId: string, boardData: any) {
    const agencyRef = doc(db, 'agencias', agencyId);
    await updateDoc(agencyRef, {
      kanban: boardData,
      updatedAt: serverTimestamp()
    });
  },

  async getKanbanBoard(agencyId: string) {
    const agencyRef = doc(db, 'agencias', agencyId);
    const agencyDoc = await getDoc(agencyRef);
    if (agencyDoc.exists()) {
      const agencyData = agencyDoc.data();
      return agencyData.kanban || null;
    }
    return null;
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
    await this.removeCollaboratorFromAgency(companyId, memberId);
  },

  async updateField(collectionName: string, docId: string, field: string, value: any) {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: value,
      updatedAt: serverTimestamp()
    });
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
      owner: users.filter(u => u.userType === 'owner').length,
      collaborator: users.filter(u => u.userType === 'collaborator').length,
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
  },

  async updateUserSubscription(userId: string, plan: 'free' | 'premium' | 'enterprise') {
    await this.updateUserField(userId, 'subscription', plan);
  },

  async createCompany(companyData: any) {
    return await this.createAgency(companyData);
  },

  async updateCompanyField(companyId: string, field: string, value: any) {
    const companyRef = doc(db, 'agencias', companyId);
    await updateDoc(companyRef, {
      [field]: value,
      updatedAt: serverTimestamp()
    });
  },

  async deleteCompany(companyId: string) {
    const companyRef = doc(db, 'agencias', companyId);
    await deleteDoc(companyRef);
  },

  async acceptInvite(inviteId: string, userId: string, agencyId: string) {
    // Update invite status
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });

    // Add user as collaborator to the agency
    await this.addCollaboratorToAgency(agencyId, userId);
  },

  async updateInviteStatus(inviteId: string, status: 'accepted' | 'declined') {
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }
};
