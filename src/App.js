import { RouterProvider } from 'react-router-dom';

// project import
import router from 'routes';
import ThemeCustomization from 'themes';

import Locales from 'components/Locales';
// import RTLLayout from 'components/RTLLayout';
import ScrollTop from 'components/ScrollTop';
import Snackbar from 'components/@extended/Snackbar';
import Notistack from 'components/third-party/Notistack';
import LoadingOverlay from 'components/LoadingOverlay';

// auth provider
import { JWTProvider as AuthProvider } from './contexts/JWTContext';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { LoadingOverlayProvider } from './contexts/LoadingOverlayContext';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

const App = () => (
  <ThemeCustomization>
    {/* <RTLLayout> */}
    <Locales>
      <ScrollTop>
        <AuthProvider>
          <SuperAdminProvider>
            <LoadingOverlayProvider>
              <Notistack>
                <RouterProvider router={router} />
                <Snackbar />
                <LoadingOverlay />
              </Notistack>
            </LoadingOverlayProvider>
          </SuperAdminProvider>
        </AuthProvider>
      </ScrollTop>
    </Locales>
    {/* </RTLLayout> */}
  </ThemeCustomization>
);

export default App;
