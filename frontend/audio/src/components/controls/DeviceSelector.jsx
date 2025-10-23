export default function DeviceSelector({ devices, value, onChange, disabled }) {
  if (!devices || devices.length === 0) {
    return null;
  }

  return (
    <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.92rem' }}>
      Ausgabegerät
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="default">Systemstandard</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Gerät ${device.deviceId}`}
          </option>
        ))}
      </select>
    </label>
  );
}
