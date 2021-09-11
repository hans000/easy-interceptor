const __Hs_Transformer__ = {
    rules: [],
    action: 'interceptor', // close | watch | interceptor
}

function turnOn() {
    if (! window.XMLHttpRequest.toString().includes('[native code]')) return

    proxy({
        onRequest: (config, handler) => {
            handler.next(config)
        },
        onResponse: (res, handler) => {
            const { rules, action } = __Hs_Transformer__
            if (action !== 'interceptor') handler.next(res)

            const URL = res.config.xhr.responseURL
            const pathname = URL.slice(0, URL.indexOf('?'))
            
            rules.forEach(rule => {
                let matched = false

                if (rule.enable && pathname) {
                    matched = URL.indexOf(rule.url) > -1
                    // matched = minimatch(pathname, rule.url)
                }

                if (matched) {
                    handler.next({
                        ...res,
                        responseText: rule.response,
                        response: rule.response,
                    })
                } else {
                    handler.next(res)
                }
            })
        }
    })
}

window.addEventListener("message", (event) => {
    const data = event.data
    if (data.type === '__Hs_Transformer__' && data.to === 'pageScript') {
        console.log(data);
        if (data.key === 'rules') {
            __Hs_Transformer__.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
        } else if (data.key === 'action') {
            __Hs_Transformer__.action = data.value
        }
    }

    __Hs_Transformer__.action === 'interceptor' ? turnOn() : unProxy()
})
