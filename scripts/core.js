const __Hs_Transformer__ = {
    rules: [],
    enable: true,
}

function turnOn() {
    if (! window.XMLHttpRequest.toString().includes('[native code]')) return
    
    proxy({
        onRequest: (config, handler) => {
            console.log(config);
            handler.next(config)
        },
        onResponse: (res, handler) => {
            const { rules, enable } = __Hs_Transformer__
            if (! enable) handler.next(res)

            const url = res.config.xhr.responseURL
            rules.forEach(({ type = false, enable = true, url: text, response = '' }) => {
                let matched = false;
                if (enable && url) {
                    if (!type && url.indexOf(text) > -1) {
                        matched = true;
                    } else if (type && url.match(new RegExp(text, 'i'))) {
                        matched = true;
                    }
                }
                if (matched) {
                    handler.resolve({
                        ...res,
                        responseText: response,
                        response: response,
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
        if (data.key === 'rules') {
            __Hs_Transformer__.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
        } else if (data.key === 'enable') {
            __Hs_Transformer__.enable = data.value
        }
    }

    __Hs_Transformer__.enable ? turnOn() : unProxy()
})
