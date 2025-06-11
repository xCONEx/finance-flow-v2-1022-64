
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
import { firestoreService, FirestoreUser, UserContextData, AgencyData } from '../services/firestore';
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
  agencyData: AgencyData | null;
  userAuthData: UserContextData | null;
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
  const [agencyData, setAgencyData] = useState<AgencyData | null>(null);
  const [userAuthData, setUserAuthData] = useState<UserContextData | null>(null);

  const refreshUserData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Atualizando dados do usuário...');
      
      const updatedUserData = await firestoreService.getUserData(user.id);
      if (updatedUserData) {
        setUserData(updatedUserData);
      }
      
      const updatedAuthData = await firestoreService.getUserAuthData(user.id);
      if (updatedAuthData) {
        setUserAuthData(updatedAuthData);
        
        if (updatedAuthData.agencyId) {
          const updatedAgencyData = await firestoreService.getAgencyData(updatedAuthData.agencyId);
          setAgencyData(updatedAgencyData);
        }
      }
      
      console.log('✅ Dados atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('🔄 Usuário autenticado, carregando dados...', firebaseUser.uid);
          
          // Verificar se usuário existe no Firestore
          let userData = await firestoreService.getUserData(firebaseUser.uid);
          
          if (!userData) {
            console.log('👤 Criando novo usuário na coleção users...');
            const newUserData: FirestoreUser = {
              email: firebaseUser.email || '',
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              logobase64: '',
              equipments: [],
              expenses: [],
              jobs: [],
              routine: {
                dailyHours: 8,
                dalilyValue: 0,
                desiredSalary: 0,
                workDays: 22
              },
              userType: 'individual'
            };
            
            await firestoreService.createUser(newUserData);
            userData = newUserData;
            console.log('✅ Usuário criado com dados padrão');
          }

          // Obter dados de autenticação (tipo de usuário, agência, etc.)
          const authData = await firestoreService.getUserAuthData(firebaseUser.uid);
          
          if (!authData) {
            console.error('❌ Erro ao obter dados de autenticação');
            setUser(null);
            setUserData(null);
            setAgencyData(null);
            setUserAuthData(null);
            setLoading(false);
            return;
          }

          // Carregar dados da agência se necessário
          let agencyDataToSet: AgencyData | null = null;
          if (authData.agencyId) {
            agencyDataToSet = await firestoreService.getAgencyData(authData.agencyId);
            console.log('🏢 Dados da agência carregados:', agencyDataToSet?.name);
          }

          // Criar objeto User para o contexto
          const appUser: User = {
            id: firebaseUser.uid,
            email: authData.email,
            name: authData.displayName || firebaseUser.displayName || authData.email.split('@')[0],
            userType: authData.userType,
            createdAt: new Date().toISOString(),
            photoURL: firebaseUser.photoURL || undefined,
            companyId: authData.agencyId
          };

          setUser(appUser);
          setUserData(userData);
          setUserAuthData(authData);
          setAgencyData(agencyDataToSet);

          console.log('✅ Login completo!');
          console.log('👤 Tipo de usuário:', authData.userType);
          console.log('📧 Email:', authData.email);
          console.log('🏢 Agência:', authData.agencyName || 'Nenhuma');
          console.log('🔑 Permissões:', authData.permissions || 'N/A');

        } catch (error) {
          console.error('❌ Erro no processo de autenticação:', error);
          setUser(null);
          setUserData(null);
          setAgencyData(null);
          setUserAuthData(null);
        }
      } else {
        console.log('👋 Usuário não autenticado');
        setUser(null);
        setUserData(null);
        setAgencyData(null);
        setUserAuthData(null);
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
        name: name,
        logobase64: '',
        equipments: [],
        expenses: [],
        jobs: [],
        routine: {
          dailyHours: 8,
          dalilyValue: 0,
          desiredSalary: 0,
          workDays: 22
        },
        userType: 'individual'
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
      userAuthData,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
