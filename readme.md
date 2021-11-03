# Easy Interceptor

[中文](./readme-zh.md) | **English**

## abstract
Easy Interceptor is a Chrome extension that intercepts HTTP requests in the form of XMLHttpRequest data requests. It intercepts and modifs data by overwriting the Response and responseText fields. It is mainly used for debugging Web pages.

> notice: It does not modify the original request, so the info in the devtool-network panel is not modified.

## usage


![demo](./assets/demo.png)

### icon status
- gray: close status
- orange: watching status
- purple: intercepting status

### top-left tool
- [add]: add a item
- [remove]: remove a item
- [import export]: serialization function
- [refresh]: refresh data
- [toggle theme]: support light and dark

### top-right tool
- close: close extension
- watch: Intercepts a request whose current content-Type is JSON
- intercept: custom responseText

### Usage

**Method 1**: Create a new data and fill in the general and response options manually, like this

<img src="./assets/demo-add.gif" alt="demo" style="width:80%;padding-left:10%" />

**Method 2**: Use the watch mode to re-request the api and then modify the data

<img src="./assets/demo-watch.gif" alt="demo2" style="width:80%;padding-left:10%" />

**Method 3**：Use the watch mode to replay the api（notice：Use this method can not get the response, you need to fill in manually）

<img src="./assets/demo-replay.gif" alt="demo3" style="width:80%;padding-left:10%" />

**方式4**：You can define an anonymous function in the Code panel to transform data，(response, config) => response

<img src="./assets/demo-code.gif" alt="demo4" style="width:80%;padding-left:10%" />

## tips
- Just keep running in development
- Because the storage is only 5M, the extension uses the shorten function to simplify the data. (rules: Enable algorithm when data exceeds 50,000 characters. Refine data by recursive halving when an array of more than 10 items or a string of more than 200 characters is satisfied)
- You can write js object and the program will try to fix it, like this

<img src="./assets/demo-repair.gif" alt="demo4" style="width:80%;padding-left:10%" />