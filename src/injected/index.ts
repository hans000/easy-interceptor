/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from '../App'
import { debounce, parseUrl } from '../utils'
import { fake, unfake } from './fake'
import { StorageMsgKey, SyncDataMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './fake/xhr/constants'
import { createPagescriptAction, EventProps } from '../tools/message'
import { handleCode, matching, triggerCountEvent, triggerResponseEvent } from './tool'

bindEvent()

const run = debounce(() => app.run())

const app = {
    rules: [] as MatchRule[],
    action: 'close' as ActionType,
    faked: false,
    fakedLog: false,
    intercept() {
        const { action, rules, faked, fakedLog } = app
        fake({
            faked,
            fakedLog,
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

function bindEvent() {
    // get data
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(SyncDataMsgKey)))
    // register event
    window.addEventListener("message", (event: MessageEvent<EventProps>) => {
        const data = event.data || {} as EventProps
        if (data.type === StorageMsgKey) {
            app[data.key] = data.value
            run()
        }
    })
}
