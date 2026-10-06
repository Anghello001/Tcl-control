// Cross-browser Fullscreen & Screen Orientation Manager
export class FullscreenManager {
  // Check if currently in fullscreen
  public static isFullscreen(): boolean {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }

  // Request fullscreen
  public static async enterFullscreen(element?: HTMLElement): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const el: any = element || document.documentElement;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }

      // Try locking orientation to landscape for optimal gamepad layout if supported
      if (typeof screen !== 'undefined' && (screen.orientation as any)?.lock) {
        try {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        } catch {}
      }

      return true;
    } catch (err) {
      console.warn('No se pudo activar pantalla completa:', err);
      return false;
    }
  }

  // Exit fullscreen
  public static async exitFullscreen(): Promise<boolean> {
    if (typeof document === 'undefined') return false;
    const doc: any = document;

    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }

      // Unlock orientation
      if (typeof screen !== 'undefined' && screen.orientation?.unlock) {
        try {
          screen.orientation.unlock();
        } catch {}
      }

      return true;
    } catch (err) {
      console.warn('Error saliendo de pantalla completa:', err);
      return false;
    }
  }

  // Toggle fullscreen
  public static async toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
      return false;
    } else {
      await this.enterFullscreen(element);
      return true;
    }
  }
}
