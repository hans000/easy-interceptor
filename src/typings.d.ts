declare type ActionType = 'close' | 'watch' | 'intercept'

interface Window {
    setting: {
        __hs_action__: ActionType
        __hs_rules__: any[]
    }
}