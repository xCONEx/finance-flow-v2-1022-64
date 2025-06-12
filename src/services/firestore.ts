
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
  limit,
  serverTimestamp,
  writeBatch
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
  agencyId?: string;
}

export interface Collaborator {
  uid: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: any;
  email?: string;
  name?: string;
}

export const firestoreService = {
  async createUser(user: FirestoreUser) {
    try {
      console.log('Criando usuário:', user.uid);
      const userRef = doc(db, 'usuarios', user.uid);
      await setDoc(userRef, user);
      console.log('Usuário criado com sucesso');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  async getUserByEmail(email: string): Promise<{ id: string; email: string; name?: string } | null> {
    try {
      console.log('🔍 Buscando usuário por e-mail:', email);
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        const userData = docData.data();
        return { 
          id: docData.id, 
          email: userData.email,
          name: userData.name 
        };
      } else {
        console.warn('⚠️ Nenhum usuário encontrado com o email:', email);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por e-mail:', error);
      throw error;
    }
  },

  async updateUserField(uid: string, field: string, value: any) {
    try {
      console.log(`Atualizando campo ${field} do usuário ${uid}`);
      const userRef = doc(db, 'usuarios', uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      console.log('Campo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar campo:', error);
      throw error;
    }
  },

  async deleteUser(uid: string) {
    try {
      console.log('Deletando usuário:', uid);
      const userRef = doc(db, 'usuarios', uid);
      await deleteDoc(userRef);
      console.log('Usuário deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  async getUserData(uid: string) {
    try {
      console.log('Buscando dados do usuário:', uid);
      const userRef = doc(db, 'usuarios', uid);
      const userDoc = await getDoc(userRef);

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

  async getUserAgency(uid: string) {
    try {
      console.log('🏢 Verificando agência do usuário:', uid);

      // 1) Verificar se o usuário é dono (documento agencia com ownerUID = uid)
      const agenciasRef = collection(db, 'agencias');
      const ownerQuery = query(agenciasRef, where('ownerUID', '==', uid));
      const ownerSnapshot = await getDocs(ownerQuery);

      if (!ownerSnapshot.empty) {
        const agencyDoc = ownerSnapshot.docs[0];
        const agencyData = agencyDoc.data();
        console.log('✅ Usuário é proprietário da agência:', agencyDoc.id);
        return { id: agencyDoc.id, ...agencyData };
      }

      // 2) Buscar nas subcoleções colaboradores
      const allAgenciesSnapshot = await getDocs(agenciasRef);

      for (const agencyDoc of allAgenciesSnapshot.docs) {
        const colaboradorRef = doc(db, 'agencias', agencyDoc.id, 'colaboradores', uid);
        const colaboradorDoc = await getDoc(colaboradorRef);

        if (colaboradorDoc.exists()) {
          console.log('✅ Usuário é colaborador da agência:', agencyDoc.id);
          return { id: agencyDoc.id, ...agencyDoc.data() };
        }
      }

      console.log('❌ Usuário não pertence a nenhuma agência');
      return null;
    } catch (error) {
      console.error('❌ Erro ao verificar agência:', error);
      throw error;
    }
  },

  async createAgencia(agenciaData: any) {
    try {
      console.log('🏢 Criando nova agência para UID:', agenciaData.ownerUID);
      
      const agencyRef = doc(collection(db, 'agencias'));
      const agencyId = agencyRef.id;
      
      const newAgencia = {
        name: agenciaData.name,
        ownerUID: agenciaData.ownerUID,
        equipments: [],
        expenses: [],
        jobs: [],
        kanbanBoard: null,
        createdAt: serverTimestamp(),
        status: 'active'
      };
      
      await setDoc(agencyRef, newAgencia);

      // Adicionar o owner como colaborador na subcoleção
      const ownerCollaboratorRef = doc(db, 'agencias', agencyId, 'colaboradores', agenciaData.ownerUID);
      await setDoc(ownerCollaboratorRef, {
        role: 'owner',
        addedAt: serverTimestamp()
      });
      
      console.log('✅ Agência criada com ID:', agencyId);
      return agencyId;
    } catch (error) {
      console.error('❌ Erro ao criar agência:', error);
      throw error;
    }
  },

  async getAgenciaInvites(agenciaId: string): Promise<any[]> {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('agencyId', '==', agenciaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateAgenciaField(agenciaId: string, field: string, value: any) {
    try {
      console.log(`💾 Atualizando ${field} da agência ${agenciaId}`);
      const agenciaRef = doc(db, 'agencias', agenciaId);
      await updateDoc(agenciaRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Campo da agência atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar campo da agência:', error);
      throw error;
    }
  },

  async deleteAgencia(agenciaId: string) {
    try {
      console.log('🗑️ Deletando agência:', agenciaId);
      const agenciaRef = doc(db, 'agencias', agenciaId);
      await deleteDoc(agenciaRef);
      console.log('✅ Agência deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar agência:', error);
      throw error;
    }
  },

  async addAgenciaMember(agenciaId: string, memberUID: string, role: string) {
    try {
      console.log('👥 Adicionando membro à agência:', { agenciaId, memberUID, role });

      const colaboradorRef = doc(db, 'agencias', agenciaId, 'colaboradores', memberUID);

      await setDoc(colaboradorRef, {
        role,
        addedAt: serverTimestamp(),
      });

      console.log('✅ Membro adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar membro:', error);
      throw error;
    }
  },

  async removeAgenciaMember(agenciaId: string, memberId: string) {
    try {
      console.log('👥 Removendo membro da agência:', { agenciaId, memberId });

      const colaboradorRef = doc(db, 'agencias', agenciaId, 'colaboradores', memberId);
      await deleteDoc(colaboradorRef);

      console.log('✅ Membro removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover membro:', error);
      throw error;
    }
  },

  async updateMemberRole(agenciaId: string, memberId: string, newRole: string) {
    try {
      console.log('👥 Atualizando role do membro:', { agenciaId, memberId, newRole });

      const colaboradorRef = doc(db, 'agencias', agenciaId, 'colaboradores', memberId);
      await updateDoc(colaboradorRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Role do membro atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar role do membro:', error);
      throw error;
    }
  },

  async getAgenciaMembers(agenciaId: string): Promise<Collaborator[]> {
    try {
      console.log('👥 Buscando membros da agência:', agenciaId);
      
      const colaboradoresRef = collection(db, 'agencias', agenciaId, 'colaboradores');
      const querySnapshot = await getDocs(colaboradoresRef);
      
      const membros: Collaborator[] = [];
      
      for (const doc of querySnapshot.docs) {
        const collaboratorData = doc.data();
        
        // Buscar dados do usuário
        const userData = await this.getUserData(doc.id);
        
        membros.push({
          uid: doc.id,
          role: collaboratorData.role,
          addedAt: collaboratorData.addedAt,
          email: userData?.email || 'Email não disponível',
          name: userData?.name || userData?.email?.split('@')[0] || 'Nome não disponível'
        });
      }
      
      console.log('✅ Membros encontrados:', membros.length);
      return membros;
    } catch (error) {
      console.error('❌ Erro ao buscar membros:', error);
      throw error;
    }
  },

  async getUserRole(agenciaId: string, userId: string) {
    try {
      const colaboradorDocRef = doc(db, 'agencias', agenciaId, 'colaboradores', userId);
      const colaboradorDoc = await getDoc(colaboradorDocRef);

      if (!colaboradorDoc.exists()) return null;
      return colaboradorDoc.data().role;
    } catch (error) {
      console.error('❌ Erro ao buscar role do usuário:', error);
      throw error;
    }
  },

  async getAllAgencias() {
    try {
      console.log('🏢 Buscando todas as agências...');
      const agenciasRef = collection(db, 'agencias');
      const snapshot = await getDocs(agenciasRef);
      
      const agencias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Agências encontradas:', agencias.length);
      return agencias;
    } catch (error) {
      console.error('❌ Erro ao buscar agências:', error);
      throw error;
    }
  },

  async saveKanbanBoard(agencyId: string, boardData: any) {
    try {
      console.log('💾 Salvando board do Kanban para agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      
      await updateDoc(agencyRef, {
        kanbanBoard: boardData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Board do Kanban salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar board do Kanban:', error);
      throw error;
    }
  },

  async getKanbanBoard(agencyId: string) {
    try {
      console.log('📦 Buscando board do Kanban para agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        const data = agencyDoc.data();
        console.log('✅ Board do Kanban encontrado');
        return data.kanbanBoard || null;
      }
      
      console.log('❌ Agência não encontrada');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar board do Kanban:', error);
      // Se for erro de permissão, retorna null para criar um board inicial
      if (error.code === 'permission-denied') {
        console.log('⚠️ Sem permissão para acessar board, retornando null');
        return null;
      }
      throw error;
    }
  },

  async updateField(collection: string, docId: string, field: string, value: any) {
    try {
      console.log(`💾 Atualizando ${field} em ${collection}/${docId}`);
      const docRef = doc(db, collection, docId);
      
      await updateDoc(docRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Campo atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar campo:', error);
      throw error;
    }
  },

  async getAgencyData(agencyId: string) {
    try {
      console.log('🏢 Buscando dados da agência:', agencyId);
      const agencyRef = doc(db, 'agencias', agencyId);
      const agencyDoc = await getDoc(agencyRef);
      
      if (agencyDoc.exists()) {
        console.log('✅ Dados da agência encontrados');
        return { id: agencyDoc.id, ...agencyDoc.data() };
      }
      
      console.log('❌ Agência não encontrada');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados da agência:', error);
      throw error;
    }
  },

  async getAllUsers() {
    try {
      console.log('👥 Buscando todos os usuários...');
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

  async getAnalyticsData() {
    try {
      console.log('📊 Calculando dados de analytics...');
      
      const [users, agencias] = await Promise.all([
        this.getAllUsers(),
        this.getAllAgencias()
      ]);

      const totalUsers = users.length;
      const totalAgencias = agencias.length;
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

      const analytics = {
        overview: {
          totalUsers,
          totalAgencias,
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
          newAgenciasThisMonth: 0,
          newJobsThisMonth: 0
        },
        productivity: {
          taskCompletionRate: 85,
          averageTasksPerUser: 5.2
        }
      };

      console.log('✅ Analytics calculados');
      return analytics;
    } catch (error) {
      console.error('❌ Erro ao calcular analytics:', error);
      throw error;
    }
  },

  async banUser(userId: string, banned: boolean) {
    try {
      console.log(`${banned ? '🚫 Banindo' : '✅ Desbanindo'} usuário:`, userId);
      await this.updateUserField(userId, 'banned', banned);
      console.log('✅ Status do usuário atualizado');
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      throw error;
    }
  },

  async getUserInvites(userEmail: string) {
    try {
      console.log('🔍 Buscando convites para:', userEmail);
      const invitesRef = collection(db, 'invites');
      const q = query(
        invitesRef, 
        where('email', '==', userEmail),
        where('status', '==', 'pending')
      );
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

  async acceptInvite(inviteId: string, userId: string, agenciaId: string) {
    try {
      console.log('✅ Aceitando convite:', { inviteId, userId, agenciaId });
      
      // Buscar dados do convite
      const inviteRef = doc(db, 'invites', inviteId);
      const inviteDoc = await getDoc(inviteRef);
      
      if (!inviteDoc.exists()) {
        throw new Error('Convite não encontrado');
      }
      
      const inviteData = inviteDoc.data();
      
      // Adicionar usuário como colaborador na agência
      await this.addAgenciaMember(agenciaId, userId, inviteData.role);
      
      // Atualizar status do convite para aceito
      await updateDoc(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId
      });
      
      console.log('✅ Convite aceito com sucesso');
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      throw error;
    }
  },

  async updateInviteStatus(inviteId: string, status: string) {
    try {
      console.log('🔄 Atualizando status do convite:', { inviteId, status });
      
      const inviteRef = doc(db, 'invites', inviteId);
      await updateDoc(inviteRef, {
        status,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Status do convite atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status do convite:', error);
      throw error;
    }
  },

  async createInvite(inviteData: {
    email: string;
    agencyId: string;
    agencyName: string;
    role: string;
    invitedBy: string;
    invitedByName: string;
  }) {
    try {
      console.log('📧 Criando convite:', inviteData);
      
      const inviteRef = doc(collection(db, 'invites'));
      const newInvite = {
        ...inviteData,
        status: 'pending',
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await setDoc(inviteRef, newInvite);
      
      console.log('✅ Convite criado com ID:', inviteRef.id);
      return inviteRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar convite:', error);
      throw error;
    }
  },

  async updateUserSubscription(userId: string, plan: string) {
    try {
      console.log('💳 Atualizando plano do usuário:', userId, plan);
      await this.updateUserField(userId, 'subscription', plan);
      console.log('✅ Plano atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar plano:', error);
      throw error;
    }
  }
};
