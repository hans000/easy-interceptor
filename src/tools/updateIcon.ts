/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ActiveGroupId, ConfigInfoFieldKey } from './../tools/constants';
import { MatchRule } from "../App"
import { RulesFieldKey } from "../tools/constants"

type RGBA = [number, number, number, number]
const INTERCEPT: RGBA = [136, 20, 127, 255]
const WATCH: RGBA = [241, 89, 43, 255]
const CLOSE: RGBA = [200, 200, 200, 255]
const PROXY: RGBA = [22, 119, 255, 255]

function setBadgeText(rules: MatchRule[], action: ActionType) {
    let count = 0
    let color: RGBA = INTERCEPT
    if (action === 'intercept') {
        count = rules.filter(item => item.enable).length
        color = INTERCEPT
    } else if (action === 'watch') {
        count = rules.length
        color = WATCH
    } else if (action === 'proxy') {
        count = rules.filter(item => item.enable).length
        color = PROXY
    } else {
        count = rules.length
        color = CLOSE
    }
    const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
    chrome.browserAction.setBadgeText({ text })
    chrome.browserAction.setBadgeBackgroundColor({ color })
}

function setIcon(action: ActionType) {
    const suffix = action === 'watch'
        ? '-red'
        : action === 'close'
        ? '-gray'
        : action === 'proxy'
        ? '-blue'
        : ''
    chrome.browserAction.setIcon({
        path: {
            16: `/images/128${suffix}.png`,
            32: `/images/128${suffix}.png`,
            48: `/images/128${suffix}.png`,
            128: `/images/128${suffix}.png`,
        }
    })
}

export default function updateIcon() {
    chrome.storage.local.get([ConfigInfoFieldKey, RulesFieldKey, ActiveGroupId], (result) => {
        const configInfo = result[ConfigInfoFieldKey] || {}
        if (result.hasOwnProperty(ConfigInfoFieldKey)) {
            setIcon(configInfo.action)
        }
        if (result.hasOwnProperty(RulesFieldKey)) {
            setBadgeText(
                result[RulesFieldKey].filter((rule: MatchRule) => rule.groupId === result[ActiveGroupId]),
                configInfo.action,
            )
        }
    })
}
