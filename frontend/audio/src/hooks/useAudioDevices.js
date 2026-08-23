import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_DEVICE_ID = 'default';

export default function useAudioDevices(audioElementRef) {
  const { t } = useTranslation();
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [deviceError, setDeviceError] = useState('');

  const refreshAudioOutputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setAudioDevices(outputs);
    } catch (error) {
      console.warn('Audioausgabegeräte konnten nicht ermittelt werden:', error);
      setDeviceError(t('errors.devicesNotFound'));
    }
  }, [t]);

  const applyDevice = useCallback(
    async (deviceId) => {
      const audioEl = audioElementRef.current;
      if (!audioEl) {
        return;
      }

      if (typeof audioEl.setSinkId !== 'function') {
        if (deviceId !== DEFAULT_DEVICE_ID) {
          setDeviceError(t('errors.sinkNotSupported'));
        }
        return;
      }

      try {
        await audioEl.setSinkId(deviceId);
      } catch (error) {
        console.error('Ausgabegerät konnte nicht gesetzt werden:', error);
        setDeviceError(t('errors.sinkFailed'));
      }
    },
    [audioElementRef, t]
  );

  const selectDevice = useCallback(
    async (deviceId) => {
      setDeviceError('');
      setSelectedDeviceId(deviceId);
      await applyDevice(deviceId);
    },
    [applyDevice]
  );

  const applyCurrentDevice = useCallback(async () => {
    await applyDevice(selectedDeviceId);
  }, [applyDevice, selectedDeviceId]);

  useEffect(() => {
    if (audioDevices.length === 0) {
      return;
    }
    if (
      selectedDeviceId !== DEFAULT_DEVICE_ID &&
      !audioDevices.some((device) => device.deviceId === selectedDeviceId)
    ) {
      setSelectedDeviceId(DEFAULT_DEVICE_ID);
    }
  }, [audioDevices, selectedDeviceId]);

  return {
    audioDevices,
    selectedDeviceId,
    deviceError,
    setDeviceError,
    refreshAudioOutputs,
    selectDevice,
    applyCurrentDevice
  };
}
