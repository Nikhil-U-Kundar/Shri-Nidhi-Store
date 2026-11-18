import { AppProviders } from './providers/AppProviders';
import { AppShell } from './AppShell';

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
