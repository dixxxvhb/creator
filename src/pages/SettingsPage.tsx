import { Sun, Moon } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useUIStore } from '@/stores/uiStore';

export function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <PageContainer title="Settings">
      <div className="space-y-6 max-w-2xl">
        {/* Appearance */}
        <Card
          header={<h3 className="text-sm font-semibold text-slate-200">Appearance</h3>}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={18} className="text-slate-400" />
              ) : (
                <Sun size={18} className="text-warning-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-200">Theme</p>
                <p className="text-xs text-slate-500">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <Toggle
              checked={theme === 'light'}
              onChange={toggleTheme}
              label={theme === 'light' ? 'Light' : 'Dark'}
            />
          </div>
        </Card>

        {/* Profile placeholder */}
        <Card
          header={<h3 className="text-sm font-semibold text-slate-200">Profile</h3>}
        >
          <Input
            label="Display Name"
            placeholder="Your name"
            disabled
          />
          <p className="text-xs text-slate-500 mt-2">
            Profile settings will be available after auth is connected.
          </p>
        </Card>

        {/* Stage defaults placeholder */}
        <Card
          header={
            <h3 className="text-sm font-semibold text-slate-200">Default Stage Size</h3>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Width (px)"
              type="number"
              placeholder="800"
              disabled
            />
            <Input
              label="Depth (px)"
              type="number"
              placeholder="600"
              disabled
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Stage size defaults will apply to new pieces. Coming soon.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
