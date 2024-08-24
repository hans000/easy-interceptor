/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { useRef, useEffect, useCallback } from "react"

export function useDebounce(fn: any, delay = 300, dep = []) {
    const { current } = useRef({ fn, timer: 0 })
    
    useEffect(
        () => {
            current.fn = fn
        },
        [fn]
    )

    return useCallback(function f(...args: any[]) {
        if (current.timer) {
            clearTimeout(current.timer)
        }
        current.timer = window.setTimeout(() => {
            current.fn(...args)
        }, delay)
    }, dep)
}