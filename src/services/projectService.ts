
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
import { Project } from '../types/project';

const COLLECTION_NAME = 'projects';

export const projectService = {
  // Adicionar projeto
  async addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...projectData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao adicionar projeto:', error);
      throw error;
    }
  },

  // Buscar projetos da empresa
  async getCompanyProjects(companyId: string) {
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
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || '',
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || ''
      })) as Project[];
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      throw error;
    }
  },

  // Atualizar projeto
  async updateProject(projectId: string, updates: Partial<Project>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  },

  // Remover projeto
  async removeProject(projectId: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, projectId));
    } catch (error) {
      console.error('Erro ao remover projeto:', error);
      throw error;
    }
  }
};
