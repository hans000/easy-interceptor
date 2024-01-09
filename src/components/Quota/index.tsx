/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { Progress } from 'antd'
import React from 'react'

interface IProps {
    percent: number
}

const __DEV__ = import.meta.env.DEV

export function getPercent(size: number) {
    return new Promise<number>((resolve) => {
        if (__DEV__) {
            return resolve(size / (1024 ** 2 * 5) * 100 | 0)
        }
        const local = chrome.storage.local
        local.getBytesInUse(null, inUse => resolve(inUse / local.QUOTA_BYTES * 100 | 0))
    })
}

export default function Quota(props: IProps) {


    const color = React.useMemo(
        () => {
            return ['lime', 'green', 'blue', 'orange', 'red'][props.percent / 20 | 0]
        },
        [props.percent]
    )

    return (
        <Progress
            size='small'
            strokeWidth={2}
            showInfo={false}
            percent={props.percent}
            style={{
                lineHeight: 0,
                height: 0
            }}
            strokeColor={color}
        />
    )
}