## v1.16.1
- 支持font类型资源的拦截

## v1.16.0
- 更新icon
- vite更新到5.0，antd更新到5.0
- 添加禁用类型，可设置禁用 xhr 或 fetch
- 添加插件拦截时机，可设置start end delay trigger override
- 修复fake不生效的问题

## v1.15.0
- 添加run at功能

## v1.14.4
- 修复页面刷新时，工作空间没有数据没有更新的问题
- 更改license

## v1.14.3
- 添加onRedirect、onResponseHeaders、 onRequestHeaders钩子
- 支持拦截重定向css js类型的资源
- 优化列表信息展示

## v1.14.0
- 添加groupId字段，支持工作空间

## v1.13.0
- 优化injected script的运行逻辑
- 修改code面板的处理逻辑，增加ts提示逻辑
- 添加配置面板
- 优化暗色模式

## v1.12.0
- 增加控制台提示信息
- 监听模式添加过滤规则
- 通配符匹配或字符串包含匹配
- 拦截开关

## v.1.11.0
- 迁移到react18
- 配置规则中添加params的判断
- 添加description选项
- 修复搜索bug
- 添加多语言

## v.1.10.3
- 调整type选项，缺省时自动匹配

## v.1.10.2
- 添加type型列

## v.1.10.1
- 添加了test, type选项

## v.1.10.0
- 添加了fetch

## v1.8.0
- 添加了redirectUrl

## v1.7.2

- 替换minimatch

## v1.7.1

- 重写fakeXhr setResponseHeaders
- 添加patch类型

## v1.7.0

- 添加faked选项，用于适应不同的使用场景

## v1.6.3

- 修复编辑器json校验问题

## v1.6.2

- 添加local版本

## v1.6.1

- 实现require机制，通过cdn引入minimatch
- 修复筛选bug

## v1.6

- 使用glob规则匹配url，移除正则匹配
- 扁平数据管理，支持过滤字段
- 支持修改响应头
- 使用cdn，大幅度缩减安装包
