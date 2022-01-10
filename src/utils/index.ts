export function equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export function randID() {
    return Math.random().toString(36).slice(2)
}

export function renderSize(value: number) {
    const mapUnit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const index = Math.log2(value) / 10 | 0
    const size = value / Math.pow(1024, index)
    return size.toFixed(2) + mapUnit[index]
}