import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from './event'

describe('EventEmitter', () => {
  // 定义测试用的事件类型
  type TestEvents = {
    stringEvent: string
    numberEvent: number
    objectEvent: { data: string }
  }

  it('should register and trigger event handlers', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('stringEvent', handler)
    emitter.emit('stringEvent', 'test')

    expect(handler).toHaveBeenCalledWith('test')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple handlers for same event', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('numberEvent', handler1)
    emitter.on('numberEvent', handler2)
    emitter.emit('numberEvent', 42)

    expect(handler1).toHaveBeenCalledWith(42)
    expect(handler2).toHaveBeenCalledWith(42)
  })

  it('should remove event handler correctly', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler = vi.fn()

    emitter.on('stringEvent', handler)
    emitter.off('stringEvent', handler)
    emitter.emit('stringEvent', 'test')

    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle complex event payload', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler = vi.fn()
    const payload = { data: 'test-data' }

    emitter.on('objectEvent', handler)
    emitter.emit('objectEvent', payload)

    expect(handler).toHaveBeenCalledWith(payload)
  })

  it('should return unsubscribe function from on()', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler = vi.fn()

    const unsubscribe = emitter.on('stringEvent', handler)
    emitter.emit('stringEvent', 'first')
    unsubscribe()
    emitter.emit('stringEvent', 'second')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('first')
  })

  it('should not affect other handlers when removing one', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('numberEvent', handler1)
    emitter.on('numberEvent', handler2)
    emitter.off('numberEvent', handler1)
    emitter.emit('numberEvent', 42)

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledWith(42)
  })

  it('should handle removal of non-existent handler', () => {
    const emitter = new EventEmitter<TestEvents>()
    const handler = vi.fn()

    // 不应该抛出错误
    expect(() => {
      emitter.off('stringEvent', handler)
    }).not.toThrow()
  })

  it('should handle emission of event with no handlers', () => {
    const emitter = new EventEmitter<TestEvents>()

    // 不应该抛出错误
    expect(() => {
      emitter.emit('stringEvent', 'test')
    }).not.toThrow()
  })
})
