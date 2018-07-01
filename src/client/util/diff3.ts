import diff3merge from 'diff3'
import { diffPatch, patch, stripPatch } from 'node-diff3'

export type PatchCompressed = any[]
export type Patch = any

const merge = (
  a: string[],
  o: string[],
  b: string[]
): { conflict: any; result: any } => {
  const results = diff3merge(a, o, b)
  const conflict = results.some((r: any) => r.conflict)
  const result = results[0].ok
  return { conflict, result }
}

function toArr(str: string): string[] {
  return str.split('\n')
}

function fromArr(str: string[]): string {
  return str && str.join('\n')
}

function compress(patch: Patch): PatchCompressed {
  return patch.map(({ file1: { offset, length }, file2: { chunk } }: any) => ({
    a: [offset, length],
    b: chunk,
  }))
}

function decompress(patch: PatchCompressed): Patch {
  return patch.map(({ a, b }: any) => ({
    file1: {
      offset: a[0],
      length: a[1],
    },
    file2: {
      chunk: b,
    },
  }))
}

export const applyPatch = (a: string, p: PatchCompressed): string =>
  fromArr(patch(toArr(a), decompress(p)))

export const merge3 = (a: string, o: string, b: string): null | string => {
  let { conflict, result } = merge(toArr(a), toArr(o), toArr(b))
  return conflict ? null : fromArr(result)
}
export const createPatch = (a: string, b: string): PatchCompressed =>
  compress(stripPatch(diffPatch(toArr(a), toArr(b))))
