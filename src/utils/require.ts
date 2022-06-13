const modules = {}

class AsyncQueue {
    private _tasks: Function[] = []
    private _running = false
    private _index = 0

    public push(fn: Function) {
        this._tasks.push(fn)
        if (!this._running && this._index < this._tasks.length) {
            setTimeout(() => this._run())
        }
    }

    private _run() {
        let promise = Promise.resolve()
        for (; this._index < this._tasks.length; this._index++) {
            const task = this._tasks[this._index]
            promise = promise.then(() => task())
        }
    }
}

const queue = new AsyncQueue()

function require(path: string) {
    const module = modules[path]
    if (!module) {
        throw new Error('failed to require "' + path + '"')
    }
    return module
}

interface RequireConfig {
    name: string
    path?: string
    fn?: () => void
    var?: string
}

function mounted(config: RequireConfig, fn: Function = config.fn) {
    modules[config.name] = fn
    if (config.var) {
        window[config.var] = fn
    }
}

require.register = function (config: RequireConfig) {
    queue.push(() => {
        if (config.fn) {
            return Promise.resolve().then(() => {
                mounted(config)
            })
        }
        return runScript(config.path, config).then(fn => {
            mounted(config, fn)
        }).catch((err) => {
            if (modules[config.name] !== err) {
                throw err
            }
        })
    })
}

function runScript(path: string, config: RequireConfig) {
    const cachedModule = modules[config.name]
    if (cachedModule) {
        return Promise.reject(cachedModule)
    }

    return fetch(path)
        .then(res => res.text())
        .then(code => eval(`
                ;((ctx) => {
                    const module = {
                        exports: null
                    }
                    ${code}
                    return module.exports
                })(${JSON.stringify(config)})
            `))
}


export default require