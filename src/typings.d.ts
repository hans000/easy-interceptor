/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
declare type ActionType = 'close' | 'watch' | 'intercept'

interface Window {
    MonacoEnvironment: any
    _XMLHttpRequest: typeof XMLHttpRequest
    _fetch: typeof fetch
}