export type Disposer = (() => void) | { dispose(): void }

export class Disposable {
  private _isDisposed = false
  private _disposers: Disposer[] = []
  get isDisposed() {
    return this._isDisposed
  }

  register<T extends Disposer>(disposable: T): T {
    if (this.isDisposed) {
    } else {
      this._disposers.push(disposable)
    }
    return disposable
  }

  unregister<T extends Disposer>(disposable: T): T {
    this._disposers = this._disposers.filter((d) => d !== disposable)
    return disposable
  }

  dispose() {
    if (this.isDisposed) {
      // console.warn('dispose() when already disposed', this, this.constructor)
      return
    }

    for (let i = this._disposers.length - 1; i >= 0; i--) {
      try {
        const cb = this._disposers[i]!
        if (typeof cb === 'function') {
          cb()
        } else {
          cb.dispose()
        }
      } catch (error) {
        try {
          this.handleDisposerError(error)
        } catch (e) {
          console.error('error in handleDisposerError', e, error)
        }
      }
    }

    this._disposers = []
    this._isDisposed = true
  }

  handleDisposerError(error: unknown) {
    console.error(error)
  }
}
