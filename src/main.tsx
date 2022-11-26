import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import { ConfigProvider } from 'antd'

ReactDOM.createRoot(document.getElementById('root')).render(
    <ConfigProvider locale={zh_CN}>
        <App />
    </ConfigProvider>
)
