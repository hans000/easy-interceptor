/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ActiveGroupId, ConfigInfoFieldKey } from './../tools/constants';
import { MatchRule } from "../App"
import { RulesFieldKey } from "../tools/constants"

type RGBA = [number, number, number, number]
const FAKED_COLOR: RGBA = [43, 44, 45, 255]
const INTERCEPT: RGBA = [136, 20, 127, 255]
const WATCH: RGBA = [241, 89, 43, 255]
const CLOSE: RGBA = [200, 200, 200, 255]

function setBadgeText(rules: MatchRule[], action: ActionType, faked: boolean) {
    let count = 0
    let color: RGBA = INTERCEPT
    if (action === 'intercept') {
        count = rules.filter(item => item.enable).length
        color = faked ? FAKED_COLOR : INTERCEPT
    } else if (action === 'watch') {
        count = rules.length
        color = WATCH
    } else {
        count = rules.length
        color = CLOSE
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
            setIcon(configInfo.action, configInfo.faked)
        }
        if (result.hasOwnProperty(RulesFieldKey)) {
            setBadgeText(
                result[RulesFieldKey].filter(rule => rule.groupId === result[ActiveGroupId]),
                configInfo.action,
                configInfo.faked
            )
        }
    })
}
