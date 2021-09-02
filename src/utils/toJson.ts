class Nbt {
    public static text: string = ''
    public static eat(length: number) {
        Nbt.text = Nbt.text.substr(length)
    }
    public static parseObject() {
        const obj: any = {}
        if (Nbt.testCloseCurly()) {
            return obj
        }
        while (true) {
            const tagName = Nbt.parseKey()
            Nbt.eatColon()
            const value = Nbt.parseValue()
            obj[tagName] = value
            if (Nbt.testCloseCurly()) {
                break
            }
            Nbt.eatComma()
        }
        return obj
    }
    public static parseArray() {
        const array: any[] = []
        if (Nbt.testCloseSquare()) {
            return array
        }
        while (true) {
            if (Nbt.testBeginSquare()) {
                array.push(Nbt.parseObject())
            } else {
                array.push(Nbt.parseValue())
            }
            if (Nbt.testCloseSquare()) {
                break
            }
            Nbt.eatComma()
        }
        return array
    }
    public static eatColon() {
        const match = Nbt.text.match(/^\s*:/)
        if (match) {
            Nbt.eat(match[0].length)
            return;
        }
        throw new Error('lack of colon')
    }
    public static eatComma() {
        const match = Nbt.text.match(/^\s*,/)
        if (match) {
            Nbt.eat(match[0].length)
            return;
        }
        throw new Error('lack of comma')
    }
    public static testBeginCurly() {
        const match = Nbt.text.match(/^\s*{/)
        if (match) {
            Nbt.eat(match[0].length)
            return true;
        }
        return false
    }
    public static testCloseCurly() {
        const match = Nbt.text.match(/^\s*(,\s*)?}/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static testBeginSquare() {
        const match = Nbt.text.match(/^\s*\[/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static testCloseSquare() {
        const match = Nbt.text.match(/^\s*\]/)
        if (match) {
            Nbt.eat(match[0].length)
            return true
        }
        return false
    }
    public static parseKey() {
        const match = Nbt.text.match(/^\s*"?'?([a-zA-Z$_][a-zA-Z0-9_]*)"?'?/i)
        if (match) {
            const [_, key] = match
            Nbt.eat(_.length)
            return key
        }
        throw new Error(`Property name is invalid at "${Nbt.text.slice(0, 15)}"`)
    }
    public static parseValue() {
        if (Nbt.testBeginCurly()) {
            return Nbt.parseObject()
        }
        if (Nbt.testBeginSquare()) {
            return Nbt.parseArray()
        }
        const match = Nbt.text.match(/^\s*(null|true|false)|^\s*([0-9a-zA-Z_\-\$\.]+)|^\s*("(?:\\\"|\\\\|[^\\\\])*?")|^\s*(\'(?:\\\"|\\\\|[^\\\\])*?')/)
        if (match) {
            const [_, keyword, bare, double, single] = match
            Nbt.eat(_.length)
            if (keyword) {
                return { true: true, false: false, null: null }[keyword]
            }
            if (bare) {
                if (/^(-?\d*)(\.\d+)?$/.test(bare)) {
                    return +bare
                }
                return bare
            }
            if (double) {
                return double.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\\"/g, '"')
            }
            if (single) {
                return single.slice(1, -1)
            }
        }
        throw new Error(`value is invalid at "${Nbt.text.slice(0, 15)}"`)
    }
}

export default function parse(text: string) {
    Nbt.text = text
    return Nbt.parseValue()
}