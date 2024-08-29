## v1.18.0
- 重构了 xhr 逻辑
- 移除了 fake 模式，支持规则内配置，粒度更小了，使用`faked`字段
- 添加新的模式，代理模式
- 规则中新增 blocked、faked 字段
- 新增onBlocking hook
- 新增支持event-source-stream，配套的字段（chunks, chunkInterval, chunkTemplate）
- 支持更细粒度的修改headers
- 完善功能支持 abort 操作

## v1.17.0
- 支持 whiteList 配置
- 修复了xhr fake模式下不生效的问题

## v1.16.1
- 支持 font 类型资源的拦截

## v1.16.0
- 更新 icon
- vite 更新到 5.0，antd 更新到5.0
- 添加禁用类型，可设置禁用 xhr 或 fetch
- 添加插件拦截时机，可设置 start end delay trigger override
- 修复 fake 不生效的问题

## v1.15.0
- 添加 run at 功能

## v1.14.4
- 修复页面刷新时，工作空间没有数据没有更新的问题
- 更改 license

## v1.14.3
- 添加 onRedirect、onResponseHeaders、 onRequestHeaders 钩子
- 支持拦截重定向 css js 类型的资源
- 优化列表信息展示

## v1.14.0
- 添加 groupId 字段，支持工作空间

## v1.13.0
- 优化 injected script 的运行逻辑
- 修改 code 面板的处理逻辑，增加 ts 提示逻辑
- 添加配置面板
- 优化暗色模式

## v1.12.0
- 增加控制台提示信息
- 录制模式添加过滤规则
- 通配符匹配或字符串包含匹配
- 拦截开关

## v.1.11.0
- 迁移到 react 18
- 配置规则中添加 params 的判断
- 添加 description 选项
- 修复搜索 bug
- 添加多语言

## v.1.10.3
- 调整 type 选项，缺省时自动匹配

## v.1.10.2
- 添加 type 型列

## v.1.10.1
- 添加了 test, type 选项

## v.1.10.0
- 添加了 fetch

## v1.8.0
- 添加了 redirectUrl

## v1.7.2

- 替换 minimatch

## v1.7.1

- 重写 fakeXhr setResponseHeaders
- 添加 patch 类型

## v1.7.0

- 添加 faked 选项，用于适应不同的使用场景

## v1.6.3

- 修复编辑器 json 校验问题

## v1.6.2

- 添加 local 版本

## v1.6.1

- 实现 require 机制，通过 cdn 引入 minimatch
- 修复筛选bug

## v1.6

- 使用 glob 规则匹配 url，移除正则匹配
- 扁平数据管理，支持过滤字段
- 支持修改响应头
- 使用 cdn，大幅度缩减安装包
