import { useContext } from 'react';

// auth provider
import SuperAdminContext from 'contexts/SuperAdminContext';

// ==============================|| SUPER ADMIN AUTH HOOKS ||============================== //

const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);

  if (!context) throw new Error('context must be use inside provider');

  return context;
};

export default useSuperAdmin;
