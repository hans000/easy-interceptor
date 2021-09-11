/** 在页面上插入js */
function createScript(path) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.extension.getURL(path))
    document.documentElement.appendChild(script)
    return new Promise(resolve => script.addEventListener('load', () => {
        script.remove()
        resolve()
    }))
}

/** 初始化数据 */
function initData() {
    chrome.storage.local.get(['__hs_action__', '__hs_rules__'], (result) => {
        if (result.hasOwnProperty('__hs_action__')) {
            postMessage({ type: '__hs_storage__', to: 'pagescript', key: 'action', value: result.__hs_action__ })
        }
        if (result.__hs_rules__) {
            postMessage({ type: '__hs_storage__', to: 'pagescript', key: 'rules', value: result.__hs_rules__ })
        }
    })
}