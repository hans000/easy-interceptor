# Easy Interceptor

中文 | [English](./readme.md)

## 摘要
Easy Interceptor是一个chrome插件，它可以拦截XMLHttpRequest数据请求方式的http请求，通过覆盖response，responseText字段达到对数据的拦截和修改，多用于调试web页面。

> 注意：它并不会修改原始的请求，因此devtool-network的信息不会改变

![演示](./assets/demo.gif)

## 使用说明

### 图标状态
- 灰色：关闭状态
- 橙色：监听状态
- 紫色：拦截状态

### 左上方工具栏
- 【新增】：添加一条数据
- 【删除】：删除
- 【导入、导出】：对当前工程的序列化
- 【刷新】：刷新数据
- 【切换主题】：亮色模式 | 暗色模式

### 右上角菜单
- 关闭状态：关闭插件
- 监听功能：监听请求（仅对Content-Type为json类型的请求有效）
- 拦截功能：自定义responseText

### 注意事项
- 仅在开发时使用，不使用时请关闭
- 因为存储仅有5M，插件使用shorten函数对单条数据做精简（规则：1. 保留数组前10项; 2. 保留字符串前200字符）