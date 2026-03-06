import { useState } from 'react';
import type { DataSource, DataSourceType, DataSourceCreate } from '@/api/dataSources';

interface DataSourceFormProps {
  initial?: DataSource;
  sourceType: DataSourceType;
  onSubmit: (data: DataSourceCreate) => void;
  onCancel: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  display: 'block',
};

export default function DataSourceForm({ initial, sourceType, onSubmit, onCancel }: DataSourceFormProps) {
  const initialConfig = initial?.config as Record<string, unknown> | undefined;

  // Common
  const [name, setName] = useState(initial?.name || '');

  // MIRC Directory
  const [dirPath, setDirPath] = useState((initialConfig?.directory_path as string) || '');
  const [filePattern, setFilePattern] = useState(
    (initialConfig?.file_pattern as string) || (sourceType === 'excel_directory' ? '*.xlsx' : '*.log'),
  );
  const [pollInterval, setPollInterval] = useState(
    (initialConfig?.poll_interval_seconds as number) || (sourceType === 'excel_directory' ? 120 : 60),
  );

  // IRC Server
  const [host, setHost] = useState((initialConfig?.host as string) || '');
  const [port, setPort] = useState((initialConfig?.port as number) || 6667);
  const [useSsl, setUseSsl] = useState((initialConfig?.use_ssl as boolean) ?? false);
  const [nick, setNick] = useState((initialConfig?.nick as string) || '');
  const [channels, setChannels] = useState(
    Array.isArray(initialConfig?.channels) ? (initialConfig.channels as string[]).join(', ') : '',
  );
  const [bufferSeconds, setBufferSeconds] = useState((initialConfig?.buffer_seconds as number) || 30);

  // Excel Directory
  const [templateId, setTemplateId] = useState<string>(
    initialConfig?.template_id != null ? String(initialConfig.template_id) : '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let config: Record<string, unknown> = {};

    if (sourceType === 'mirc_directory') {
      config = {
        directory_path: dirPath,
        file_pattern: filePattern,
        poll_interval_seconds: pollInterval,
      };
    } else if (sourceType === 'irc_server') {
      const channelList = channels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      config = {
        host,
        port,
        use_ssl: useSsl,
        nick,
        channels: channelList,
        buffer_seconds: bufferSeconds,
      };
    } else if (sourceType === 'excel_directory') {
      config = {
        directory_path: dirPath,
        file_pattern: filePattern,
        poll_interval_seconds: pollInterval,
        template_id: templateId ? Number(templateId) : null,
      };
    }

    onSubmit({
      name,
      source_type: sourceType,
      config,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="grid gap-3 mb-4 grid-cols-2"
      >
        {/* Name - always shown */}
        <div className="col-span-full">
          <label style={labelStyle}>SOURCE NAME</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., BN S4 Chat Logs"
            required
          />
        </div>

        {/* MIRC Directory fields */}
        {sourceType === 'mirc_directory' && (
          <>
            <div className="col-span-full">
              <label style={labelStyle}>DIRECTORY PATH</label>
              <input
                style={inputStyle}
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
                placeholder="/data/mirc/logs"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>FILE PATTERN</label>
              <input
                style={inputStyle}
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                placeholder="*.log"
              />
            </div>
            <div>
              <label style={labelStyle}>POLL INTERVAL (SEC)</label>
              <input
                style={inputStyle}
                type="number"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                min={10}
              />
            </div>
          </>
        )}

        {/* IRC Server fields */}
        {sourceType === 'irc_server' && (
          <>
            <div>
              <label style={labelStyle}>HOST / IP</label>
              <input
                style={inputStyle}
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="irc.example.mil"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>PORT</label>
              <input
                style={inputStyle}
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                min={1}
                max={65535}
              />
            </div>
            <div>
              <label style={labelStyle}>USE SSL</label>
              <div
                className="flex items-center gap-2 py-2 px-0"
              >
                <input
                  type="checkbox"
                  checked={useSsl}
                  onChange={(e) => setUseSsl(e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                <span
                  className="font-[var(--font-mono)] text-[11px] text-[var(--color-text)]"
                >
                  {useSsl ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>NICK</label>
              <input
                style={inputStyle}
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="KEYSTONE-BOT"
                required
              />
            </div>
            <div className="col-span-full">
              <label style={labelStyle}>CHANNELS (COMMA SEPARATED)</label>
              <input
                style={inputStyle}
                value={channels}
                onChange={(e) => setChannels(e.target.value)}
                placeholder="#rgt-log, #bn-supply, #maint-ops"
                required
              />
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1"
              >
                Enter channel names separated by commas. Include # prefix.
              </div>
            </div>
            <div>
              <label style={labelStyle}>BUFFER SECONDS</label>
              <input
                style={inputStyle}
                type="number"
                value={bufferSeconds}
                onChange={(e) => setBufferSeconds(Number(e.target.value))}
                min={5}
              />
            </div>
          </>
        )}

        {/* Excel Directory fields */}
        {sourceType === 'excel_directory' && (
          <>
            <div className="col-span-full">
              <label style={labelStyle}>DIRECTORY PATH</label>
              <input
                style={inputStyle}
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
                placeholder="/data/gcss-mc/exports"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>FILE PATTERN</label>
              <input
                style={inputStyle}
                value={filePattern}
                onChange={(e) => setFilePattern(e.target.value)}
                placeholder="*.xlsx"
              />
            </div>
            <div>
              <label style={labelStyle}>POLL INTERVAL (SEC)</label>
              <input
                style={inputStyle}
                type="number"
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                min={10}
              />
            </div>
            <div>
              <label style={labelStyle}>TEMPLATE ID (OPTIONAL)</label>
              <input
                style={inputStyle}
                type="number"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Schema mapping template"
              />
              <div
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1"
              >
                Link to a schema mapping template for structured extraction.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 bg-transparent border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--color-text-muted)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="py-2 px-4 bg-[var(--color-accent)] border-0 rounded-[var(--radius)] text-[var(--color-bg)] font-[var(--font-mono)] text-[11px] font-semibold tracking-[1px] uppercase cursor-pointer"
        >
          {initial ? 'UPDATE' : 'CREATE'} SOURCE
        </button>
      </div>
    </form>
  );
}
