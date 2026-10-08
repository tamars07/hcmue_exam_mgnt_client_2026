import { useContext } from 'react';

// project import
import ConfirmContext from 'contexts/ConfirmContext';

// ==============================|| CONFIRM HOOK ||============================== //

const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (!context) throw new Error('context must be use inside provider');

  return context;
};

export default useConfirm;
