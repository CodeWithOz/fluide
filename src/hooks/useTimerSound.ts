import { useCallback, useRef } from 'react';

/**
 * Hook for playing timer notification sounds using the Web Audio API.
 * Generates tones programmatically without requiring audio files.
 */
export function useTimerSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

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
   * Plays a pleasant two-tone notification sound.
   * Similar to a kitchen timer or phone alarm.
   */
  const playTimerSound = useCallback(() => {
    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // Create a gain node for volume control and fade out
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.3, now);

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

  return { playTimerSound };
}
