import { RefreshCw, Square } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings';

interface HapiStatus {
  running: boolean;
  pid?: number;
  port?: number;
  error?: string;
}

export function HapiSettings() {
  const { t } = useI18n();
  const { hapiSettings, setHapiSettings } = useSettingsStore();
  const [status, setStatus] = React.useState<HapiStatus>({ running: false });
  const [loading, setLoading] = React.useState(false);

  // Local state for inputs
  const [localPort, setLocalPort] = React.useState(String(hapiSettings.webappPort));
  const [localToken, setLocalToken] = React.useState(hapiSettings.cliApiToken);
  const [localTelegramToken, setLocalTelegramToken] = React.useState(hapiSettings.telegramBotToken);
  const [localWebappUrl, setLocalWebappUrl] = React.useState(hapiSettings.webappUrl);
  const [localAllowedChatIds, setLocalAllowedChatIds] = React.useState(hapiSettings.allowedChatIds);

  // Sync local state with store
  React.useEffect(() => {
    setLocalPort(String(hapiSettings.webappPort));
    setLocalToken(hapiSettings.cliApiToken);
    setLocalTelegramToken(hapiSettings.telegramBotToken);
    setLocalWebappUrl(hapiSettings.webappUrl);
    setLocalAllowedChatIds(hapiSettings.allowedChatIds);
  }, [hapiSettings]);

  // Fetch initial status
  React.useEffect(() => {
    window.electronAPI.hapi.getStatus().then(setStatus);

    const cleanup = window.electronAPI.hapi.onStatusChanged(setStatus);
    return cleanup;
  }, []);

  const getConfig = React.useCallback(() => {
    return {
      webappPort: Number(localPort) || 3006,
      cliApiToken: localToken,
      telegramBotToken: localTelegramToken,
      webappUrl: localWebappUrl,
      allowedChatIds: localAllowedChatIds,
    };
  }, [localPort, localToken, localTelegramToken, localWebappUrl, localAllowedChatIds]);

  const saveSettings = React.useCallback(() => {
    const config = getConfig();
    setHapiSettings(config);
  }, [getConfig, setHapiSettings]);

  const handleEnabledChange = async (enabled: boolean) => {
    setLoading(true);
    saveSettings();
    setHapiSettings({ enabled });

    try {
      if (enabled) {
        const config = getConfig();
        await window.electronAPI.hapi.start(config);
      } else {
        await window.electronAPI.hapi.stop();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await window.electronAPI.hapi.stop();
      setHapiSettings({ enabled: false });
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    saveSettings();
    try {
      const config = getConfig();
      await window.electronAPI.hapi.restart(config);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = () => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setLocalToken(token);
    setHapiSettings({ cliApiToken: token });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('Remote Sharing (Hapi)')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('Share agent sessions remotely via Web and Telegram')}
        </p>
      </div>

      {/* Enable Switch */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-sm font-medium">{t('Enable Remote Sharing')}</span>
          <p className="text-xs text-muted-foreground">
            {t('Start Hapi server for remote access')}
            {status.running && status.port && ` (Port: ${status.port})`}
          </p>
        </div>
        <Switch
          checked={hapiSettings.enabled}
          onCheckedChange={handleEnabledChange}
          disabled={loading}
        />
      </div>

      {/* Status indicator */}
      {status.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {status.error}
        </div>
      )}

      {/* Control buttons when running */}
      {status.running && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleStop} disabled={loading}>
            <Square className="mr-1.5 h-3.5 w-3.5" />
            {t('Stop')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestart} disabled={loading}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t('Restart')}
          </Button>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">{t('Configuration')}</h4>

        {/* Server Port */}
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <span className="text-sm font-medium">{t('Server Port')}</span>
          <div className="space-y-1.5">
            <Input
              type="number"
              value={localPort}
              onChange={(e) => setLocalPort(e.target.value)}
              onBlur={() => setHapiSettings({ webappPort: Number(localPort) || 3006 })}
              min={1024}
              max={65535}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">{t('Server listening port')}</p>
          </div>
        </div>

        {/* Access Token */}
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <span className="text-sm font-medium">{t('Access Token')}</span>
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                type="text"
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
                onBlur={() => setHapiSettings({ cliApiToken: localToken })}
                placeholder={t('Auto-generated if empty')}
                className="flex-1 font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleGenerateToken}>
                {t('Generate')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('Access token for CLI and web UI')}</p>
          </div>
        </div>

        {/* Telegram Bot Token */}
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <span className="text-sm font-medium">{t('Telegram Bot Token')}</span>
          <div className="space-y-1.5">
            <Input
              type="password"
              value={localTelegramToken}
              onChange={(e) => setLocalTelegramToken(e.target.value)}
              onBlur={() => setHapiSettings({ telegramBotToken: localTelegramToken })}
              placeholder={t('Optional')}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">{t('Telegram bot token (optional)')}</p>
          </div>
        </div>

        {/* Public URL */}
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <span className="text-sm font-medium">{t('Public URL')}</span>
          <div className="space-y-1.5">
            <Input
              type="url"
              value={localWebappUrl}
              onChange={(e) => setLocalWebappUrl(e.target.value)}
              onBlur={() => setHapiSettings({ webappUrl: localWebappUrl })}
              placeholder="https://example.com"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">{t('Public URL for Telegram Mini App')}</p>
          </div>
        </div>

        {/* Allowed Chat IDs */}
        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <span className="text-sm font-medium">{t('Allowed Chat IDs')}</span>
          <div className="space-y-1.5">
            <Input
              type="text"
              value={localAllowedChatIds}
              onChange={(e) => setLocalAllowedChatIds(e.target.value)}
              onBlur={() => setHapiSettings({ allowedChatIds: localAllowedChatIds })}
              placeholder="123456789,987654321"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              {t('Comma-separated Telegram chat IDs')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
