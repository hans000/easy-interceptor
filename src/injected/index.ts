import { MatchRule } from '../App'
import { createRunFunc, debounce, parseUrl, pathMatch } from '../utils'
import { fake, unfake } from './fake'
import { CountMsgKey, PagescriptMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './fake/xhr/constants'
import { CustomRequestInfo } from './fake/globalVar'

bindEvent()

function matching(rules: MatchRule[], req: CustomRequestInfo): MatchRule | undefined {
    for(let rule of rules) {
        if (rule.enable &&
            req.type === (rule.type || 'xhr') &&
            pathMatch(rule.test, req.requestUrl) &&
            req.method.toLowerCase() === (rule.method || 'get')) {
            return rule
        }
    }
}

const app = {
    rules: [] as MatchRule[],
    action: 'close' as ActionType,
    faked: false,
    intercept() {
        const { action, rules, faked } = app
        fake({
            faked,
            onMatch(req) {
                if (action === 'intercept') {
                    return matching(rules, req)
                }
            },
            onFetchIntercept(data: MatchRule | undefined) {
                return async (res) => {
                    if (data) {
                        triggerCountEvent(data.id)
                        const { responseText, status = 200, responseHeaders } = await handleCode(data, res)
                        return Promise.resolve(new Response(new Blob([responseText]), {
                            status,
                            headers: responseHeaders,
                            statusText: HttpStatusCodes[status],
                        }))
                    } else {
                        if (app.action === 'watch') {
                            try {
                                const obj = JSON.parse(await res.clone().text())
                                const urlObj = parseUrl(res.url)
                                triggerResponseEvent(obj, urlObj.origin + urlObj.pathname)
                            } catch (error) {}
                        }
                    }
                }
            },
            onXhrIntercept(data: MatchRule | undefined) {
                return async function(xhr: XMLHttpRequest) {
                    if (data) {
                        if (this.readyState === 4) {
                            try {
                                const { response, responseText, status = 200 } = await handleCode(data, xhr)
                                
                                this.responseText = this.response = response !== undefined ? JSON.stringify(response) : responseText
                                this.status = status
                                this.statusText = HttpStatusCodes[status]
                            } catch (error) {
                                console.error(error)
                            }
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
            app[data.key] = data.value
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

const handleCode = async (matchRule: MatchRule, inst: XMLHttpRequest | Response) => {
    let { id, count, enable, code, ...restRule } = matchRule

    if (code) {
        try {
            const fn = createRunFunc(code)
            const partialData = await fn(restRule, inst)
            return {
                ...restRule,
                ...partialData || {},
                id
            }
        } catch (error) {
            console.error(error)
        }
    }
    return restRule
}