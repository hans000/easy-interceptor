import { ActionFieldKey, RulesFieldKey, StorageMsgKey } from "../tools/constants"

/** 在页面上插入js */
export function createScript(path: string) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.runtime.getURL(path))
    document.documentElement.appendChild(script)
    return new Promise(resolve => script.addEventListener('load', () => {
        script.remove()
        resolve(void 0)
    }))
}

/** 初始化数据 */
export function syncData() {
    chrome.storage.local.get([ActionFieldKey, RulesFieldKey], (result) => {
        const { [ActionFieldKey]: action, [RulesFieldKey]: rules } = result
        if (result.hasOwnProperty(ActionFieldKey)) {
            postMessage({ type: StorageMsgKey, to: 'pagescript', key: 'action', value: action })
        }
        if (rules) {
            postMessage({ type: StorageMsgKey, to: 'pagescript', key: 'rules', value: rules })
        }
    })
}