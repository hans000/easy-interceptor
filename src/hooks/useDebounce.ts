import { useRef, useEffect, useCallback } from "react"

export function useDebounce(fn: any, delay = 300, dep = []) {
    const { current } = useRef({ fn, timer: null })
    
    useEffect(
        () => {
            current.fn = fn
        },
        [fn]
    )

    return useCallback(function f(...args) {
        if (current.timer) {
            clearTimeout(current.timer)
        }
        current.timer = setTimeout(() => {
            current.fn.call(this, ...args)
        }, delay)
    }, dep)
}