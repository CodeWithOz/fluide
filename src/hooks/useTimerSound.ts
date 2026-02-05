import { useCallback, useRef } from 'react';

const REPEAT_COUNT = 10;
const REPEAT_INTERVAL_MS = 1000; // 1 second between each sound

/**
 * Hook for playing timer notification sounds using the Web Audio API.
 * Generates tones programmatically without requiring audio files.
 */
export function useTimerSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const repeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playCountRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    // Resume context if it was suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Plays a single two-tone notification sound.
   */
  const playSingleSound = useCallback(() => {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // Play a sequence of two tones for a pleasant notification
    const frequencies = [880, 1108.73]; // A5 and C#6 - a major third interval
    const toneDuration = 0.15;
    const gap = 0.08;

    frequencies.forEach((freq, index) => {
      const startTime = now + index * (toneDuration + gap);

      const oscillator = audioContext.createOscillator();
      const toneGain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);

      // Envelope: quick attack, sustain, quick release
      toneGain.gain.setValueAtTime(0, startTime);
      toneGain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      toneGain.gain.setValueAtTime(0.3, startTime + toneDuration - 0.03);
      toneGain.gain.linearRampToValueAtTime(0, startTime + toneDuration);

      oscillator.connect(toneGain);
      toneGain.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + toneDuration);
    });
  }, [getAudioContext]);

  /**
   * Stops the repeated timer sound playback.
   */
  const stopTimerSound = useCallback(() => {
    if (repeatTimeoutRef.current) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    playCountRef.current = 0;
  }, []);

  /**
   * Plays a pleasant two-tone notification sound repeatedly.
   * Similar to a kitchen timer or phone alarm.
   * Plays up to 10 times, 1 second apart.
   */
  const playTimerSound = useCallback(() => {
    // Stop any existing playback first
    stopTimerSound();

    const playNext = () => {
      if (playCountRef.current >= REPEAT_COUNT) {
        stopTimerSound();
        return;
      }

      playSingleSound();
      playCountRef.current += 1;

      if (playCountRef.current < REPEAT_COUNT) {
        repeatTimeoutRef.current = setTimeout(playNext, REPEAT_INTERVAL_MS);
      }
    };

    playNext();
  }, [playSingleSound, stopTimerSound]);

  return { playTimerSound, stopTimerSound };
}
