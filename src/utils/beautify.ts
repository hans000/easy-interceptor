export function beautify(code: string, indent = 4) {
    const list = code.split('\n').map(line => line.trim())
    let count = 0
    const startChars = ['(', '[', '{']
    const endChars = [')', ']', '}']
    const stack: string[] = []

    for (let i = 0; i < list.length; i++) {
        let line = list[i]
        // 检测闭合
        const headChar = line[0]
        if (endChars.includes(headChar)) {
            const topChar = stack[stack.length - 1]
            const startIndex = startChars.findIndex(ch => ch === topChar)
            const endIndex = endChars.findIndex(ch => ch === headChar)
            if (startIndex !== endIndex) {
                throw new Error(`第${i + 1}行错误，缺少必要的括号与之匹配，->${line.slice(0, 6)}...`)
            }
            stack.pop()
            count--

            list[i] = ' '.repeat(indent * count) + line
        }

        const tailChar = line[line.length - 1]
        if (startChars.includes(tailChar)) {
            stack.push(tailChar)
            list[i] = ' '.repeat(indent * count) + line.trimStart()
            count++
            continue
        }

        list[i] = ' '.repeat(indent * count) + line.trimStart()
    }
    return list.join('\n')
}