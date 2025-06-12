
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔄 Usuário autenticado, carregando dados...', firebaseUser.uid);
          
          // Verificar se o usuário existe na coleção 'usuarios'
          let userData = await firestoreService.getUserData(firebaseUser.uid);
          
          // Se não existir, criar um novo documento
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

          // Verificar agência do usuário
          console.log('🏢 Verificando agência do usuário...');
          let userAgency = null;
          let userType: 'individual' | 'company_owner' | 'employee' | 'admin' = 'individual';
          let userRole = null;
          
          try {
            userAgency = await firestoreService.getUserAgency(firebaseUser.uid);
            
            if (userAgency) {
              console.log('🏢 Usuário encontrado em agência:', userAgency.id);
              
              // Verificar se é owner da agência (ID da agência = UID do usuário)
              if (userAgency.id === firebaseUser.uid) {
                userType = 'company_owner';
                userRole = 'owner';
                console.log('👑 Usuário é PROPRIETÁRIO da agência');
              } else if (userAgency.colaboradores && userAgency.colaboradores[firebaseUser.uid]) {
                // Verificar role do colaborador
                userRole = userAgency.colaboradores[firebaseUser.uid];
                userType = 'employee'; // ✅ Corrigido: definir como employee quando for colaborador
                console.log('👥 Usuário é colaborador da agência, role:', userRole);
              } else {
                // Se está na agência mas não é owner nem colaborador registrado, também é employee
                userType = 'employee';
                userRole = 'viewer';
                console.log('👥 Usuário é membro da agência (role padrão: viewer)');
              }
              
              console.log('📦 Dados da agência carregados:', {
                equipments: userAgency.equipments?.length || 0,
                expenses: userAgency.expenses?.length || 0,
                jobs: userAgency.jobs?.length || 0,
                colaboradores: Object.keys(userAgency.colaboradores || {}).length,
                kanbanBoard: userAgency.kanbanBoard ? 'presente' : 'ausente'
              });
              setAgencyData(userAgency);
            } else {
              console.log('👤 Usuário individual (não pertence a agência)');
              setAgencyData(null);
            }
            
          } catch (error) {
            console.error('❌ Erro ao buscar agência:', error);
            setAgencyData(null);
          }

          // Verificar se é admin
          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com' || firebaseUser.email === 'yuriadrskt@gmail.com';
          if (isAdmin) {
            userType = 'admin';
          }
          
          // Converter para o formato do contexto
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
          console.log('🎭 Role do usuário:', userRole);
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
      
      // Criar documento do usuário na coleção 'usuarios'
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
      agencyData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
