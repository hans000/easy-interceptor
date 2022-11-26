# Easy Interceptor

[中文](./readme-zh_CN.md) | **English**

## abstract
Easy Interceptor is a Chrome extension that intercepts HTTP requests in the form of XMLHttpRequest data requests. It intercepts and modifs data by overwriting the Response and responseText fields. It is mainly used for debugging Web pages.


## 🚀 Scenarios
Imagine that it is obviously to verify a very simple thing, but the preconditions for the recurrence of this problem are too difficult to complete, causing pain. The difficulty may be:

- The working process is too long (not familiar with the process or do not want to go through it again)
- The test environment to be verified cannot be solved through front-end hard coding
- It is difficult to modify the database (without conditions, will not change, or does not want to bother the back-end)
- Do not want to use the agent software (unnecessary, unused, or difficult to install and configure)

How to solve the above problems? If you can intercept and modify the data before the client receives it, you can achieve the goal. Easy Interceptor makes use of the above ideas. It can intercept http requests in XMLHttpRequest and fetch data requests, and modify data by overwriting the response and responseText fields. As a chrome extension, it is naturally integrated in the user test environment, so the mental burden on users is minimal.

- xhr: a fake XMLHttpRequest is implemented

- fetch: a fake fetch is implemented

> Notice: 
> 
> The extension is only valid for content type: json type. Please close the extension when do not use
>
> If you are skilled and have a perfect agent environment, you don't need to use it
> 
> If you use the cdn version, make sure you can access https://unpkg.com. The first load will be slow. Or use the local version directly

## 🎉 Feature

- Free advertising free promotion, better user interaction, and dark mode
- Provide monitoring of current requests (omit the trouble of manual filling)
- Import/export, project serialization - has certain js programming ability, can dynamically process data, and can print and output information
- Integrated monaco editor for more convenient text editing and processing
- Use cdn to greatly reduce the installation package (only cdn version)
- Support modifying response headers, actively sending requests, and modifying request parameters (params, headers, body)
- Fake mode, which is used to adapt to different scenarios (it is closed by default and may fail in some scenarios)


## 📑 Usage

### Icon Status
- gray: Closed（The number corner shows how many pieces of data are in the current list）
- orange: Watching（The number corner shows how many pieces of data are in the current list）
- purple: Intercepting（The digital corner shows how many pieces of data are intercepted in the current list）
- black: Intercepting-Fake Mode（The digital corner shows how many pieces of data are intercepted in the current list）

### Left Top Tools
- 【新增】: add a datum
- 【删除】: remove a datum
- 【导入、导出】: serialize project
- 【刷新】: refresh, will reset `count` field 
- 【切换主题】: light | dark
- 【fake模式】: turn on fake mode, default turn off, Only intercept requests, relying on back-end services; When enabled, a simulated object will be used, which can be independent of back-end services

### Right Top Menu
- 关闭: close this extension
- 启用监听: watching fetch（just work on Content-Type is json）
- 启用拦截: custome responseText

### Config Panel

|field|type|description|
|---|---|---|
|url|string|request url|
|test|string|required, match request url, ant-path-matcher rule, cannot set query|
|type|xhr\|fetch|request type, \_\_map\_\_'s second arg will be undefined if uninitialized|
|response|object\|array\|null\boolean\|number||
|responseText|string||
|delay|number||
|method|enum get\|put\|post\|delete\|patch|request type|
|body|Record<string, any>||
|status|number|default 200|
|params|[string, string][]|set query|
|requestHeaders|Record<string, string>||
|responseHeaders|Record<string, string>||
|redirectUrl|string|cannot be the same as the url, will cause a loop|

### Code Panel
declare \_\_map\_\_ function to modify response by js
```
function __map__(context, inst: XMLHttpRequest | Response | undefined) {
    return {
        // will be shallow merge
        response: {
            foo: Math.random().toString()
        }
    }
}
```


## ⭐ Usage Scenarios

### Watching

It can help you quickly fill in the interface information to be intercepted, and then re request the interface

### Intercepting

Select the interception mode, tick the interface to be intercepted, and then re request the interface

### Test back-end api

The extension provides the function of testing the back-end interface. You can understand it as a simple postman. Since the extension side does not have the problem of cross domain, no proxy is required, and the corresponding request header can be set.


## 💬 Q&A

### 🔹 Why there are two installation packages
It is recommended to use the cdn version (ensure access to https://unpkg.com). The offline version with local is more suitable for LAN users


### 🔹 Why is the extension window only 800x600
This is due to browser restrictions. The maximum support for the form of popup is 800x600. The advantage of this form is that it does not affect the project itself as much as possible (the disadvantage is that the page will be reloaded every time, so the extension does a lot of serialization to ensure a better user interaction)


### 🔹 The storage is only 5M, how to break the limit
There are two ways to deal with some scenarios:

-If a single piece of data is relatively large and the number of fields to be changed is relatively small, you can modify the real data through js in the code panel to achieve the modification effect
-Use the redirectUrl option



### 🔹 Why is 262kb
Here, for the convenience of writing programs, y=f(x)=log2(x), an equal difference number sequence 18, 20, 22 with a tolerance of 2 is taken; That is, 2^18=262144, and these values are also appropriate.



### 🔹 Why only json type requests are supported
At first, it was intended to solve the problem of the recurrence of some scenarios in the self-test phase (the modern project of front-end and back-end interactions are basically of the json type). Some agent software had strong functions, but I didn't like too much configuration, and the use environment should be as single as possible.


## License
[MIT](./LICENSE)