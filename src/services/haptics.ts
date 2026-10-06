// Web Vibration API wrapper for gamepad rumble
class HapticFeedback {
  public enabled: boolean = true;

  // Short tactile pulse for button tap
  public lightTap() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(15);
    } catch {}
  }

  // Medium rumble for trigger pull / selection
  public mediumImpact() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(35);
    } catch {}
  }

  // Heavy rumble for stick click, turbo firing, explosion
  public heavyImpact() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([40, 20, 40]);
    } catch {}
  }

  // Custom pulse pattern
  public customPattern(pattern: number[]) {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

export const haptics = new HapticFeedback();
