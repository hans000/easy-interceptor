import { MatchRule } from '../App'
import { createRunFunc, debounce, parseUrl, pathMatch } from '../utils'
import { fake, unfake } from './fake'
import { CountMsgKey, PagescriptMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'

bindEvent()

function matching(rules: MatchRule[], requestUrl: string, method: string): MatchRule | undefined {
    for(let rule of rules) {
        if (rule.enable && pathMatch(requestUrl, rule.url) && (rule.method ? rule.method.toLowerCase() === method.toLowerCase() : true)) {
            return rule
        }
    }
}

interface GlobalVar {
    NativeXhr: typeof XMLHttpRequest | undefined
    NativeFetch: typeof fetch | undefined
}

export const __global__: GlobalVar = {
    NativeXhr: undefined,
    NativeFetch: undefined,
}

const app = {
    rules: [] as MatchRule[],
    action: 'close' as ActionType,
    faked: false,
    intercept() {
        const { action, rules, faked } = app
        fake({
            faked,
            onMatch({ method, requestUrl }) {
                if (action === 'intercept') {
                    const matchRule = matching(rules, requestUrl, method)
                    if (matchRule) {
                        const result: MatchRule = handleCode(matchRule, matchRule.response)
                        if (!result.sendReal && !faked) {
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

const run = debounce(() => app.run())

function bindEvent() {
    // get data
    window.dispatchEvent(new CustomEvent('pagescript', {
        detail: {
            type: SyncDataMsgKey,
            from: PagescriptMsgKey,
        }
    }))
    // register event
    window.addEventListener("message", (event) => {
        const data = event.data
        if (data.type === StorageMsgKey) {
            if (data.key === 'rules') {
                app.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
            } else if (data.key === 'action') {
                app.action = data.value
            } else if (data.key === 'faked') {
                app.faked = data.value
            }
        }
        run()
    })
}


const triggerCountEvent = (id: string) => {
    window.dispatchEvent(new CustomEvent('pagescript', {
        detail: {
            type: CountMsgKey,
            from: PagescriptMsgKey,
            data: { id },
        }
    }))
}

const triggerResponseEvent = (response: string, url: string) => {
    window.dispatchEvent(new CustomEvent('pagescript', {
        detail: {
            type: ResponseMsgKey,
            from: PagescriptMsgKey,
            data: { response, url },
        }
    }))
}

const handleCode = (matchRule: MatchRule, responseText: string) => {
    const { id, count, enable, code, response, ...restRule } = matchRule
    if (code) {
        try {
            const data = {
                ...restRule,
                response: JSON.parse(response === 'null' ? responseText : response),
            }
            const fn = createRunFunc(code)
            return {
                ...matchRule,
                ...fn(data) || {},
            }
        } catch (error) {
            console.error(error)
        }
    }
    return matchRule
}