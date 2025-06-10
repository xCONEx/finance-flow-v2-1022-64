
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export interface FirestoreUser {
  email: string;
  uid: string;
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
  userType?: 'individual' | 'company_owner' | 'company_colab' | 'admin';
  banned?: boolean;
  subscription?: string;
  personalInfo?: {
    phone?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  ownerUid: string; // CORRIGIDO: era ownerUID
  collaborators: any[];
  equipments: any[];
  expenses: any[];
  jobs: any[];
  createdAt: string;
  plan?: string;
}

export const firestoreService = {
  // Operações de usuário
  async getUserData(uid: string): Promise<FirestoreUser | null> {
    try {
      console.log('Buscando dados do usuário:', uid);
      const userDoc = await getDoc(doc(db, 'usuarios', uid));
      
      if (userDoc.exists()) {
        console.log('Dados do usuário encontrados');
        return userDoc.data() as FirestoreUser;
      } else {
        console.log('Usuário não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      throw error;
    }
  },

  async createUser(userData: FirestoreUser): Promise<void> {
    try {
      await setDoc(doc(db, 'usuarios', userData.uid), userData);
      console.log('Usuário criado/atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  async updateUserType(uid: string, userType: 'individual' | 'company_owner' | 'company_colab' | 'admin'): Promise<void> {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { userType });
      console.log('Tipo de usuário atualizado:', userType);
    } catch (error) {
      console.error('Erro ao atualizar tipo de usuário:', error);
      throw error;
    }
  },

  // NOVO: Atualizar campo específico do usuário
  async updateUserField(uid: string, field: string, value: any): Promise<void> {
    try {
      console.log('Atualizando campo do usuário:', uid, field, value);
      await updateDoc(doc(db, 'usuarios', uid), { [field]: value });
      console.log('Campo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar campo do usuário:', error);
      throw error;
    }
  },

  // NOVO: Banir/desbanir usuário
  async banUser(uid: string, banned: boolean): Promise<void> {
    try {
      console.log(`${banned ? 'Banindo' : 'Desbanindo'} usuário:`, uid);
      await updateDoc(doc(db, 'usuarios', uid), { banned });
      console.log('Status de ban atualizado');
    } catch (error) {
      console.error('Erro ao atualizar status de ban:', error);
      throw error;
    }
  },

  // NOVO: Atualizar assinatura do usuário
  async updateUserSubscription(uid: string, subscription: string): Promise<void> {
    try {
      console.log('Atualizando assinatura do usuário:', uid, subscription);
      await updateDoc(doc(db, 'usuarios', uid), { subscription });
      console.log('Assinatura atualizada');
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw error;
    }
  },

  // Operações de empresa
  async getAllCompanies(): Promise<Company[]> {
    try {
      console.log('🏢 Buscando todas as empresas...');
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      
      const companies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      
      console.log('✅ Empresas encontradas:', companies.length);
      return companies;
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      throw error;
    }
  },

  async getCompanyData(companyId: string): Promise<Company | null> {
    try {
      console.log('🏢 Buscando dados da empresa:', companyId);
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (companyDoc.exists()) {
        console.log('✅ Dados da empresa encontrados');
        return { id: companyDoc.id, ...companyDoc.data() } as Company;
      } else {
        console.log('❌ Empresa não encontrada');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error);
      throw error;
    }
  },

  async createCompany(companyData: Omit<Company, 'id'>): Promise<string> {
    try {
      console.log('🏢 Criando nova empresa...');
      const companiesRef = collection(db, 'companies');
      const docRef = await addDoc(companiesRef, {
        ...companyData,
        createdAt: serverTimestamp()
      });
      console.log('✅ Empresa criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      throw error;
    }
  },

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<void> {
    try {
      console.log('🏢 Atualizando empresa:', companyId);
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Empresa atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      throw error;
    }
  },

  // NOVO: Atualizar campo específico da empresa
  async updateCompanyField(companyId: string, field: string, value: any): Promise<void> {
    try {
      console.log('Atualizando campo da empresa:', companyId, field, value);
      await updateDoc(doc(db, 'companies', companyId), { [field]: value });
      console.log('Campo da empresa atualizado');
    } catch (error) {
      console.error('Erro ao atualizar campo da empresa:', error);
      throw error;
    }
  },

  async deleteCompany(companyId: string): Promise<void> {
    try {
      console.log('🏢 Deletando empresa:', companyId);
      const companyRef = doc(db, 'companies', companyId);
      await deleteDoc(companyRef);
      console.log('✅ Empresa deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar empresa:', error);
      throw error;
    }
  },

  // Gestão de colaboradores
  async addCollaboratorToCompany(companyId: string, collaboratorData: any): Promise<void> {
    try {
      console.log('👥 Adicionando colaborador à empresa:', companyId);
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (companyDoc.exists()) {
        const currentData = companyDoc.data() as Company;
        const updatedCollaborators = [...(currentData.collaborators || []), collaboratorData];
        
        await updateDoc(doc(db, 'companies', companyId), {
          collaborators: updatedCollaborators
        });
        
        console.log('✅ Colaborador adicionado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar colaborador:', error);
      throw error;
    }
  },

  async removeCollaboratorFromCompany(companyId: string, collaboratorUid: string): Promise<void> {
    try {
      console.log('👥 Removendo colaborador da empresa:', companyId);
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (companyDoc.exists()) {
        const currentData = companyDoc.data() as Company;
        const updatedCollaborators = (currentData.collaborators || []).filter(
          (colab: any) => colab.uid !== collaboratorUid
        );
        
        await updateDoc(doc(db, 'companies', companyId), {
          collaborators: updatedCollaborators
        });
        
        console.log('✅ Colaborador removido com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao remover colaborador:', error);
      throw error;
    }
  },

  // Operações de convites
  async sendCompanyInvite(inviteData: any): Promise<void> {
    try {
      console.log('📧 Enviando convite para empresa...');
      const invitesRef = collection(db, 'invites');
      await addDoc(invitesRef, {
        ...inviteData,
        companyId: inviteData.companyId,
        sentAt: serverTimestamp(),
        status: 'pending'
      });
      console.log('✅ Convite enviado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar convite:', error);
      throw error;
    }
  },

  async getCompanyInvites(companyId: string): Promise<any[]> {
    try {
      console.log('📧 Buscando convites da empresa:', companyId);
      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Convites encontrados:', invites.length);
      return invites;
    } catch (error) {
      console.error('❌ Erro ao buscar convites:', error);
      throw error;
    }
  },

  // Operações do Kanban
  async getKanbanBoard(companyId: string): Promise<any | null> {
    try {
      console.log('📋 Buscando board do Kanban para empresa:', companyId);
      const boardDoc = await getDoc(doc(db, 'kanban_boards', companyId));
      
      if (boardDoc.exists()) {
        console.log('✅ Board do Kanban encontrado');
        return boardDoc.data();
      } else {
        console.log('📭 Board do Kanban não encontrado');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar board do Kanban:', error);
      throw error;
    }
  },

  async saveKanbanBoard(companyId: string, boardData: any): Promise<void> {
    try {
      console.log('💾 Salvando board do Kanban para empresa:', companyId);
      const boardRef = doc(db, 'kanban_boards', companyId);
      await updateDoc(boardRef, {
        ...boardData,
        companyId: companyId,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Board do Kanban salvo com sucesso');
    } catch (error) {
      // Se o documento não existir, criar um novo
      try {
        await addDoc(collection(db, 'kanban_boards'), {
          ...boardData,
          companyId: companyId,
          createdAt: serverTimestamp()
        });
        console.log('✅ Novo board do Kanban criado');
      } catch (createError) {
        console.error('❌ Erro ao criar board do Kanban:', createError);
        throw createError;
      }
    }
  },

  // NOVO: Funções administrativas corrigidas
  async getAllUsers(): Promise<any[]> {
    try {
      console.log('👥 [ADMIN] Buscando todos os usuários...');
      const usersRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usersRef);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Usuários encontrados:', users.length);
      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // NOVO: Função de analytics corrigida
  async getAnalyticsData(): Promise<any> {
    try {
      console.log('📊 [ADMIN] Calculando dados de analytics...');
      
      const [usersSnapshot, companiesSnapshot] = await Promise.all([
        getDocs(collection(db, 'usuarios')),
        getDocs(collection(db, 'companies'))
      ]);
      
      const users = usersSnapshot.docs.map(doc => doc.data());
      const companies = companiesSnapshot.docs.map(doc => doc.data());
      
      // Calcular métricas básicas
      const totalUsers = users.length;
      const totalCompanies = companies.length;
      const totalRevenue = 0; // Placeholder - implementar lógica de receita
      const activeUsers = users.filter(user => !user.banned).length;
      
      // Estatísticas por tipo de usuário
      const userTypes = {
        individual: users.filter(u => !u.userType || u.userType === 'individual').length,
        company_owner: users.filter(u => u.userType === 'company_owner').length,
        employee: users.filter(u => u.userType === 'company_colab').length,
        admin: users.filter(u => u.userType === 'admin').length
      };
      
      // Métricas de conversão
      const premiumUsers = users.filter(u => u.subscription === 'premium').length;
      const freeUsers = users.filter(u => !u.subscription || u.subscription === 'free').length;
      const conversionRate = freeUsers > 0 ? (premiumUsers / freeUsers) * 100 : 0;
      
      const analytics = {
        overview: {
          totalUsers,
          totalCompanies,
          totalRevenue,
          activeUsers
        },
        userStats: {
          userTypes,
          conversionRate
        },
        businessStats: {
          totalJobs: 0, // Placeholder
          approvedJobs: 0, // Placeholder
          pendingJobs: 0, // Placeholder
          averageJobValue: 0, // Placeholder
          jobApprovalRate: 0 // Placeholder
        },
        recentActivity: {
          newUsersThisMonth: 0, // Placeholder
          newCompaniesThisMonth: 0, // Placeholder
          newJobsThisMonth: 0 // Placeholder
        },
        productivity: {
          taskCompletionRate: 85, // Placeholder
          averageTasksPerUser: 12.5 // Placeholder
        }
      };
      
      console.log('✅ Analytics calculados');
      return analytics;
    } catch (error) {
      console.error('❌ Erro ao calcular analytics:', error);
      throw error;
    }
  }
};
