import { FakedFieldKey } from './../tools/constants';
import { ActionFieldKey, RulesFieldKey } from "../tools/constants"
import { createBackgroudAction } from '../tools/message';

/** 在页面上插入js */
export function createScript(path: string) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.extension.getURL(path))
    document.documentElement.appendChild(script)
    return new Promise(resolve => script.addEventListener('load', () => {
        script.remove()
        resolve(void 0)
    }))
}

/** 初始化数据 */
export function syncData() {
    chrome.storage.local.get([ActionFieldKey, RulesFieldKey, FakedFieldKey], (result) => {
        const { [ActionFieldKey]: action, [RulesFieldKey]: rules, [FakedFieldKey]: faked } = result
        if (result.hasOwnProperty(ActionFieldKey)) {
            postMessage(createBackgroudAction('action', action))
        }
        if (rules) {
            postMessage(createBackgroudAction('rules', rules))
        }
        if (faked) {
            postMessage(createBackgroudAction('faked', faked))
        }
    })
}