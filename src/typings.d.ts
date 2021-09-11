declare type ActionType = 'close' | 'watch' | 'interceptor'

interface Window {
    setting: {
        __hs_action__: ActionType
        __hs_rules__: any[]
    }
}