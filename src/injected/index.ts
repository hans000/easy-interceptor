import { MatchRule } from '../App'
import { createRunFunc, debounce, parseUrl } from '../utils'
import { fake, unfake } from './fake'
import minimatch from 'minimatch'
import { importMinimatch } from '../tools/packing'
import { CountMsgKey, PagescriptMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'

if (! process.env.VITE_LOCAL) {
    importMinimatch().then(() => {
        bindEvent()
    }).catch((err) => {
        console.error(err)
    })
} else {
    bindEvent()
}

function matching(rules: MatchRule[], requestUrl: string, method: string): MatchRule | undefined {
    for(let rule of rules) {
        if (rule.enable && minimatch(requestUrl, rule.url) && (rule.method ? rule.method === method : true)) {
            return rule
        }
    }
}

const app = {
    rules: [] as MatchRule[],
    action: 'close' as ActionType,
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