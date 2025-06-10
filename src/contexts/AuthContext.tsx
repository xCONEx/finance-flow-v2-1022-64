
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
  companyData: any | null;
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
  const [companyData, setCompanyData] = useState<any | null>(null);

  const refreshUserData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Atualizando dados do usuário...');
      
      // Recarregar dados do usuário
      const updatedUserData = await firestoreService.getUserData(user.id);
      if (updatedUserData) {
        setUserData(updatedUserData);
        console.log('✅ Dados do usuário atualizados');
      }
      
      // Recarregar dados da empresa se aplicável
      if (user.userType === 'company_owner' || user.userType === 'company_colab') {
        const allCompanies = await firestoreService.getAllCompanies();
        
        for (const company of allCompanies) {
          const companyDataObj = company as any;
          
          const isOwner = user.userType === 'company_owner' && companyDataObj.ownerUid === user.id;
          const isCollaborator = user.userType === 'company_colab' && 
            companyDataObj.collaborators && Array.isArray(companyDataObj.collaborators) && 
            companyDataObj.collaborators.some((colab: any) => 
              colab.uid === user.id || colab.email === user.email
            );
          
          if (isOwner || isCollaborator) {
            setCompanyData(companyDataObj);
            console.log('✅ Dados da empresa atualizados');
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
              },
              userType: 'individual' // Novo campo para identificar tipo de usuário
            };
            
            await firestoreService.createUser(newUserData);
            userData = newUserData;
            console.log('✅ Usuário criado com dados padrão');
          }

          // Determinar tipo de usuário baseado no campo userType do documento
          let userType: 'individual' | 'company_owner' | 'company_colab' | 'admin' = userData.userType || 'individual';
          
          // Verificar se é admin pelo email
          const isAdmin = firebaseUser.email === 'adm.financeflow@gmail.com' || firebaseUser.email === 'yuriadrskt@gmail.com';
          if (isAdmin) {
            userType = 'admin';
            // Atualizar o tipo no documento se necessário
            if (userData.userType !== 'admin') {
              await firestoreService.updateUserType(firebaseUser.uid, 'admin');
            }
          }
          
          // Buscar dados da empresa se for company_owner ou company_colab
          let userCompany = null;
          if (userType === 'company_owner' || userType === 'company_colab') {
            try {
              console.log('🏢 Verificando empresas para usuário:', userType);
              const allCompanies = await firestoreService.getAllCompanies();
              
              for (const company of allCompanies) {
                const companyDataObj = company as any;
                
                const isOwner = userType === 'company_owner' && companyDataObj.ownerUid === firebaseUser.uid;
                const isCollaborator = userType === 'company_colab' && 
                  companyDataObj.collaborators && Array.isArray(companyDataObj.collaborators) && 
                  companyDataObj.collaborators.some((colab: any) => 
                    colab.uid === firebaseUser.uid || colab.email === firebaseUser.email
                  );
                
                if (isOwner || isCollaborator) {
                  userCompany = companyDataObj;
                  console.log('🏢 Empresa encontrada:', companyDataObj.id);
                  break;
                }
              }
              
              setCompanyData(userCompany);
            } catch (error) {
              console.error('❌ Erro ao buscar empresas:', error);
              setCompanyData(null);
            }
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

        } catch (error) {
          console.error('❌ Erro ao carregar dados do usuário:', error);
        }
      } else {
        console.log('👋 Usuário não autenticado');
        setUser(null);
        setUserData(null);
        setCompanyData(null);
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
      companyData,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
