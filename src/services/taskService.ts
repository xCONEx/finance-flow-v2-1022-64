
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '../types';

export const taskService = {
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      console.log('📋 Buscando tasks do usuário:', userId);
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      console.log('✅ Tasks encontradas:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Erro ao buscar tasks:', error);
      throw error;
    }
  },

  async addTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<string> {
    try {
      console.log('💾 Salvando nova task:', task.title);
      const tasksRef = collection(db, 'tasks');
      
      const newTask = {
        ...task,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      console.log('✅ Task salva com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar task:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      console.log('🔄 Atualizando task:', taskId);
      const taskRef = doc(db, 'tasks', taskId);
      
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Task atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar task:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('🗑️ Deletando task:', taskId);
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      console.log('✅ Task deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar task:', error);
      throw error;
    }
  }
};
