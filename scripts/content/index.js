
// 加载脚本
async function loadScripts() {
    await createScript('scripts/injected/ajaxhook.js')
    // await createScript('scripts/injected/minimatch.js')
    await createScript('scripts/injected/core.js')
    initData()
    // createScript('scripts/injected/ajaxhook.js').then(() => {
    //     // 初始化数据
    //     createScript('scripts/injected/core.js').then(() => {
    //         initData()
    //         // if (! sessionStorage.getItem('__hs_loaded')) {
    //         //     sessionStorage.setItem('__hs_loaded', 'true')
    //         //     chrome.storage.local.set({
    //         //         __hs_action: 'close'
    //         //     }, () => {
    //         //         initData()
    //         //         chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    //         //             chrome.tabs.sendMessage(tabs[0].id, { type: '__Hs_Transformer__', to: 'background', from: 'content' })
    //         //         })
    //         //     })
    //         // } else {
    //         //     initData()
    //         // }
    //     })
    // })
}


loadScripts()

let iframeLoaded = false;

// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === '__Hs_Transformer__' && msg.to === 'content') {
        if (msg.hasOwnProperty('iframeScriptLoaded')) {
            if (msg.iframeScriptLoaded) iframeLoaded = true;
        } else {
            if (msg.from === 'self') {
                chrome.runtime.sendMessage({  ...msg, type: '__Hs_Transformer__', to: 'iframe' });
            } else {
                postMessage({ ...msg, to: 'pageScript' });
            }
        }
    }
});

// 接收pageScript传来的信息，转发给iframe
window.addEventListener("pageScript", function (event) {
    if (iframeLoaded) {
        chrome.runtime.sendMessage({ ...event.detail, type: '__Hs_Transformer__', to: 'iframe' });
    } else {
        let count = 0;
        const checktLoadedInterval = setInterval(() => {
            if (iframeLoaded) {
                clearInterval(checktLoadedInterval);
                chrome.runtime.sendMessage({ ...event.detail, type: '__Hs_Transformer__', to: 'iframe' });
            }
            if (count++ > 500) {
                clearInterval(checktLoadedInterval);
            }
        }, 10);
    }
}, false);
