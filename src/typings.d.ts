declare const chrome: any

interface Window {
    setting: {
        __hs_enable: boolean
        __hs_rules: Array<any>
        __hs_index: number
    }
}