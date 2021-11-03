(function(window) {
    const __Hs_Interceptor__ = {
        rules: [],
        action: 'close', // close | watch | intercept,
        OriginalXHR: window.XMLHttpRequest,
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
                    let result = match.response
                    if (match.code) {
                        try {
                            const responseStr = match.response === 'null'
                                ? this.responseText || this.response
                                : match.response
                            const dataStr = JSON.stringify(match)
                            result = eval(`;(${match.code})(${responseStr}, ${dataStr})`)
                        } catch (error) {
                            console.error(error)
                        }
                    }
                    this.responseText = this.response = JSON.stringify(result)
                    setTimeout(callback.bind(null, match.id), match.delay || 0)
                } else {
                    callback()
                }
            }
    
            const handle = (fn, args) => {
                if (action === 'intercept') {
                    modify((id) => {
                        if (fn) {
                            fn.apply(this, args)
                        }
                        if (id) {
                            window.dispatchEvent(new CustomEvent('pagescript', {
                                detail: {
                                    type: '__hs_count__',
                                    from: '__hs_pagescript__',
                                    data: {
                                        id
                                    }
                                }
                            }))
                        }
                    })
                } else {
                    if (action === 'watch') {
                        try {
                            const json = xhr.responseText.length > 50000 ? shorten(JSON.parse(xhr.responseText)) : JSON.parse(xhr.responseText)
                            window.dispatchEvent(new CustomEvent('pagescript', {
                                detail: {
                                    type: '__hs_response__',
                                    from: '__hs_pagescript__',
                                    data: {
                                        response: json,
                                        url: xhr.responseURL,
                                    }
                                }
                            }))
                        } catch (error) {}
                    }
                    if (fn) {
                        fn.apply(this, args)
                    }
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

    // 精简数据
    function shorten(data, config = { stringLength: 200, arrayLength: 10 }) {
        const { stringLength, arrayLength } = config
        let modified = false
    
        function halfString(value) {
            if (value.length > stringLength) {
                modified = true
                return value.slice(0, value.length / 2 | 0)
            }
            return value
        }
    
        function halfArray(value) {
            if (value.length > arrayLength) {
                modified = true
                return value.slice(0, value.length / 2 | 0)
            }
            return value.map(item => handle(item))
        }
    
        function handle(data) {
            if (typeof data === 'string') return halfString(data)
            if (Array.isArray(data)) return halfArray(data)
            if (data && typeof data === 'object') return Object.keys(data).reduce((acc, key) => (acc[key] = handle(data[key]), acc), {})
            return data
        }
    
        let result = handle(data)
        while(modified) {
            modified = false
            result = handle(result)
        }
        return result
    }
})(window)