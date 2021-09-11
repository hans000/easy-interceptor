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
    chrome.storage.local.get(['__hs_action', '__hs_rules'], (result) => {
        if (result.hasOwnProperty('__hs_action')) {
            postMessage({ type: '__Hs_Transformer__', to: 'pageScript', key: 'action', value: result.__hs_action })
        }
        if (result.__hs_rules) {
            postMessage({ type: '__Hs_Transformer__', to: 'pageScript', key: 'rules', value: result.__hs_rules })
        }
    })
}