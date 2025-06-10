

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { firestoreService, FirestoreUser } from '../services/firestore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loading: boolean;
  userData: FirestoreUser | null;
  agencyData: any | null;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Função para verificar se o usuário é colaborador (suporta array e map)
const isUserCollaborator = (collaborators: any, userUID: string): boolean => {
  if (!collaborators) return false;
  
  // Se for array
  if (Array.isArray(collaborators)) {
    return collaborators.includes(userUID);
  }
  
  // Se for objeto/map
  if (typeof collaborators === 'object') {
    return collaborators.hasOwnProperty(userUID) && collaborators[userUID] === true;
  }
  
  return false;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [agencyData, setAgencyData] = useState<any | null>(null);

  const refreshUserData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Atualizando dados do usuário...');
      
      const updatedUserData = await firestoreService.getUserData(user.id);
      if (updatedUserData) {
        setUserData(updatedUserData);
        console.log('✅ Dados do usuário atualizados');
      }
      
      // Buscar agência do usuário
      const userAgency = await firestoreService.getUserAgency(user.id);
      if (userAgency) {
        setAgencyData(userAgency);
        console.log('✅ Dados da agência atualizados');
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔄 Usuário autenticado, carregando dados...', firebaseUser.uid);
          
          let userData = await firestoreService.getUserData(firebaseUser.uid);
          
          if (!userData) {
            console.log('👤 Criando novo usuário na coleção usuarios...');
            const newUserData: FirestoreUser = {
              email: firebaseUser.email || '',
              uid: firebaseUser.uid,
              logobase64: '',
              equipments: [],
              expenses: [],
              jobs: [],
              routine: {
                dailyHours: 8,
                dalilyValue: 0,
                desiredSalary: 0,
                workDays: 22
              }
            };
            
            await firestoreService.createUser(newUserData);
            userData = newUserData;
            console.log('✅ Usuário criado com dados padrão');
          }

          // Verificar se é admin PRIMEIRO
          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com';
          
          // Buscar agência do usuário usando o serviço
          const userAgency = await firestoreService.getUserAgency(firebaseUser.uid);
          
          // Determinar tipo de usuário baseado na agência encontrada
          let userType: 'individual' | 'company_owner' | 'employee' | 'admin' = 'individual';
          
          if (isAdmin) {
            userType = 'admin';
            console.log('👑 Usuário administrador identificado');
          } else if (userAgency) {
            // CORRIGIDO: Verificar se é dono OU colaborador
            if (userAgency.ownerUID === firebaseUser.uid) {
              userType = 'company_owner';
              console.log('👑 Usuário é PROPRIETÁRIO da agência:', userAgency.id);
            } else if (isUserCollaborator(userAgency.collaborators, firebaseUser.uid)) {
              userType = 'employee';
              console.log('👥 Usuário é COLABORADOR da agência:', userAgency.id);
            }
            
            setAgencyData(userAgency);
            console.log('🏢 Dados da agência definidos:', {
              id: userAgency.id,
              name: userAgency.name,
              ownerUID: userAgency.ownerUID,
              userType: userType
            });
          } else {
            console.log('👤 Usuário individual (não pertence a agência)');
            setAgencyData(null);
          }
          
          const appUser: User = {
            id: firebaseUser.uid,
            email: userData.email,
            name: firebaseUser.displayName || userData.email.split('@')[0],
            userType: userType,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined
          };

          setUser(appUser);
          setUserData(userData);

          console.log('✅ Dados do usuário carregados com sucesso!');
          console.log('👤 Tipo de usuário FINAL:', userType);
          console.log('📧 Email:', firebaseUser.email);
          console.log('🏢 Agência encontrada:', userAgency ? userAgency.id : 'Nenhuma');

        } catch (error) {
          console.error('❌ Erro ao carregar dados do usuário:', error);
        }
      } else {
        console.log('👋 Usuário não autenticado');
        setUser(null);
        setUserData(null);
        setAgencyData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando login...');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      console.log('🔐 Iniciando login com Google...');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ Erro no login com Google:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('📝 Criando nova conta...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUserData: FirestoreUser = {
        email: email,
        uid: userCredential.user.uid,
        logobase64: '',
        equipments: [],
        expenses: [],
        jobs: [],
        routine: {
          dailyHours: 8,
          dalilyValue: 0,
          desiredSalary: 0,
          workDays: 22
        }
      };

      await firestoreService.createUser(newUserData);
      console.log('✅ Conta criada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('👋 Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      logout,
      register,
      loading,
      userData,
      agencyData,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

