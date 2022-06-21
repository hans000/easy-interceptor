import { IframeMsgKey, StorageMsgKey } from "./constants";

/**
 * 构造storage类型的消息对象
 */
export function buildStorageMsg(key: 'rules' | 'action', value: any) {
    return {
        type: StorageMsgKey,
        from: IframeMsgKey,
        key,
        value,
    }
}