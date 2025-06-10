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
      
      if (user.userType === 'company_owner' || user.userType === 'employee') {
        const allAgencies = await firestoreService.getAllAgencies();
        
        for (const agency of allAgencies) {
          const agencyData = agency as any;
          
          const isOwner = agencyData.ownerUID === user.id;
          const isCollaborator = agencyData.collaborators && Array.isArray(agencyData.collaborators) && 
            agencyData.collaborators.includes(user.id);
          
          if (isOwner || isCollaborator) {
            setAgencyData(agencyData);
            console.log('✅ Dados da agência atualizados');
            break;
          }
        }
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
          } else {
            console.log('📦 Dados do usuário encontrados:', {
              equipments: userData.equipments?.length || 0,
              expenses: userData.expenses?.length || 0,
              jobs: userData.jobs?.length || 0,
              routine: userData.routine
            });
          }

          console.log('🏢 Verificando se usuário pertence a uma agência...');
          let userAgency = null;
          let userType: 'individual' | 'company_owner' | 'employee' | 'admin' = 'individual';
          
          try {
            const allAgencies = await firestoreService.getAllAgencies();
            console.log('🔍 Verificando agências:', allAgencies.length);
            
            for (const agency of allAgencies) {
              const agencyData = agency as any;
              
              console.log('🔍 Verificando agência:', agencyData.id, {
                ownerUID: agencyData.ownerUID,
                collaborators: agencyData.collaborators,
                userUID: firebaseUser.uid
              });
              
              const isOwner = agencyData.ownerUID === firebaseUser.uid;
              
              if (isOwner) {
                userAgency = agencyData;
                userType = 'company_owner';
                console.log('👑 Usuário é DONO da agência:', agencyData.id);
                break;
              }
              
              if (agencyData.collaborators && Array.isArray(agencyData.collaborators)) {
                const isCollaborator = agencyData.collaborators.includes(firebaseUser.uid);
                
                if (isCollaborator) {
                  userAgency = agencyData;
                  userType = 'employee';
                  console.log('👥 Usuário é colaborador da agência:', agencyData.id);
                  break;
                }
              }
            }
            
            if (userAgency) {
              console.log('🏢 Usuário encontrado em agência:', userAgency.id);
              setAgencyData(userAgency);
            } else {
              console.log('👤 Usuário individual (não pertence a agência)');
              setAgencyData(null);
            }
            
          } catch (error) {
            console.error('❌ Erro ao buscar agências:', error);
            setAgencyData(null);
          }

          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com';
          if (isAdmin) {
            userType = 'admin';
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
          if (isAdmin) {
            console.log('👑 Usuário administrador identificado');
          }

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
