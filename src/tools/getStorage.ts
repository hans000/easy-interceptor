/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
export default async function getStorage(keys: string[]): Promise<Record<string, any>> {
    const __DEV__ = import.meta.env.DEV
    if (__DEV__) {
        return Promise.resolve(keys.reduce(
            (acc, key) => {
                try {
                    acc[key] = JSON.parse(localStorage.getItem(key))
                } catch (error) {
                    acc[key] = localStorage.getItem(key)
                }
                return acc
            },
            {}
        ))
    } else {
        return new Promise(resolve => chrome.storage.local.get(keys, result => resolve(result)))
    }
}