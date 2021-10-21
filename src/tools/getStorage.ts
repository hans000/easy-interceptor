import wrapKey from "./wrapKey"

export default async function getStorage(keys: string[]): Promise<Record<string, any>> {
    const __DEV__ = import.meta.env.DEV
    if (__DEV__) {
        return Promise.resolve(keys.reduce(
            (acc, key) => {
                const name = wrapKey(key)
                try {
                    acc[key] = JSON.parse(localStorage.getItem(name))
                } catch (error) {
                    acc[key] = localStorage.getItem(name)
                }
                return acc
            },
            {}
        ))
    } else {
        return new Promise(resolve => {
            const names = keys.map(k => wrapKey(k))
            chrome.storage.local.get(names, result => {
                resolve(Object.keys(result).reduce(
                    (acc, name) => {
                        const key = name.slice(5, -2)
                        acc[key] = result[name]
                        return acc
                    },
                    {}
                ))
            })
        })
    }
}