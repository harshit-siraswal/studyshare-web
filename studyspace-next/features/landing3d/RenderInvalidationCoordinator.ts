type DebugListener = (activeReasons: number) => void;

export class RenderInvalidationCoordinator {
  private invalidate: (() => void) | null = null;
  private activeReasons = new Set<string>();
  private rafId: number | null = null;
  private debugListener: DebugListener | null = null;

  setInvalidator(invalidator: () => void) {
    this.invalidate = invalidator;
  }

  setDebugListener(listener: DebugListener | null) {
    this.debugListener = listener;
  }

  activate(reason: string) {
    this.activeReasons.add(reason);
    this.notify();
    this.ensureLoop();
  }

  deactivate(reason: string) {
    this.activeReasons.delete(reason);
    this.notify();
    if (this.activeReasons.size === 0 && this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pulse(reason: string, ms = 240) {
    this.activate(reason);
    window.setTimeout(() => this.deactivate(reason), ms);
  }

  destroy() {
    this.activeReasons.clear();
    this.notify();
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.invalidate = null;
  }

  private ensureLoop() {
    if (this.rafId !== null) return;

    const tick = () => {
      this.rafId = null;
      if (!this.invalidate) return;

      this.invalidate();

      if (this.activeReasons.size > 0) {
        this.rafId = window.requestAnimationFrame(tick);
      }
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  private notify() {
    if (this.debugListener) {
      this.debugListener(this.activeReasons.size);
    }
  }
}
