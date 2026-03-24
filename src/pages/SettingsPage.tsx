import { useState } from 'react';
import { Check, Sun, Moon, Monitor } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProfileStore } from '@/stores/profileStore';
import { useTierStore } from '@/stores/tierStore';
import { ACCENT_PRESETS, TIER_LABELS } from '@/types';
import type { Tier } from '@/types';
import { cn } from '@/lib/utils';

type ThemePref = 'light' | 'dark' | 'system';

const themeOptions: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SettingsPage() {
  const {
    displayName,
    studioName,
    customGreeting,
    accentColor,
    themePreference,
    defaultStageWidth,
    defaultStageDepth,
    setDisplayName,
    setStudioName,
    setCustomGreeting,
    setAccentColor,
    setTheme,
    setDefaultStageWidth,
    setDefaultStageDepth,
  } = useProfileStore();

  const tier = useTierStore((s) => s.tier);
  const setTier = useTierStore((s) => s.setTier);

  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const isCustomColor = !ACCENT_PRESETS.some((p) => p.value === accentColor);

  return (
    <PageContainer title="Settings">
      <div className="space-y-8 max-w-2xl">
        {/* Subscription Section (Dev Only) */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
            Subscription (Dev Only)
          </h2>
          <Card>
            <div className="flex gap-2">
              {(['free', 'mid', 'studio'] as const).map((t) => (
                <Button
                  key={t}
                  variant={tier === t ? 'primary' : 'secondary'}
                  onClick={() => setTier(t as Tier)}
                >
                  {TIER_LABELS[t]}
                </Button>
              ))}
            </div>
          </Card>
        </section>

        {/* Studio Section */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
            Studio
          </h2>
          <Card>
            <div className="space-y-5">
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Studio Name"
                placeholder="e.g. Momentum Dance Company"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
              />
              <div>
                <Input
                  label="Custom Greeting"
                  placeholder="e.g. Let's create, {name}"
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                />
                <p className="text-xs text-text-tertiary mt-1.5">
                  Replaces "Welcome back" on the home page.
                  {customGreeting && (
                    <span className="block mt-1 text-text-secondary">
                      Preview: <strong>{customGreeting}</strong>
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-1">
                <label className="text-sm font-medium text-text-secondary block mb-1.5">
                  Studio Logo
                </label>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-secondary">
                  <div className="w-10 h-10 rounded-lg bg-border flex items-center justify-center">
                    <span className="text-text-tertiary text-xs">Logo</span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Available after sign-in is enabled
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-1.5">
                  Profile Photo
                </label>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-secondary">
                  <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center">
                    <span className="text-text-tertiary text-xs">
                      {displayName ? displayName[0]?.toUpperCase() : '?'}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Available after sign-in is enabled
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
            Appearance
          </h2>
          <Card>
            <div className="space-y-6">
              {/* Theme selector */}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-3">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-surface-secondary rounded-xl">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                        themePreference === value
                          ? 'bg-surface-elevated shadow-sm text-text-primary'
                          : 'text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent color picker */}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-3">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setAccentColor(preset.value);
                        setShowCustomPicker(false);
                      }}
                      className={cn(
                        'w-10 h-10 rounded-xl transition-all relative',
                        'hover:scale-110 active:scale-95',
                        accentColor === preset.value && 'ring-2 ring-offset-2 ring-offset-surface',
                      )}
                      style={{
                        backgroundColor: preset.value,
                        ...(accentColor === preset.value ? { boxShadow: `0 0 0 2px var(--color-surface), 0 0 0 4px ${preset.value}` } : {}),
                      }}
                      title={preset.label}
                    >
                      {accentColor === preset.value && (
                        <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                  {/* Custom color button */}
                  <button
                    onClick={() => setShowCustomPicker(true)}
                    className={cn(
                      'w-10 h-10 rounded-xl border-2 border-dashed border-border transition-all',
                      'hover:scale-110 active:scale-95 flex items-center justify-center',
                      isCustomColor && 'ring-2 ring-offset-2 ring-offset-surface',
                    )}
                    style={isCustomColor ? {
                      backgroundColor: accentColor,
                      borderStyle: 'solid',
                      borderColor: accentColor,
                      boxShadow: `0 0 0 2px var(--color-surface), 0 0 0 4px ${accentColor}`,
                    } : {}}
                    title="Custom color"
                  >
                    {isCustomColor ? (
                      <Check size={16} className="text-white drop-shadow-sm" />
                    ) : (
                      <span className="text-text-tertiary text-xs font-bold">+</span>
                    )}
                  </button>
                </div>
                {showCustomPicker && (
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <span className="text-sm text-text-secondary font-mono">
                      {accentColor.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Stage Defaults Section */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 px-1">
            Stage Defaults
          </h2>
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Width (px)"
                type="number"
                value={defaultStageWidth}
                onChange={(e) => setDefaultStageWidth(parseInt(e.target.value) || 800)}
                min={400}
                max={1600}
              />
              <Input
                label="Depth (px)"
                type="number"
                value={defaultStageDepth}
                onChange={(e) => setDefaultStageDepth(parseInt(e.target.value) || 600)}
                min={300}
                max={1200}
              />
            </div>
            <p className="text-xs text-text-tertiary mt-3">
              Stage size applied to new pieces.
            </p>
          </Card>
        </section>
      </div>
    </PageContainer>
  );
}
