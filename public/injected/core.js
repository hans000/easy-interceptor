const __Hs_Interceptor__ = {
    rules: [],
    action: 'close', // close | watch | interceptor,
    OriginalXHR: window.XMLHttpRequest.bind(window),
    proxy() {
        window.XMLHttpRequest = __Hs_Interceptor__.XMLHttpRequest
    },
    restore() {
        window.XMLHttpRequest = __Hs_Interceptor__.OriginalXHR
    },
    run() {
        __Hs_Interceptor__.action === 'close' ? __Hs_Interceptor__.restore() : __Hs_Interceptor__.proxy()
    },
    XMLHttpRequest: function () {
        const { rules, action, OriginalXHR } = __Hs_Interceptor__
        const xhr = new OriginalXHR()

        const matching = () => {
            return rules.find(rule => {
                // 规则启用且text有值
                if (rule.enable && rule.url) {
                    // regexp匹配 true 正则 false 字符串匹配
                    return rule.regexp
                        ? this.responseURL.match(new RegExp(rule.url, 'i'))
                        : this.responseURL.indexOf(rule.url) > -1
                }
                return false
            })
        }

        const modify = (callback) => {
            const match = matching()
            if (match) {
                this.responseText = this.response = match.response || {}
                setTimeout(callback, match.delay || 0)
            } else {
                callback()
            }
        }

        const handle = (fn, args) => {
            if (action === 'interceptor') {
                modify(() => {
                    fn && fn.apply(this, args)
                })
            } else {
                if (action === 'watch') {
                    window.dispatchEvent(new CustomEvent('pagescript', {
                        detail: {
                            type: '__hs_response__',
                            from: '__hs_pagescript__',
                            data: {
                                response: xhr.responseText,
                                url: xhr.responseURL,
                            }
                        }
                    }))
                }
                fn && fn.apply(this, args)
            }
        }

        for (let attr in xhr) {
            if (attr === 'onreadystatechange') {
                xhr.onreadystatechange = (...args) => {
                    if (this.readyState == 4) {
                        handle(this.onreadystatechange, args)
                    }
                }
            } else if (attr === 'onload') {
                xhr.onload = (...args) => {
                    handle(this.onload, args)
                }
            } else if (typeof xhr[attr] === 'function') {
                this[attr] = xhr[attr].bind(xhr)
            } else if (attr === 'responseText' || attr === 'response') {
                const key = Symbol.for(`$$${attr}`)
                Object.defineProperty(this, attr, {
                    get: () => this[key] == undefined ? xhr[attr] : this[key],
                    set: (val) => this[key] = val,
                    enumerable: true
                })
            } else {
                Object.defineProperty(this, attr, {
                    get: () => xhr[attr],
                    set: (val) => xhr[attr] = val,
                    enumerable: true
                })
            }
        }
    }
}

window.addEventListener("message", (event) => {
    const data = event.data
    if (data.type === '__hs_storage__') {
        if (data.key === 'rules') {
            __Hs_Interceptor__.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
        } else if (data.key === 'action') {
            __Hs_Interceptor__.action = data.value
        }
    }

    __Hs_Interceptor__.run()
})