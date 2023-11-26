/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from '../App'
import { debounce, noop, parseUrl } from '../utils'
import { fake, unfake } from './fake'
import { proxyRequest, unproxyRequest } from './proxy'
import { StorageMsgKey, SyncDataMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './fake/xhr/constants'
import { createPagescriptAction, EventProps } from '../tools/message'
import { handleCode, matching, triggerCountEvent, triggerResponseEvent } from './tool'

// trigger for get data
window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(SyncDataMsgKey)))

// run at logic
window.addEventListener('message', (event: MessageEvent<EventProps>) => {
    const data = event.data || {} as EventProps
    if (data.type === StorageMsgKey) {
        app[data.key] = data.value
    }
    if (data.key === 'configInfo') {
        const value = data.value
        if (value.runAt === 'start') {
            updateData()
            handle(data.key, data.value)
        } else if (value.runAt === 'end') {
            window.addEventListener('DOMContentLoaded', () => {
                updateData()
                handle(data.key, data.value)
            })
        } else if (value.runAt === 'delay') {
            setTimeout(() => {
                updateData()
                handle(data.key, data.value)
            }, value.runAtDelay)
        } else if (value.runAt === 'trigger') {
            updateData()
        } else {
            updateData()
            handle(data.key, data.value)
        }
    }
})

const run = debounce(() => app.run(), true)

const app = {
    trigger: false,
    configInfo: {} as ConfigInfoType,
    rules: [],
    intercept() {
        const { action, faked, fakedLog } = app.configInfo
        proxyRequest({
            faked,
            fakedLog,
            onMatch(req) {
                if (action === 'intercept') {
                    return matching(app.rules, req)
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
                        if (app.configInfo.action === 'watch') {
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
                        if (app.configInfo.action === 'watch') {
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
        unproxyRequest()
    },
    run() {
        const action = app.configInfo.action
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

function handle(key: string, value: any) {
    app[key] = value
    if (app.configInfo.runAt !== 'trigger') {
        run()
    } else {
        if (app.trigger) {
            run()
        }
    }
}

function updateData() {
    // register event
    window.addEventListener("message", (event: MessageEvent<EventProps>) => {
        const data = event.data || {} as EventProps
        if (data.type === StorageMsgKey) {
            handle(data.key, data.value)
        }
    })
    // @ts-ignore 覆盖原函数，达到只加载一次的目的
    updateData = noop
}
