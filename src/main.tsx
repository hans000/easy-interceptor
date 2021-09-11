import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import { ConfigProvider } from 'antd'

ReactDOM.render(
    <React.StrictMode>
        <ConfigProvider locale={zh_CN}>
            <App />
        </ConfigProvider>
    </React.StrictMode>,
    document.getElementById('root')
)
