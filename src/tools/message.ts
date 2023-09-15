/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { BackgroundMsgKey, PagescriptMsgKey, PopupMsgKey, StorageMsgKey } from "./constants";

export interface EventProps {
    type: string
    from: string
    to: string
    key: string
    value: any
}

export type SyncFields = 'rules' | 'configInfo' | 'trigger'

export function createBackgroudAction(key: SyncFields, value: any) {
    return {
        type: StorageMsgKey,
        from: BackgroundMsgKey,
        to: PagescriptMsgKey,
        key,
        value
    }
}

export function createStorageAction(key: SyncFields, value: any) {
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
