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
    try {
      const player = this.getSoftClickPlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore audio failure
    }
  }

  public playSuccessTone() {
    try {
      const player = this.getSuccessTonePlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore
    }
  }

  public playTimerBell() {
    try {
      const player = this.getTimerBellPlayer();
      player.seekTo(0);
      player.play();
    } catch {
      // Ignore
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
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
