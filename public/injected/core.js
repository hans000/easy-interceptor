(function (window) {
    const matching = (url, rules) => {
        return rules.find(rule => {
            // 规则启用且text有值
            if (rule.enable && rule.url) {
                // regexp匹配 true 正则 false 字符串匹配
                return rule.regexp
                    ? url.match(new RegExp(rule.url, 'i'))
                    : url.indexOf(rule.url) > -1
            }
            return false
        })
    }

    const createStream = (text) => new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(text))
            controller.close()
        }
    })

    const triggerCountEvent = (id) => {
        window.dispatchEvent(new CustomEvent('pagescript', {
            detail: {
                type: '__hs_count__',
                from: '__hs_pagescript__',
                data: { id },
            }
        }))
    }

    const triggerResponseEvent = (response, url) => {
        window.dispatchEvent(new CustomEvent('pagescript', {
            detail: {
                type: '__hs_response__',
                from: '__hs_pagescript__',
                data: { response, url },
            }
        }))
    }

    const handleCode = (match, responseText) => {
        if (match.code) {
            try {
                const responseStr = match.response === 'null' ? responseText : match.response
                const dataStr = JSON.stringify(match)
                return JSON.stringify(eval(`;(${match.code})(${responseStr}, ${dataStr})`))
            } catch (error) {
                console.error(error)
            }
        }
        return match.response
    }

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
        while (modified) {
            modified = false
            result = handle(result)
        }
        return result
    }

    const shortenAndParse = (responseText) => {
        try {
            return responseText.length > 50000 ? shorten(JSON.parse(responseText)) : JSON.parse(responseText)
        } catch (error) {
            console.error(error)
        }
    }

    const __Hs_Interceptor__ = {
        rules: [],
        action: 'close', // close | watch | intercept,
        OriginalXHR: window.XMLHttpRequest,
        OriginalFetch: window.fetch,
        proxy() {
            window.XMLHttpRequest = __Hs_Interceptor__.XMLHttpRequest
            window.fetch = __Hs_Interceptor__.fetch
        },
        restore() {
            window.XMLHttpRequest = __Hs_Interceptor__.OriginalXHR
            window.fetch = __Hs_Interceptor__.OriginalFetch
        },
        run() {
            __Hs_Interceptor__.action === 'close' ? __Hs_Interceptor__.restore() : __Hs_Interceptor__.proxy()
        },
        XMLHttpRequest: function () {
            const { rules, action, OriginalXHR } = __Hs_Interceptor__
            const xhr = new OriginalXHR()

            const modify = (callback) => {
                const match = matching(this.responseURL, rules)
                if (match) {
                    this.responseText = this.response = handleCode(match, this.responseText || this.response)
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
                            triggerCountEvent(id)
                        }
                    })
                } else {
                    if (action === 'watch') {
                        triggerResponseEvent(shortenAndParse(xhr.responseText), xhr.responseURL)
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
        },
        fetch: async function (...args) {
            const { rules, action, OriginalFetch } = __Hs_Interceptor__
            const response = await OriginalFetch(...args)
            if (action === 'intercept') {
                const match = matching(response.url, rules)
                if (match) {
                    const responseText = await response.text()
                    const result = handleCode(match, responseText)
                    const newResponse = new Response(createStream(result), { ...response })

                    const proxy = new Proxy(newResponse, {
                        get(target, name) {
                            const fields = ['ok', 'url', 'body', 'type', 'bodyUsed', 'redirected', 'useFinalURL']
                            if (fields.includes(name)) {
                                return response[name]
                            }
                            return target[name]
                        }
                    })

                    for (let key in proxy) {
                        if (typeof proxy[key] === 'function') {
                            proxy[key] = proxy[key].bind(newResponse)
                        }
                    }

                    triggerCountEvent(match.id)

                    return proxy
                }
            } else if (action === 'watch') {
                const responseText = await response.text()
                triggerResponseEvent(shortenAndParse(responseText), response.url)
                return new Response(createStream(responseText), { ...response })
            }
            return response
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
})(window)