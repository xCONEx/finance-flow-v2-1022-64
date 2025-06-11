
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, userAuthData, agencyData } = useAuth();

  console.log('🔍 Navigation - Dados do usuário:', {
    userType: user?.userType,
    hasAgencyData: userAuthData?.hasAgencyData,
    agencyName: userAuthData?.agencyName,
    permissions: userAuthData?.permissions
  });

  const canAccessCompanyMenu = () => {
    if (!user || !userAuthData) return false;
    
    // Admin, owner ou collaborator podem acessar o menu da empresa
    return ['admin', 'owner', 'collaborator'].includes(userAuthData.userType) && userAuthData.hasAgencyData;
  };

  const showCompanyMenu = canAccessCompanyMenu();
  
  console.log('👀 Navigation - Mostrar menu empresa:', showCompanyMenu);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="text-xl font-bold text-purple-600">
              FinanceFlow
            </div>
            
            <div className="flex space-x-4">
              <a href="#dashboard" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md">
                Dashboard
              </a>
              
              {showCompanyMenu && (
                <a href="#empresa" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md">
                  Empresa
                </a>
              )}
              
              <a href="#jobs" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md">
                Trabalhos
              </a>
              
              {user?.userType === 'admin' && (
                <a href="#admin" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md">
                  Admin
                </a>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userAuthData?.agencyName ? `${userAuthData.agencyName} - ` : ''}
              {userAuthData?.userType === 'owner' ? 'Proprietário' : 
               userAuthData?.userType === 'collaborator' ? `Colaborador (${userAuthData.permissions})` :
               userAuthData?.userType === 'admin' ? 'Administrador' : 'Individual'}
            </span>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
