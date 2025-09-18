import { useState, useEffect } from 'react';
import { calculateCurrentDuration } from '../utils/timeUtils';

export const useTimer = (startTime: string | null, isRunning: boolean) => {
  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    let interval: number;

    if (isRunning && startTime) {
      // Update immediately
      setCurrentDuration(calculateCurrentDuration(startTime));

      // Then update every second
      interval = setInterval(() => {
        setCurrentDuration(calculateCurrentDuration(startTime));
      }, 1000);
    } else {
      setCurrentDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [startTime, isRunning]);

  return currentDuration;
};