/**
 * Subtle sound and haptic feedback.
 * Ports the web app's Web Audio oscillator synthesis to pre-rendered tone assets
 * (see scripts/generate-tones.js), since React Native has no AudioContext/oscillator API.
 */
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

class AudioService {
  private softClickPlayer: AudioPlayer | null = null;
  private successTonePlayer: AudioPlayer | null = null;
  private timerBellPlayer: AudioPlayer | null = null;

  /**
   * Mirrors the Settings toggles.
   *
   * These are plain fields rather than a `dbEngine` read because this service is called
   * from ~76 places including tap handlers, and reaching into the database on every tap
   * to re-check a boolean would be wasteful. `DatabaseContext` pushes the current values
   * in on every change instead (see syncFromSettings).
   */
  private soundEnabled = true;
  private hapticEnabled = true;

  /** Called whenever settings change so playback honours the user's choice. */
  public syncFromSettings(settings: { soundEnabled?: boolean; hapticEnabled?: boolean }) {
    this.soundEnabled = settings.soundEnabled !== false;
    this.hapticEnabled = settings.hapticEnabled !== false;
  }

  private getSoftClickPlayer(): AudioPlayer {
    if (!this.softClickPlayer) {
      this.softClickPlayer = createAudioPlayer(require('../../assets/sounds/soft-click.wav'));
    }
    return this.softClickPlayer;
  }

  private getSuccessTonePlayer(): AudioPlayer {
    if (!this.successTonePlayer) {
      this.successTonePlayer = createAudioPlayer(require('../../assets/sounds/success-tone.wav'));
    }
    return this.successTonePlayer;
  }

  private getTimerBellPlayer(): AudioPlayer {
    if (!this.timerBellPlayer) {
      this.timerBellPlayer = createAudioPlayer(require('../../assets/sounds/timer-bell.wav'));
    }
    return this.timerBellPlayer;
  }

  public playSoftClick() {
    if (!this.soundEnabled) return;
    try {
      const player = this.getSoftClickPlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore audio failure
    }
  }

  public playSuccessTone() {
    if (!this.soundEnabled) return;
    try {
      const player = this.getSuccessTonePlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore
    }
  }

  public playTimerBell() {
    if (!this.soundEnabled) return;
    try {
      const player = this.getTimerBellPlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
    if (!this.hapticEnabled) return;
    try {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
  }
}

export const audioService = new AudioService();
