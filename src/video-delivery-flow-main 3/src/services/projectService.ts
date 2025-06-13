
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
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project } from '../types/project';

const COLLECTION_NAME = 'projects';

export const projectService = {
  // Criar projeto
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...projectData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  },

  // Buscar projetos da empresa
  async getCompanyProjects(companyId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
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

  // Deletar projeto
  async deleteProject(projectId: string) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, projectId));
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }
  },

  // Escutar mudanças em tempo real
  subscribeToCompanyProjects(companyId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || '',
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || ''
      })) as Project[];
      callback(projects);
    });
  }
};
