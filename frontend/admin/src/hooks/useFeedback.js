import { useCallback, useState } from 'react';

export default function useFeedback() {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const clear = useCallback(() => {
    setError('');
    setInfo('');
  }, []);

  const showError = useCallback((message) => {
    setError(message);
    setInfo('');
  }, []);

  const showInfo = useCallback((message) => {
    setInfo(message);
    setError('');
  }, []);

  const updateMessage = useCallback(
    (type, message) => {
      if (!message) {
        clear();
        return;
      }
      if (type === 'error') {
        showError(message);
      } else {
        showInfo(message);
      }
    },
    [clear, showError, showInfo]
  );

  return {
    error,
    info,
    showError,
    showInfo,
    clear,
    updateMessage
  };
}
