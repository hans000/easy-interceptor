(function (window) {
    !function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).af={})}(this,(function(e){"use strict";var t=function(){return t=Object.assign||function(e){for(var t,n=1,s=arguments.length;s>n;n++)for(var o in t=arguments[n])Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);return e},t.apply(this,arguments)},n={UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4},s=["onabort","onerror","onload","onloadend","onloadstart","onprogress","onreadystatechange","ontimeout"],o=s.map((function(e){return e.slice(2)})),i=["readyState","responseURL","status","statusText","response","responseText","responseXML","responseType"],r=["timeout","withCredentials"],a={100:"Continue",101:"Switching Protocols",200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",300:"Multiple Choice",301:"Moved Permanently",302:"Found",303:"See Other",304:"Not Modified",305:"Use Proxy",307:"Temporary Redirect",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Request Entity Too Large",414:"Request-URI Too Long",415:"Unsupported Media Type",416:"Requested Range Not Satisfiable",417:"Expectation Failed",422:"Unprocessable Entity",500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported"},d=Symbol(),h=Symbol(),u={addEventListener:function(e,t){(this._events[e]||(this._events[e]=[])).push(t)},removeEventListener:function(e,t){for(var n=this._events[e]||[],s=n.length-1;s>=0;)n[s]===t&&n.splice(s,1),s--},dispatchEvent:function(e){for(var t=this._events[e.type]||[],n=0;t.length>n;n++)t[n].call(this,e);var s="on"+e.type;this[s]&&this[s](e)}},c=function(){var e=this;s.forEach((function(t){e[t]=null})),this.readyState=n.UNSENT,this.response="",this.responseText="",this.responseType="",this.responseURL="",this.responseXML=null,this.status=0,this.statusText="",this.timeout=0,this.withCredentials=!1,this.upload=Object.create(u),this._xhr=null,this._events={},this._requestHeaders={},this._responseHeaders={},this[h]={matched:!1,response:null,sendRealXhr:!1,timeout:"default",status:200}};function l(){return new(window[d]||window.XMLHttpRequest)}c.config=new Map;var p=t(t({},n),{open:function(e,t,s,a,d){var u,p,v=this,f=c.config.get("onRequestMatch");if("function"==typeof f)try{this[h]=Object.assign({},this[h],f({requestMethod:e,requestUrl:t}))}catch(e){}var y=function(e,t){for(var n=0;8>n;n++)try{this[i[n]]=t[i[n]]}catch(e){}this.dispatchEvent(new Event(e.type))}.bind(this);if("boolean"!=typeof s&&(s=!0),!(null===(u=this[h])||void 0===u?void 0:u.matched))return this._xhr=l(),o.forEach((function(e){v._xhr.addEventListener(e,(function(e){y(e,this)}))}),this),r.forEach((function(e){try{v._xhr[e]=v[e]}catch(e){}})),void this._xhr.open(e,t,s,a,d);this.readyState=n.OPENED,this.dispatchEvent(new Event("readystatechange")),(null===(p=this[h])||void 0===p?void 0:p.sendRealXhr)&&(this._xhr=l(),this._xhr.open(e,t,s,a,d))},send:function(e){var t,s=this,o=this[h],i=o.response,r=o.sendRealXhr,d=o.timeout,u=o.status;o.matched?(this.dispatchEvent(new Event("loadstart")),this.readyState=n.HEADERS_RECEIVED,this.dispatchEvent(new Event("readystatechange")),this.readyState=n.LOADING,this.dispatchEvent(new Event("readystatechange")),r&&this._xhr.send(e),setTimeout((function(){var e;s.status=a[u]?u:200,s.statusText=null!==(e=a[u])&&void 0!==e?e:a[200],s.responseText=s.response="object"==typeof i?JSON.stringify(i):i,s.readyState=n.DONE,s.dispatchEvent(new Event("readystatechange")),s.dispatchEvent(new Event("load")),s.dispatchEvent(new Event("loadend"))}),"number"==typeof d?d:1e3*((t=Math.random())>.5?t:t+.5))):this._xhr.send(e)},abort:function(){var e;(null===(e=this[h])||void 0===e?void 0:e.matched)?(this.readyState=n.UNSENT,this.dispatchEvent(new Event("abort")),this.dispatchEvent(new Event("error"))):this._xhr.abort()},overrideMimeType:function(){},setRequestHeader:function(e,t){var n,s;if((null===(n=this[h])||void 0===n?void 0:n.matched)&&!(null===(s=this[h])||void 0===s?void 0:s.sendRealXhr)){var o=this._requestHeaders;o[e]?o[e]+=","+t:o[e]=t}else this._xhr.setRequestHeader(e,t)},getResponseHeader:function(e){var t;return(null===(t=this[h])||void 0===t?void 0:t.matched)?this._responseHeaders[e.toLowerCase()]:this._xhr.getResponseHeader(e)},getAllResponseHeaders:function(){var e;if(!(null===(e=this[h])||void 0===e?void 0:e.matched))return this._xhr.getAllResponseHeaders();var t=this._responseHeaders,n="";for(var s in t)t.hasOwnProperty(s)&&(n+=s+": "+t[s]+"\r\n");return n}});Object.setPrototypeOf(p,u),c.prototype=p,e.FakeXMLHttpRequest=c,e.fake=function(e){void 0===e&&(e={});var t=e.force,n=void 0!==t&&t,s=e.onRequestMatch;"function"==typeof s&&c.config.set("onRequestMatch",s),window[d]=window.XMLHttpRequest,"boolean"==typeof n&&n?Object.defineProperty(window,"XMLHttpRequest",{value:c,enumerable:!0,writable:!1}):window.XMLHttpRequest=c},e.getOriginXHR=function(){var e;return null!==(e=window[d])&&void 0!==e?e:window.XMLHttpRequest},e.unFake=function(){window[d]&&(Object.defineProperty(window,"XMLHttpRequest",{value:window[d],enumerable:!0,writable:!0}),window[d]=null)},Object.defineProperty(e,"__esModule",{value:!0})}));
    !function(t,n){for(var r in n)t[r]=n[r]}(window,function(t){function n(o){if(r[o])return r[o].exports;var e=r[o]={i:o,l:!1,exports:{}};return t[o].call(e.exports,e,e.exports,n),e.l=!0,e.exports}var r={};return n.m=t,n.c=r,n.i=function(t){return t},n.d=function(t,r,o){n.o(t,r)||Object.defineProperty(t,r,{configurable:!1,enumerable:!0,get:o})},n.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(r,"a",r),r},n.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},n.p="",n(n.s=2)}([function(t,n,r){"use strict";function o(t,n){var r={};for(var o in t)r[o]=t[o];return r.target=r.currentTarget=n,r}function e(t){function n(n){return function(){var r=this.hasOwnProperty(n+"_")?this[n+"_"]:this.xhr[n],o=(t[n]||{}).getter;return o&&o(r,this)||r}}function r(n){return function(r){var e=this.xhr,i=this,u=t[n];if("on"===n.substring(0,2))i[n+"_"]=r,e[n]=function(u){u=o(u,i),t[n]&&t[n].call(i,e,u)||r.call(i,u)};else{var c=(u||{}).setter;r=c&&c(r,i)||r,this[n+"_"]=r;try{e[n]=r}catch(t){}}}}function e(n){return function(){var r=[].slice.call(arguments);if(t[n]){var o=t[n].call(this,r,this.xhr);if(o)return o}return this.xhr[n].apply(this.xhr,r)}}return window[c]=window[c]||XMLHttpRequest,XMLHttpRequest=function(){var t=new window[c];for(var o in t){var i="";try{i=u(t[o])}catch(t){}"function"===i?this[o]=e(o):Object.defineProperty(this,o,{get:n(o),set:r(o),enumerable:!0})}var f=this;t.getProxy=function(){return f},this.xhr=t},window[c]}function i(){window[c]&&(XMLHttpRequest=window[c]),window[c]=void 0}Object.defineProperty(n,"__esModule",{value:!0});var u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};n.configEvent=o,n.hook=e,n.unHook=i;var c="_rxhr"},,function(t,n,r){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ah=void 0;var o=r(0);n.ah={hook:o.hook,unHook:o.unHook}}]));

    const matching = (url, method, rules) => {
        url = url.split('?')[0]
        // 解决dev环境下使用相对路径的问题
        url = url.startsWith('.') ? url.slice(1) : url
        return rules.find(rule => {
            // 规则启用且text有值
            if (rule.enable && rule.url) {
                // 请求类型存在且一致
                if (rule.method && rule.method.toLowerCase() !== method.toLowerCase()) {
                    return false
                }
                // regexp匹配 true 正则 false 字符串匹配
                return rule.regexp
                    ? url.match(new RegExp(rule.url, 'i')) || rule.url.match(new RegExp(url, 'i'))
                    : url.indexOf(rule.url) > -1 || rule.url.indexOf(url) > -1
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
        const { response, status, delay, code } = match
        if (code) {
            try {
                const dataStr = JSON.stringify({
                    delay,
                    status,
                    response: JSON.parse(response === 'null' ? responseText : response),
                })
                return {
                    status,
                    delay,
                    ...eval(`;(${code})(${dataStr})`) || {},
                }
            } catch (error) {
                console.error(error)
            }
        }
        return { response, delay, status, }
    }

    const fake = () => {
        af.unFake()
        af.fake({
            onRequestMatch(res) {
                const match = matching(res.requestUrl, res.requestMethod, __interceptor__.rules)
                if (match) {
                    const { response, status, delay } = handleCode(match, match.response)
                    triggerCountEvent(match.id)
                    return {
                        status: status,
                        matched: true,
                        response,
                        timeout: delay,
                        sendRealXhr: match.response === 'null' && !!match.code,
                    }
                }
                return { }
            }
        })
    }

    const hook = () => {
        ah.unHook()
        ah.hook({
            onreadystatechange(xhr) {
                if (xhr.readyState == 4) {
                    triggerResponseEvent(JSON.parse(xhr.responseText), xhr.responseURL)
                }
            },
            onload(xhr) {
                triggerResponseEvent(JSON.parse(xhr.responseText), xhr.responseURL)
            }
        })
    }

    const __interceptor__ = {
        rules: [],
        action: 'close', // close | watch | intercept,
        OriginalFetch: window.fetch,
        OriginalXhr: window.XMLHttpRequest,
        proxy() {
            window.fetch = __interceptor__.fetch
            fake()
        },
        hook() {
            window.fetch = __interceptor__.fetch
            hook()
        },
        restore() {
            window.fetch = __interceptor__.OriginalFetch
            af.unFake()
            ah.unHook()
        },
        run() {
            const action = __interceptor__.action
            switch (action) {
                case 'close':
                    return __interceptor__.restore()
                case 'watch':
                    return __interceptor__.hook()
                case 'intercept':
                    return __interceptor__.proxy()
                default:
                    break;
            }
        },
        fetch: async function (...args) {
            const { rules, action, OriginalFetch } = __interceptor__
            const response = await OriginalFetch(...args)
            if (action === 'intercept') {
                const match = matching(response.url, response.method, rules)
                if (match) {
                    const responseText = await response.text()
                    const result = handleCode(match, responseText).response
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
                triggerResponseEvent(JSON.parse(responseText), response.url)
                return new Response(createStream(responseText), { ...response })
            }
            return response
        }
    }

    window.addEventListener("message", (event) => {
        const data = event.data
        if (data.type === '__hs_storage__') {
            if (data.key === 'rules') {
                __interceptor__.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
            } else if (data.key === 'action') {
                __interceptor__.action = data.value
            }
        }
        __interceptor__.run()
    })
})(window)