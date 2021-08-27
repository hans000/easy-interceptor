
// 加载脚本
createScript('scripts/ajaxhook.min.js').then(() => {
    // 初始化数据
    createScript('scripts/core.js').then(() => {
        chrome.storage.local.get(['__hs_enable', '__hs_rules'], (result) => {
            if (result.hasOwnProperty('__hs_enable')) {
                postMessage({ type: '__Hs_Transformer__', to: 'pageScript', key: 'enable', value: result.__hs_enable })
            }
            if (result.__hs_rules) {
                postMessage({ type: '__Hs_Transformer__', to: 'pageScript', key: 'rules', value: result.__hs_rules })
            }
        })
    })
}) 

let iframe, iframeLoaded = false;

// 只在最顶层页面嵌入iframe
if (window.self === window.top) {
    document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
            iframe = document.createElement('iframe');
            iframe.className = "api-interceptor";
            iframe.style.cssText = `
                height: 100%!important;
                width: 100%!important;
                min-width: 1px!important;
                position: fixed!important;
                top: 0!important;
                right: 0!important;
                left: auto!important;
                bottom: auto!important;
                z-index: 9999999999!important;
                transform: translateX(100%)!important;
                transition: all .4s!important;
                box-shadow: 0 0 15px 2px rgba(0,0,0,0.12)!important;
            `
            iframe.src = chrome.extension.getURL("dist/index.html")
            document.body.appendChild(iframe);
            let show = false;

            chrome.runtime.onMessage.addListener((msg, sender) => {
                if (msg == 'toggle') {
                    show = !show;
                    iframe.style.setProperty('transform', show ? 'translateX(0)' : 'translateX(-100%)', 'important');
                }

                return true;
            });
        }
    }
}

// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === '__Hs_Transformer__' && msg.to === 'content') {
        if (msg.hasOwnProperty('iframeScriptLoaded')) {
            if (msg.iframeScriptLoaded) iframeLoaded = true;
        } else {
            postMessage({ ...msg, to: 'pageScript' });
        }
    }
});

// 接收pageScript传来的信息，转发给iframe
window.addEventListener("pageScript", function (event) {
    if (iframeLoaded) {
        chrome.runtime.sendMessage({ type: '__Hs_Transformer__', to: 'iframe', ...event.detail });
    } else {
        let count = 0;
        const checktLoadedInterval = setInterval(() => {
            if (iframeLoaded) {
                clearInterval(checktLoadedInterval);
                chrome.runtime.sendMessage({ type: '__Hs_Transformer__', to: 'iframe', ...event.detail });
            }
            if (count++ > 500) {
                clearInterval(checktLoadedInterval);
            }
        }, 10);
    }
}, false);
