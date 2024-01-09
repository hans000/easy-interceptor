/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import ReactDOM from 'react-dom/client'
import App from './App'
import { ConfigProvider } from 'antd'

const __DEV__ = import.meta.env.DEV

const isZHCN = __DEV__ ? true : chrome.i18n.getUILanguage().includes('zh')

ReactDOM.createRoot(document.getElementById('root')).render(
    // <ConfigProvider locale={isZHCN ? zh_CN : undefined}>
        <App />
    // </ConfigProvider>
)
