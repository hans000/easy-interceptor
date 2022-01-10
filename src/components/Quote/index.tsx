import { Progress } from 'antd'
import React, { useEffect, useState } from 'react'
import './index.less'

interface IProps {
    size: number
}

const __DEV__ = import.meta.env.DEV

function getPercent() {
    return new Promise<number>((resolve) => {
        if (__DEV__) {
            const used = Object.entries(localStorage).map(kv => kv.join('')).join('').length
            return resolve(used / 1024 ** 2 * 5 * 100 | 0)
        }
        const local = chrome.storage.local
        local.getBytesInUse(null, inUse => resolve(inUse / local.QUOTA_BYTES * 100 | 0))
    })
}

export default function Quote(props: IProps) {
    const [percent, setPercent] = useState(0)

    useEffect(
        () => {
            getPercent().then(setPercent)
        },
        [props.size]
    )

    const color = React.useMemo(
        () => {
            return ['lime', 'green', 'blue', 'orange', 'red'][percent / 20 | 0]
        },
        [percent]
    )

    return (
        <Progress
            size='small'
            strokeWidth={2}
            showInfo={false}
            percent={percent}
            style={{
                lineHeight: 0,
                height: 0
            }}
            strokeColor={color}
        />
    )
}