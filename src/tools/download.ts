export function download(filename: string, data: string) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(new Blob(data.split('')))
    a.download = filename
    a.rel = 'noopener'
    a.href = url
    a.click()
}