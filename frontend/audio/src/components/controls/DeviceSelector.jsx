import { useTranslation } from 'react-i18next';

export default function DeviceSelector({ devices, value, onChange, disabled }) {
  const { t } = useTranslation();

  if (!devices || devices.length === 0) {
    return null;
  }

  return (
    <label className="device-selector" style={{ display: 'grid', gap: '0.3rem', fontSize: '0.92rem' }}>
      {t('devices.label')}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="default">{t('devices.systemDefault')}</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || t('devices.unnamed', { id: device.deviceId })}
          </option>
        ))}
      </select>
    </label>
  );
}
