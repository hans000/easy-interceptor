# Easy Interceptor

<img src="./assets/header-zh_CN.svg" width="800" height="300">

中文 | [**English**](./readme.md)

## 📑 摘要
一款集成了模拟和拦截请求并拥有一定编程能力的谷歌浏览器插件，其中存储容量、大小用颜色做了指示，界面简洁，交互友好。由于对项目没有依赖性、侵入性，所以开发、测试、生产环境都适用。

## WIKI
- [软件一览图](https://github.com/hans000/easy-interceptor/wiki/%E8%BD%AF%E4%BB%B6%E4%B8%80%E8%A7%88%E5%9B%BE)
- [软件操作](https://github.com/hans000/easy-interceptor/wiki/%E8%BD%AF%E4%BB%B6%E6%93%8D%E4%BD%9C)

## 🚀 使用场景
设想一下明明是要验证一个很简单的东西，但是这个问题复现的前置条件实在太难完成了，导致自己很痛苦。这里的太难完成可能是：

- 业务流程太长（不熟悉流程或不想重走一遍）
- 要验证的是测试环境，不能通过前端硬编码解决
- 修改数据库困难（没有条件改、不会改或者不想麻烦后端改）
- 不想使用代理软件（没必要、没用过或者安装、配置麻烦等）

如何解决上述问题呢？如果可以在客户端接收数据前拦截并加以修改再返回就可以达到目的。Easy Interceptor就是利用上述思路，它可以拦截XMLHttpRequest，fetch数据请求方式的http请求，通过覆盖response，responseText字段，从而达到对数据的修改。作为一个chrome插件，天然的集成在用户测试环境，因此对使用者的心智负担极小。

> 注意：
> 
> 1. 插件仅针对content-type: json类型有效，在不用时请关闭该插件防止出现页面加载异常，或者对dev环境设置白名单，这样可以避免影响其他网站
>
> 2. 如果你是一个熟练度拉满，有着完善的代理环境大可不必使用，仅作为特定场合的补充
> 
> 3. 如果使用cdn版本，请保证能访问https://unpkg.com，首次加载会比较慢。如果加载不出来也可直接使用local版本

## 🎉 特点

- 免费无广告推广，较好的用户体验，提供暗色模式
- 提供录制当前请求（省略手动填写的麻烦）
- 导入导出，工程序列化
- 拥有一定的js编程能力，可以动态处理数据，可打印输出信息
- 集成`monaco-editor`，更方便的编辑处理文本
- 使用cdn，大幅度缩减安装包（仅cdn版本）
- 支持修改响应头，主动发送请求，支持修改请求参数（`params、headers、body`）
- `fake`模式，用于适应不同的场景需求（默认关闭，部分场景下fake模式可能会失效）
- 支持多工作空间，支持网站白名单功能
- ✨支持EventSource数据（设置`chunks`字段，由于一些技术限制，当使用`xhr`请求时必须开启`fake`模式）
- ✨新增代理模式，蓝色Icon

## 📑 使用说明

### 图标状态
- 灰色：关闭状态（数字角标展示当前列表共有多少条数据）
- 橙色：录制状态（数字角标展示当前列表共有多少条数据）
- 紫色：拦截状态（数字角标展示当前列表共启用拦截多少条数据）
- ~~黑色：拦截状态-Fake模式（数字角标展示当前列表共启用拦截多少条数据）~~
- 蓝色：代理状态（数字角标展示当前列表共启用代理多少条数据）

### 左上方工具栏
- 【新增】：添加一条数据
- 【删除】：删除一条数据
- 【导入、导出】：对当前工程的序列化
- 【刷新】：刷新数据，会重置count字段
- 【切换主题】：亮色模式 | 暗色模式
- ~~【fake模式】：是否启用fake，默认关闭，仅对请求进行拦截，依赖后端服务；开启后会使用一个模拟的对象，可以不依赖后端服务~~ (现在支持规则内配置)

### 右上角菜单
- 【关闭状态】：关闭插件
- 【录制功能】：录制请求，方便快速填写规则（仅对Content-Type为json类型的请求有效）
- 【拦截功能】：拦截修改responseText、延迟执行等
- 【代理功能】：支持重定向、修改请求头、响应头、阻止请求等（不支持修改响应体）

## 状态栏
- 【设置】：设置选项
- 【工作空间】：切换工作空间
- 【运行时机】：插件生效的时机，start-js注入即生效，end-DOMContentLoaded，delay-延时一定时间，trigger-当拦截到特定接口后触发，override-当window上的xhr或者fetch被重写时（通常默认就可以生效，但是部分网站不生效时可以尝试其他的模式）
- 【禁用类型】：禁用请求类型：xhr 或者 fetch
- 【存储占用率】：展示数据占用率

### 设置
- 【所有frame生效】：默认只对顶层页面生效，iframe不生效，如果需要则开启此选项
- 【切换主题】：切换主题
- 【启动时打印日志】：打印启动日志
- 【fake模式打印日志】：`fake`模式下打印日志
- 【匹配网站白名单】：匹配哪些网站可以生效，默认是`**`，即所有网站

### Config面板

|属性|类型|说明|
|---|---|---|
|url|string|请求地址|
|test|string|必选，匹配的请求地址。规则参考下面，注意不允许写query参数|
|type|xhr\|fetch|请求类型|
|description|string|描述字段，做备注使用|
|response|object\|array\|null\boolean\|number|响应数据|
|responseText|string|响应数据|
|delay|number|延迟的毫秒数|
|method|enum get\|put\|post\|delete\|patch|请求类型|
|body|Record<string, any>|请求主体|
|status|number|默认200|
|params|[string, string][]|query参数写在这里|
|requestHeaders|Record<string, string>|请求头|
|responseHeaders|Record<string, string>|响应头|
|redirectUrl|string|重定向链接，不能和url一样，会死循环|
|groupId|string|分组id，相同的id会被分配到相同的工作空间|
|chunks|string[]|设置event-source数据源，response、responseText会失效|
|chunkInterval|number|设置数据吐出的间隔，默认1_000|
|chunkTemplate|number|设置数据的格式，默认`data: $1\n\n`|
|faked|boolean|是否启用faked模式，是否启用fake，默认关闭，仅对请求进行拦截，依赖后端服务；开启后会使用一个模拟的对象，可以不依赖后端服务|
|blocked|boolean|是否阻止当前请求|


### test匹配规则

- 当出现`^` `$`时规则为正则匹配；
- 当出现`*`或者`?`时，使用path matcher规则，
- 否则就使用字符串匹配

举例：

- **/api/foo 可以匹配到 https://api/foo 或者 https://v1/api/foo 但是匹配不到 https://api/foo/bar
- /api/foo 可以匹配到 https://api/foo https://v1/api/foo https://api/foo/bar
- /api/foo$ 可以匹配到 https://api/foo https://v1/api/foo 但是匹配不到 https://api/foo/bar


### code面板
通过指定的hooks来动态的修改数据，支持的hooks有
- onMatching
- onResponding
- onResponseHeaders
- onRequestHeaders
- onRedirect
- onBlocking

```
onRedirect((rule: Rule) => {
    return Math.random() > 0.5 ? 'http://foo.com' : 'http://bar.com'
})

onMatching((rule: Rule) => {
    // 内部会shallow merge
    return {
        delay: 1000
    }
})

onResponding((context: Context) => {
    // 内部会shallow merge
    return {
        status: 504
    }
})

onBlocking(rule => {
    return rule.url.includes('foo')
})

declare interface Rule {
    count?: number
    delay?: number
    url?: string
    description?: string
    test: string
    type?: 'xhr' | 'fetch'
    method?: 'get' | 'post' | 'delete' | 'put' | 'patch'
    body?: any
    params?: [string, string][]
    requestHeaders?: Record<string, string>
    status?: number
    response?: any
    responseText?: string
    responseHeaders?: Record<string, string>
    redirectUrl?: string
}
interface Context {
    xhr?: XMLHttpRequest
    response?: Response
    rule: Rule
}
declare function onResponseHeaders(fn: (headers: Record<string, string>) => Record<string, string> | void): void
declare function onRequestHeaders(fn: (headers: Record<string, string>) => Record<string, string> | void): void
declare function onRedirect(fn: (rule: Rule) => string | void): void
declare function onMatching(fn: (rule: Rule) => MatchingRule | void): void
declare function onBlocking(fn: (rule: Rule) => boolean): void
declare function onResponding(fn: (context: Context) => ResponseRule | void): void
interface ResponseRule {
    response?: any
    responseText?: string
    status?: number
}
interface MatchingRule extends ResponseRule {
    delay?: number
    responseHeaders?: Record<string, string>
}
```

### 修改请求、响应头

插件允许做删除，覆盖或追加操作，规则如下：
- `-` 删除该字段
- `!` 覆盖该字段

假如现在的header是
```
X-Foo: 1
X-Foo: 2
Date: Thu, 29 Aug 2024 13:23:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-bNcy1ttaqgyUqTX/jcUOknvqYio"
```

追加：
```
{
    "responseHeaders": {
        "X-Foo": 3
    }
}

>>>
X-Foo: 1
X-Foo: 2
X-Foo: 3
Date: Thu, 29 Aug 2024 13:23:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-bNcy1ttaqgyUqTX/jcUOknvqYio"

```

覆盖：
```
{
    "responseHeaders": {
        "!X-Foo": 3
    }
}

>>>
X-Foo: 3
Date: Thu, 29 Aug 2024 13:23:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-bNcy1ttaqgyUqTX/jcUOknvqYio"

```

删除：
```
{
    "responseHeaders": {
        "-X-Foo": 3
    }
}

>>>
Date: Thu, 29 Aug 2024 13:23:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 46
ETag: W/"2e-bNcy1ttaqgyUqTX/jcUOknvqYio"

```

## ⭐ 使用场景

### 录制数据

可以帮你快速的填充需要拦截的接口信息，重新请求接口即可

### 拦截数据

选择拦截模式，勾选需要拦截的接口，重新请求接口即可

### 重定向

设置`redirect`字段可以转发接口

### 阻止接口

设置`blocked`字段为`true`可以阻止接口响应

### 测试后端接口

插件提供了测试后端接口的功能，你可以理解为是一个简单的postman，由于插件端不存在跨域的问题，因此无需代理，设置好相应的请求头即可。


## 💬 Q&A

### 🔹 为什么有时候刷新页面数据没有拦截成功
开发环境网页加载比较快，插件可能还有生效就请求就结束了，可以适当延迟请求执行

### 🔹 为什么没有拦截接口
可能是接口走了缓存，注意把浏览器Network的disable cache勾选上


### 🔹 为什么会有两个安装包
推荐使用cdn版本（确保可以访问https://unpkg.com），带local的为离线版，更适合局域网的用户


### 🔹 为什么插件窗口只有800x600
这个是由于浏览器限制的，popup的形式最大支持800x600，该形式的好处在于尽可能不影响项目本身（不足在于每次都会重新加载页面，因此插件做了很多的序列化以保证较好的用户体验）


### 🔹 存储只有5M，如何突破限制
这里有两种方式可以应对部分场景：
- 如果单条数据比较大，而需要变动的字段又比较少，可以在code面板通过js修改真实数据达到修改效果
- 使用redirectUrl选项



### 🔹 为什么是262kb
这里是为了方便写程序，y = f(x) = log2(x)，取了个公差为2的等差数列18 20 22；也就是2^18 = 262144，并且这些值也比较合适。



### 🔹 为什么仅支持json类型的请求
起初是为了解决自测阶段部分场景的复现问题（现在的应用前后端交互基本都是json类型），期间使用了几个类似的插件发现用户体验不是很好，一些代理软件功能很强，但是个人也不太喜欢太重的配置，使用的环境要尽可能单一。


## License
[AGPL-3.0](./LICENSE)