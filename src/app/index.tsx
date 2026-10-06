// import BusinessOwnerScreen from '@/screens/BusinessOwner';
// import BusinessDeveloperScreens from '@/screens/BusinessDev';
// import AuthenticationScreen from '@/screens/Authentication';
// import AdministrationScreen from '@/screens/Administration';

import LandingPageScreen from '@/screens/LandingPage';
import { BrowserRouter } from 'react-router';

export default function OctaPAppEntryPoint() {
  return <ProvidedApp />;
}

function ProvidedApp() {
  return (
    <BrowserRouter>
      <LandingPageScreen />
    </BrowserRouter>
  );
}
