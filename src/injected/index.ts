import { MatchRule } from '../App'
import { parseUrl } from '../utils'
import { fake, unfake } from './fake'
import minimatch from 'minimatch'

function matching(rules: MatchRule[], requestUrl: string, method: string): MatchRule | undefined {
    for(let rule of rules) {
        if (rule.enable && minimatch(requestUrl, rule.url) && (rule.method ? rule.method === method : true)) {
            return rule
        }
    }
}

type Action = 'close' | 'watch' | 'intercept'

const app = {
    rules: [] as MatchRule[],
    action: 'close' as Action,
    intercept() {
        fake({
            onMatch({ method, requestUrl }) {
                const { action, rules } = app
                if (action === 'intercept') {
                    const matchRule = matching(rules, requestUrl, method)
                    if (matchRule) {
                        const result: MatchRule = handleCode(matchRule, matchRule.response)
                        if (! result.sendReal) {
                            setTimeout(() => {
                                triggerCountEvent(matchRule.id)
                            }, result.delay || 0)
                        }
                        return result
                    }
                }
            },
            onIntercept(data: MatchRule) {
                function handle(xhr) {
                    if (data) {
                        if (this.readyState === 4) {
                            this.response = data.response
                            this.responseText = data.response
                            this.status = data.status
                            triggerCountEvent(data.id)
                        }
                    } else {
                        if (app.action === 'watch') {
                            try {
                                const obj = JSON.parse(xhr.responseText)
                                const urlObj = parseUrl(xhr.responseURL)
                                triggerResponseEvent(obj, urlObj.origin + urlObj.pathname)
                            } catch (error) {}
                        }
                    }
                }
                return {
                    onload: handle,
                    onloadend: handle,
                    onreadystatechange: handle,
                }
            }
        })
    },
    restore() {
        unfake()
    },
    run() {
        const action = app.action
        switch (action) {
            case 'close':
                return app.restore()
            case 'watch':
            case 'intercept':
                return app.intercept()
            default:
                break;
        }
    },
}

window.addEventListener("message", (event) => {
    const data = event.data
    if (data.type === '__hs_storage__') {
        if (data.key === 'rules') {
            app.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
        } else if (data.key === 'action') {
            app.action = data.value
        }
    }
    app.run()
})

const triggerCountEvent = (id: string) => {
    window.dispatchEvent(new CustomEvent('pagescript', {
        detail: {
            type: '__hs_count__',
            from: '__hs_pagescript__',
            data: { id },
        }
    }))
}

const triggerResponseEvent = (response: string, url: string) => {
    window.dispatchEvent(new CustomEvent('pagescript', {
        detail: {
            type: '__hs_response__',
            from: '__hs_pagescript__',
            data: { response, url },
        }
    }))
}

const handleCode = (matchRule: MatchRule, responseText: string) => {
    const { id, count, enable, code, response, ...restRule } = matchRule
    if (code) {
        try {
            const dataStr = JSON.stringify({
                ...restRule,
                response: JSON.parse(response === 'null' ? responseText : response),
            })
            const raw = `
                ;(function (ctx) {
                    ${code}
                    return __map__(ctx)
                })(${dataStr})
            `
            return {
                ...matchRule,
                ...eval(raw) || {},
            }
        } catch (error) {
            console.error(error)
        }
    }
    return matchRule
}