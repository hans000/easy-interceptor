/** 在页面上插入js */
function createScript(path) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.extension.getURL(path))
    document.documentElement.appendChild(script)
    return new Promise(resolve => script.addEventListener('load', () => resolve()))
}