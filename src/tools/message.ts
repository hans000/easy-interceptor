import { BackgroundMsgKey, PagescriptMsgKey, PopupMsgKey, StorageMsgKey } from "./constants";

export interface EventProps {
    type: string
    from: string
    to: string
    key: string
    value: any
}

export function createBackgroudAction(key: 'rules' | 'action' | 'faked', value: any) {
    return {
        type: StorageMsgKey,
        from: BackgroundMsgKey,
        to: PagescriptMsgKey,
        key,
        value
    }
}

export function createStorageAction(key: 'rules' | 'action' | 'faked', value: any) {
    return {
        type: StorageMsgKey,
        from: PopupMsgKey,
        to: BackgroundMsgKey,
        key,
        value,
    }
}

export function createPagescriptAction(type: string, data?: any) {
    return {
        detail: {
            type,
            from: PagescriptMsgKey,
            data,
        }
    }
}