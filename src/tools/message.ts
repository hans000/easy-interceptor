/**
 * 构造storage类型的消息对象
 */
export function buildStorageMsg(key: 'rules' | 'action', value: any) {
    return {
        type: '__hs_storage__',
        from: '__hs_iframe__',
        key,
        value,
    }
}