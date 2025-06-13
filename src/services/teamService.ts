
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TeamMember } from '../types/project';

const COLLECTION_NAME = 'team_members';

export const teamService = {
  // Adicionar membro à equipe
  async addTeamMember(memberData: Omit<TeamMember, 'id' | 'createdAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...memberData,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  },

  // Buscar membros da empresa
  async getCompanyTeam(companyId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('agencyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || ''
      })) as TeamMember[];
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      throw error;
    }
  },

  // Atualizar membro
  async updateTeamMember(memberId: string, updates: Partial<TeamMember>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      throw error;
    }
  },

  // Remover membro
  async removeTeamMember(memberId: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, memberId));
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }
};
