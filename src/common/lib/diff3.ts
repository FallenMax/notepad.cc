import {
  diff3Merge as diff3merge,
  diffPatch,
  IPatchRes,
  patch,
  // @ts-ignore
  stripPatch,
} from 'node-diff3'

type Chunk = { __chunk: any }

export type PatchUncompressed = IPatchRes<string>[]

export type Patch = { a: [number, number]; b: Chunk }[]

function merge(
  a: string[],
  o: string[],
  b: string[],
): { conflict: any; result: any } {
  const results = diff3merge(a, o, b)
  const conflict = results.some((r: any) => r.conflict)
  const result = results[0].ok
  return { conflict, result }
}

function toLines(str: string): string[] {
  return str.split('\n')
}

function fromArr(str: string[] | undefined): string | undefined {
  return str && str.join('\n')
}

function compress(patch: PatchUncompressed): Patch {
  return patch.map(
    ({ buffer1: { offset, length }, buffer2: { chunk } }: any) => ({
      a: [offset, length] as [number, number],
      b: chunk,
    }),
  )
}

function decompress(patch: Patch): PatchUncompressed {
  return patch.map(({ a, b }: any) => ({
    buffer1: {
      offset: a[0],
      length: a[1],
    },
    buffer2: {
      chunk: b,
    },
  })) as IPatchRes<string>[]
}

export function applyPatch(base: string, p: Patch): string | undefined {
  return fromArr(patch(toLines(base), decompress(p)))
}

export function merge3(a: string, o: string, b: string): string | undefined {
  let { conflict, result } = merge(toLines(a), toLines(o), toLines(b))
  return conflict ? undefined : fromArr(result)
}

export function createPatch(base: string, b: string): Patch {
  const stripped = stripPatch(diffPatch(toLines(base), toLines(b)))
  return compress(stripped)
}
