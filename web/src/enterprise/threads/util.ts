export type ThreadKind = 'thread' | 'check' | 'codemod'

export function nounForThreadKind(kind: ThreadKind, plural = false): string {
    return `${kind.toLowerCase()}${plural ? 's' : ''}`
}
