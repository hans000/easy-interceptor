export function sizeof(object: Record<string, any> = {}) {
    return JSON.stringify(object).length
}