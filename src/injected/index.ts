import { MatchRule } from '../App'
import { createRunFunc, debounce, parseUrl } from '../utils'
import { fake, unfake } from './fake'
import minimatch from 'minimatch'
import { importMinimatch } from '../tools/packing'
import { CountMsgKey, PagescriptMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'

// if (! process.env.VITE_LOCAL) {
//     importMinimatch().then(() => {
//         init()
//     }).catch((err) => {
//         console.error(err)
//     })
// } else {
// }

init()

// function matching(rules: MatchRule[], requestUrl: string, method: string): MatchRule | undefined {
//     for(let rule of rules) {
//         if (rule.enable && minimatch(requestUrl, rule.url) && (rule.method ? rule.method === method : true)) {
//             return rule
//         }
//     }
// }

function init() {
    const app = {
        rules: [] as MatchRule[],
        action: 'close' as ActionType,
    }
    
    // const url = 'chrome://extensions/lpfhdmfkgnampkmbnkjbpmefnlkeelbe/sw.js'
    // navigator.serviceWorker.register(url).then(() => {
    //     // get data
    //     window.dispatchEvent(new CustomEvent('pagescript', {
    //         detail: {
    //             type: SyncDataMsgKey,
    //             from: PagescriptMsgKey,
    //         }
    //     }))
    //     // register event
    //     window.addEventListener("message", (event) => {
    //         const data = event.data
    //         if (data.type === StorageMsgKey) {
    //             if (data.key === 'rules') {
    //                 app.rules = data.value.map(item => ({ ...item, response: JSON.stringify(item.response) }))
    //             } else if (data.key === 'action') {
    //                 app.action = data.value
    //             }
    //         }
    //         navigator.serviceWorker.controller.postMessage(app)
    //     })
    // })
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