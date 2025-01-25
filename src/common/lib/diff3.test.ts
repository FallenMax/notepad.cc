import { describe, expect, it } from 'vitest'
import { applyPatch, createPatch, merge3 } from './diff3'

describe('diff3', () => {
  //-------------- createPatch & applyPatch 测试 --------------
  describe('createPatch & applyPatch', () => {
    it('应该能处理简单的文本替换', () => {
      const original = 'hello world'
      const modified = 'hello earth' // 替换单词

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理多行文本修改', () => {
      const original = 'line1\nline2\nline3'
      const modified = 'line1\nmodified line\nline3'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理文本插入', () => {
      const original = 'start\nend'
      const modified = 'start\nmiddle\nend'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理文本删除', () => {
      const original = 'keep\nremove\nkeep'
      const modified = 'keep\nkeep'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })
  })

  //-------------- merge3 测试 --------------
  describe('merge3', () => {
    it('应该能合并无冲突的修改: 间隔>=1行', () => {
      const original = 'line1\n\nline2\n\nline3'
      const a = 'line1\n\nline2 modified\n\nline3'
      const b = 'line1\n\nline2\n\nline3 modified'

      const result = merge3(a, original, b)
      expect(result).toBe('line1\n\nline2 modified\n\nline3 modified')
    })
    it.todo('应该能合并无冲突的修改: 相邻行', () => {
      const original = 'line1\nline2\nline3'
      const a = 'line1\nline2 modified\nline3'
      const b = 'line1\nline2\nline3 modified'

      const result = merge3(a, original, b)
      expect(result).toBe('line1\nline2 modified\nline3 modified')
    })

    it('当有冲突时应返回 undefined', () => {
      const original = 'line1\nline2\nline3'
      const a = 'line1\nmodified by A\nline3'
      const b = 'line1\nmodified by B\nline3'

      const result = merge3(a, original, b)
      expect(result).toBeUndefined()
    })

    it('应该能处理一方无修改的情况', () => {
      const original = 'line1\nline2\nline3'
      const a = 'line1\nline2\nline3'
      const b = 'line1\nmodified\nline3'

      const result = merge3(a, original, b)
      expect(result).toBe('line1\nmodified\nline3')
    })
  })

  //-------------- 边界情况测试 --------------
  describe('边界情况', () => {
    it('应该能处理空字符串', () => {
      const original = ''
      const modified = 'new content'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理只有换行符的字符串', () => {
      const original = '\n\n'
      const modified = '\nmodified\n'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理大量连续修改', () => {
      const original = 'a\nb\nc\nd\ne'
      const modified = 'a\nB\nC\nD\ne'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理末尾换行符的差异', () => {
      const original = 'test\n'
      const modified = 'test'

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })

    it('应该能处理纯空格的修改', () => {
      const original = '  test  '
      const modified = ' test '

      const patch = createPatch(original, modified)
      const result = applyPatch(original, patch)

      expect(result).toBe(modified)
    })
  })

  //-------------- Patch 格式测试 --------------
  describe('Patch 格式', () => {
    it('createPatch 应该生成正确格式的 patch', () => {
      const original = 'test'
      const modified = 'modified'

      const patch = createPatch(original, modified)

      // 验证 patch 格式
      expect(Array.isArray(patch)).toBe(true)
      expect(patch.length).toBeGreaterThan(0)
      expect(patch[0]).toHaveProperty('a')
      expect(patch[0]).toHaveProperty('b')
      expect(Array.isArray(patch[0].a)).toBe(true)
      expect(patch[0].a.length).toBe(2)
    })
  })
})
