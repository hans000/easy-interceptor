import { useState } from 'react';
import wrapKey from '../tools/wrapKey';

const mapKey = wrapKey('map')
const mapValue = localStorage.getItem(mapKey)
const map = mapValue ? JSON.parse(mapValue) : Object.create(null)

export default function useStorage<T>(key: string, value: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const __DEV__ = import.meta.env.DEV
    const [val, setVal] = useState(value)
    const name = wrapKey(key)

    const wrapSetVal = (val) => {
        map[name] = true
        localStorage.setItem(mapKey, JSON.stringify(map))
        if (__DEV__) {
            if (typeof val === 'function') {
                setVal(v => {
                    const result = val(v)
                    localStorage.setItem(name, JSON.stringify(result))
                    return result
                })
            } else {
                localStorage.setItem(name, JSON.stringify(val))
                setVal(val)
            }
        } else {
            if (typeof val === 'function') {
                setVal(v => {
                    const result = val(v)
                    chrome.storage.local.set({ [name]: result })
                    return result
                })
            } else {
                chrome.storage.local.set({ [name]: val })
                setVal(val)
            }
        }
    }
    
    if (! map[name]) {
        wrapSetVal(value)
    }

    return [val, wrapSetVal]
}