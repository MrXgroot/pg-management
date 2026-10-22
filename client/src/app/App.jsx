import { AppProviders } from "./providers.jsx";
import { AppRouter } from "./router.jsx";
import { MobileDeviceFrame } from "../components/MobileDeviceFrame.jsx";
export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
