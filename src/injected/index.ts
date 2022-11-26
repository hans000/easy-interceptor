import { MatchRule } from '../App'
import { createRunFunc, debounce, equal, parseUrl, pathMatch } from '../utils'
import { fake, unfake } from './fake'
import { CountMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './fake/xhr/constants'
import { CustomRequestInfo } from './fake/globalVar'
import { createPagescriptAction, EventProps } from '../tools/message'

bindEvent()

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
                        const { responseText, response, status = 200, responseHeaders } = await handleCode(data, res)
                        return Promise.resolve(new Response(new Blob([response !== undefined ? JSON.stringify(response) : responseText]), {
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

function matching(rules: MatchRule[], req: CustomRequestInfo): MatchRule | undefined {
    for(let rule of rules) {
        if (rule.enable &&
            (rule.type ? req.type === rule.type : true) &&
            pathMatch(rule.test, req.requestUrl) &&
            req.method.toLowerCase() === (rule.method || 'get') &&
            (rule.params ? equal(rule.params, req.params) : true)) {
            return rule
        }
    }
}

function bindEvent() {
    // get data
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(SyncDataMsgKey)))
    // register event
    window.addEventListener("message", (event: MessageEvent<EventProps>) => {
        const data = event.data
        if (data.type === StorageMsgKey) {
            app[data.key] = data.value
            run()
        }
    })
}

function triggerCountEvent(id: string) {
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(CountMsgKey, { id })))
}

function triggerResponseEvent(response: string, url: string) {
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(ResponseMsgKey, { response, url })))
}

async function handleCode(matchRule: MatchRule, inst: XMLHttpRequest | Response) {
    let { id, count, enable, code, ...restRule } = matchRule

    const text = await (inst instanceof Response ? inst.text() : inst.responseText)
    restRule.responseText = text

    if (code) {
        try {
            const fn = createRunFunc(code)
            const partialData = await fn(restRule, matchRule.type ? inst : undefined)
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