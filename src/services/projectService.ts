
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
import { db } from '../services/firebase';
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

  // Alias para createProject
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.addProject(projectData);
  },

  // Buscar projetos do usuário individual
  async getUserProjects(userId: string) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('companyId', '==', null),
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
      console.error('Erro ao buscar projetos do usuário:', error);
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
      console.error('Erro ao buscar projetos da empresa:', error);
      throw error;
    }
  },

  // Buscar todos os projetos (para admins)
  async getAllProjects() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
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
      console.error('Erro ao buscar todos os projetos:', error);
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
  },

  // Escutar mudanças em tempo real - usuário individual
  subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('companyId', '==', null),
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
  },

  // Escutar mudanças em tempo real - empresa
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
