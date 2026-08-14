import { useContext } from 'react';

// project import
import LoadingOverlayContext from 'contexts/LoadingOverlayContext';

// ==============================|| LOADING OVERLAY HOOK ||============================== //

const useLoadingOverlay = () => {
  const context = useContext(LoadingOverlayContext);

  if (!context) throw new Error('context must be use inside provider');

  return context;
};

export default useLoadingOverlay;
