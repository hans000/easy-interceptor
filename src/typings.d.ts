declare type ActionType = 'close' | 'watch' | 'interceptor'

interface Window {
    setting: {
        __hs_action: ActionType
        __hs_rules: any[]
    }
}