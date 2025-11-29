import { useEffect, useRef, useState } from 'react';

const ZERO_TIMER = {
  remainingSeconds: 0,
  extraElapsedSeconds: 0,
  halftimePauseRemaining: 0
};

function snapshotFromScoreboard(scoreboard) {
  if (!scoreboard) {
    return { ...ZERO_TIMER };
  }
  return {
    remainingSeconds: Math.max(0, Math.trunc(scoreboard.remainingSeconds ?? 0)),
    extraElapsedSeconds: Math.max(0, Math.trunc(scoreboard.extraElapsedSeconds ?? 0)),
    halftimePauseRemaining: Math.max(0, Math.trunc(scoreboard.halftimePauseRemaining ?? 0))
  };
}

export default function useLocalTimer(scoreboard) {
  const [timer, setTimer] = useState(() => snapshotFromScoreboard(scoreboard));
  const timerRef = useRef(timer);
  const flagsRef = useRef({
    isRunning: Boolean(scoreboard?.isRunning),
    isHalftimeBreak: Boolean(scoreboard?.isHalftimeBreak),
    isExtraTime: Boolean(scoreboard?.isExtraTime)
  });

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    const serverSnapshot = snapshotFromScoreboard(scoreboard);
    const prevFlags = flagsRef.current;
    const nextFlags = {
      isRunning: Boolean(scoreboard?.isRunning),
      isHalftimeBreak: Boolean(scoreboard?.isHalftimeBreak),
      isExtraTime: Boolean(scoreboard?.isExtraTime)
    };

    let shouldSync = !scoreboard || (!nextFlags.isRunning && !nextFlags.isHalftimeBreak);

    if (
      !shouldSync &&
      (prevFlags.isRunning !== nextFlags.isRunning ||
        prevFlags.isHalftimeBreak !== nextFlags.isHalftimeBreak ||
        prevFlags.isExtraTime !== nextFlags.isExtraTime)
    ) {
      shouldSync = true;
    }

    if (!shouldSync) {
      const local = timerRef.current;
      const tolerance = nextFlags.isRunning || nextFlags.isHalftimeBreak ? 1 : 0;
      const deltaRemaining = Math.abs(serverSnapshot.remainingSeconds - local.remainingSeconds);
      const deltaExtra = Math.abs(serverSnapshot.extraElapsedSeconds - local.extraElapsedSeconds);
      const deltaHalftime = Math.abs(
        serverSnapshot.halftimePauseRemaining - local.halftimePauseRemaining
      );

      if (deltaRemaining > tolerance || deltaExtra > tolerance || deltaHalftime > tolerance) {
        shouldSync = true;
      }
    }

    flagsRef.current = nextFlags;

    if (shouldSync) {
      timerRef.current = serverSnapshot;
      setTimer(serverSnapshot);
    }
  }, [
    scoreboard?.remainingSeconds,
    scoreboard?.extraElapsedSeconds,
    scoreboard?.halftimePauseRemaining,
    scoreboard?.isRunning,
    scoreboard?.isHalftimeBreak,
    scoreboard?.isExtraTime
  ]);

  useEffect(() => {
    if (!scoreboard?.isRunning && !scoreboard?.isHalftimeBreak) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimer((prev) => {
        let next = prev;
        if (scoreboard?.isRunning || scoreboard?.isHalftimeBreak) {
          next = {
            remainingSeconds: prev.remainingSeconds,
            extraElapsedSeconds: prev.extraElapsedSeconds,
            halftimePauseRemaining: prev.halftimePauseRemaining
          };

          if (scoreboard?.isRunning) {
            next.remainingSeconds = Math.max(0, next.remainingSeconds - 1);
            if (scoreboard?.isExtraTime) {
              next.extraElapsedSeconds = next.extraElapsedSeconds + 1;
            }
          }

          if (scoreboard?.isHalftimeBreak) {
            next.halftimePauseRemaining = Math.max(0, next.halftimePauseRemaining - 1);
          }
        }

        timerRef.current = next;
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [scoreboard?.isRunning, scoreboard?.isHalftimeBreak, scoreboard?.isExtraTime]);

  return timer;
}
