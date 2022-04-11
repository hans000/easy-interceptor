(function (window) {
    var fr=function(e){"use strict";function t(e,t,n,s){return new(n||(n=Promise))((function(o,i){function r(e){try{c(s.next(e))}catch(e){i(e)}}function a(e){try{c(s.throw(e))}catch(e){i(e)}}function c(e){var t;e.done?o(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(r,a)}c((s=s.apply(e,t||[])).next())}))}function n(e={}){return Object.keys(e).reduce(((t,n)=>(t[n.toLowerCase()]=e[n],t)),{})}function s(e){let t=[];return e instanceof Headers?e.forEach(((e,n)=>{t.push([n,e])})):Array.isArray(e)?t=e:"object"==typeof e&&Object.keys(e).forEach((n=>{t.push([n,e[n]])})),t.map((([e,t])=>`${e.toLowerCase()}: ${t}`)).join("\r\n")}function o(e){const t="$$"+e;return window.Symbol?Symbol.for(t):t}function i(){}function r(e,t,n={}){if(t)for(const n in t)"function"==typeof t[n]?e[n]=s(n):Object.defineProperty(e,n,{get:r(n),set:i(n),enumerable:!0});function s(s){return function(...o){if(n[s]){const i=n[s].call(e,...o,t);if(i)return i}return t[s].apply(t,o)}}function i(s){return function(i){const r=n[s],a=o(s);if(s.startsWith("on"))e[a]=i,t[s]=n=>{if(n=function(e,t){const n={};for(const t in e)n[t]=e[t];return n.target=n.currentTarget=t,n}(n,e),r){r.call(e,t,n)||i.call(e,n)}else i.call(e,n)};else{const n=r&&r.setter;i=n&&n(i,e)||i,e[a]=i;try{t[s]=i}catch(e){}}}}function r(s){return function(){const i=o(s),r=e.hasOwnProperty(i)?e[i]:t[s],a=(n[s]||{}).getter;return a&&a(r,e)||r}}}function a(e){if(!e||"function"!=typeof e)throw"expect `onMatch` to be a function"}function c(e,n){return t(this,void 0,void 0,(function*(){const{options:t,OriginFetch:s}=T;a(t.onMatch);const o=t.onMatch({url:""+e,method:(n||{}).method||"get"});if(o){const i=o.responseInit||{};if(o.sendReal){const a=yield s(e,n),c=new Response(i.response,Object.assign({},a));if(t.onIntercept){const e={};return r(e,c,t.onIntercept(o)),e}return c}const a=new Response(o.response,{status:i.status||200,statusText:i.statusText,headers:i.headers});if(t.onIntercept){const e={};return r(e,a,t.onIntercept(o)),e}return a}return s(e,n)}))}const h=o("match-item"),d=o("xhr"),u=o("request-headers"),l=o("response-headers"),p=o("events"),f={UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4},y=["onabort","onerror","onload","onloadend","onloadstart","onprogress","onreadystatechange","ontimeout"],E=y.map((e=>e.slice(2))),v=["readyState","responseURL","status","statusText","response","responseText","responseXML","responseType"],w=["timeout","withCredentials"],R={100:"Continue",101:"Switching Protocols",200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",300:"Multiple Choice",301:"Moved Permanently",302:"Found",303:"See Other",304:"Not Modified",305:"Use Proxy",307:"Temporary Redirect",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Request Entity Too Large",414:"Request-URI Too Long",415:"Unsupported Media Type",416:"Requested Range Not Satisfiable",417:"Expectation Failed",422:"Unprocessable Entity",500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported"};class g{addEventListener(e,t){(this[p][e]||(this[p][e]=[])).push(t)}removeEventListener(e,t){const n=this[p][e]||[];let s=n.length-1;for(;s>=0;)n[s]===t&&n.splice(s,1),s--}dispatchEvent(e){const t=this[p][e.type]||[];for(let n=0;t.length>n;n++)t[n].call(this,e);const n="on"+e.type;this[n]&&this[n](e)}}const m={matched:!1,sendReal:!1,delay:0};function O(){return new(T.OriginXhr||window.XMLHttpRequest)}class b extends g{constructor(){super(),this.readyState=f.UNSENT,this.response="",this.responseText="",this.responseType="",this.responseURL="",this.responseXML=null,this.status=0,this.statusText=void 0,this.timeout=0,this.withCredentials=!1,this.upload=Object.create(g),this.overrideMimeType=i,y.forEach((e=>this[e]=null)),Object.keys(f).forEach((e=>this[e]=f[e])),this[d]=null,this[p]={},this[u]={},this[l]={},this[h]=m}open(e,t,n,s,o){const i=T.options;this.readyState=f.OPENED,this.dispatchEvent(new Event("readystatechange"));const c=(e,t)=>{for(let e=0;8>e;e++)try{this[v[e]]=t[v[e]]}catch(e){}this.dispatchEvent(new Event(e.type))};"boolean"!=typeof n&&(n=!0);const u={url:t,method:e};a(i.onMatch);const l=i.onMatch(u);return l?(this[h]=Object.assign(Object.assign(Object.assign({},this[h]),l),{matched:!0}),void(this[h].sendReal&&(this[d]=O(),i.onIntercept&&r(this,this[d],i.onIntercept(l)),this[d].open(e,t,n,s,o)))):(this[d]=O(),i.onIntercept?(r(this,this[d],i.onIntercept(l)),void this[d].open(e,t,n,s,o)):(E.forEach((e=>{this[d].addEventListener(e,(function(e){c(e,this)}))}),this),w.forEach((e=>{try{this[d][e]=this[e]}catch(e){}})),void this[d].open(e,t,n,s,o)))}send(e){const{matched:t,sendReal:s,delay:o,requestInit:i={},responseInit:r={}}=this[h];if(t){if(this[l]=n(r.headers),this[u]=n(i.headers),this.dispatchEvent(new Event("loadstart")),this.readyState=f.HEADERS_RECEIVED,this.dispatchEvent(new Event("readystatechange")),this.readyState=f.LOADING,this.dispatchEvent(new Event("readystatechange")),s){const t=i.headers||{};t instanceof Headers?t.forEach(((e,t)=>{this.setRequestHeader(t,e)})):Array.isArray(t)?t.forEach((([e,t])=>{this.setRequestHeader(e,t)})):"object"==typeof t&&Object.keys(t).forEach((e=>{this.setRequestHeader(e,t[e])})),this[d].send(e)}setTimeout((()=>{var e,t;const n=r.status,s=r.response;this.status=R[n]?n:200,this.statusText=null!==(t=null!==(e=R[n])&&void 0!==e?e:r.statusText)&&void 0!==t?t:R[200],this.responseText=this.response="object"==typeof s?JSON.stringify(s):s,this.readyState=f.DONE,this.dispatchEvent(new Event("readystatechange")),this.dispatchEvent(new Event("load")),this.dispatchEvent(new Event("loadend"))}),"number"==typeof o?o:300)}else this[d].send(e)}abort(){this[h].matched?(this.readyState=f.UNSENT,this.dispatchEvent(new Event("abort")),this.dispatchEvent(new Event("error"))):this[d].abort()}setRequestHeader(e,t){const{matched:n,sendReal:s}=this[h];if(!n||s)return void this[d].setRequestHeader(e,t);const o=this[u];o[e]?o[e]+=","+t:o[e]=t}getResponseHeader(e){e=e.toLowerCase();const{matched:t,sendReal:n}=this[h];return t?n?this[l][e]||this[d].getResponseHeader(e):this[l][e]:this[d].getResponseHeader(e)}getAllResponseHeaders(){const{matched:e,sendReal:t}=this[h];return e?s(t?Object.assign(Object.assign({},this[d].getAllResponseHeaders().split("\n").filter(Boolean).reduce(((e,t)=>{t=t.trim();const[n,...s]=t.trim().split(": ");return e[n.toLowerCase()]=s.join(": "),e}),{})),this[l]):this[l]):this[d].getAllResponseHeaders()}}const T={OriginXhr:null,OriginFetch:null,options:null};var M;function N(){const{OriginXhr:e,OriginFetch:t}=T;e&&(window.XMLHttpRequest=e,T.OriginXhr=null),t&&(window.fetch=t,T.OriginFetch=null)}return e.FakeMode=void 0,(M=e.FakeMode||(e.FakeMode={}))[M.xhr=1]="xhr",M[M.fetch=2]="fetch",e.__Fake_Request__=T,e.fake=function(t={onMatch:i}){N(),Object.defineProperty(T,"options",{value:t,writable:!1});const n=t.mode||3;n&e.FakeMode.xhr&&(T.OriginXhr=window.XMLHttpRequest,window.XMLHttpRequest=b),n&e.FakeMode.fetch&&(T.OriginFetch=window.fetch,window.fetch=c)},e.unfake=N,Object.defineProperty(e,"__esModule",{value:!0}),e}({});

    const matching = (url, method, rules) => {
        url = url.split('?')[0]
        // 解决dev环境下使用相对路径的问题
        url = url.startsWith('.') ? url.slice(1) : url
        return rules.find(rule => {
            // 规则启用且text有值
            if (rule.enable && rule.url) {
                // 请求类型存在且一致
                if (rule.method && method && rule.method.toLowerCase() !== method.toLowerCase()) {
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
        fr.fake({
            onMatch(req) {
                if (__interceptor__.action === 'intercept') {
                    const matchRule = matching(req.url, req.method, __interceptor__.rules)
                    if (matchRule) {
                        const sendReal = matchRule.response === 'null' && !!matchRule.code
                        const { requestHeaders, responseHeaders, } = matchRule
                        const { response, status, delay, } = handleCode(matchRule, matchRule.response)
                        return {
                            sendReal,
                            delay,
                            requestInit: {
                                headers: requestHeaders
                            },
                            responseInit: {
                                status,
                                response,
                                headers: responseHeaders
                            }
                        }
                    }
                }
            },
            onIntercept(data) {
                function handle(xhr) {
                    if (data) {
                        if (this.readyState === 4) {
                            const { response, status } = handleCode(data, xhr.responseText || xhr.response)
                            this.response = xhr.response
                            this.responseText = response
                            this.status = status
                            triggerCountEvent(data.id)
                        }
                    } else {
                        try {
                            const obj = JSON.parse(xhr.responseText)
                            triggerResponseEvent(obj, xhr.responseURL)
                        } catch (error) {}
                    }
                }
                return {
                    onload: handle,
                    onloaded: handle,
                    onreadystatechange: handle,
                }
            }
        })
    }

    const __interceptor__ = {
        rules: [],
        action: 'close', // close | watch | intercept,
        proxy() {
            window.fetch = __interceptor__.fetch
            fake()
        },
        restore() {
            fr.unfake()
        },
        run() {
            const action = __interceptor__.action
            switch (action) {
                case 'close':
                    return __interceptor__.restore()
                case 'watch':
                case 'intercept':
                    return __interceptor__.proxy()
                default:
                    break;
            }
        },
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