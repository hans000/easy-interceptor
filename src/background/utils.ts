import { FakedFieldKey } from './../tools/constants';
import { MatchRule } from "../App"
import { ActionFieldKey, RulesFieldKey } from "../tools/constants"

function setBadgeText(rules: MatchRule[], action: ActionType, faked: boolean) {
    let count = 0
    let color: any = [136, 20, 127, 255]
    if (action === 'intercept') {
        count = rules.filter(item => item.enable).length
        color = faked ? [43, 44, 45, 255] : [136, 20, 127, 255]
    } else if (action === 'watch') {
        count = rules.length
        color = [241, 89, 43, 255]
    } else {
        count = rules.length
        color = [200, 200, 200, 255]
    }
    const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
    chrome.browserAction.setBadgeText({ text })
    chrome.browserAction.setBadgeBackgroundColor({ color })
}

function setIcon(action: ActionType, faked: boolean) {
    const suffix = action === 'watch'
        ? '-red'
        : action === 'close'
        ? '-gray'
        : faked
        ? '-black'
        : ''
    chrome.browserAction.setIcon({
        path: {
            16: `/images/16${suffix}.png`,
            32: `/images/32${suffix}.png`,
            48: `/images/48${suffix}.png`,
        }
    })
}

export function updateIcon(props = [ActionFieldKey, RulesFieldKey, FakedFieldKey]) {
    chrome.storage.local.get(props, (result) => {
        if (result.hasOwnProperty(ActionFieldKey)) {
            setIcon(result[ActionFieldKey], result[FakedFieldKey])
        }
        if (result.hasOwnProperty(RulesFieldKey)) {
            setBadgeText(result[RulesFieldKey], result[ActionFieldKey], result[FakedFieldKey])
        }
    })
}
