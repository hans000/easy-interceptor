import { Collapse, Typography, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import JsonEditor from '../JsonEditor'
import './index.less'
import { SwapOutlined } from '@ant-design/icons';
import { equal } from '../../utils';
import RecordViewer from '../RecordViewer';
import { GeneralSchema, HeaderSchema } from './validator';

export interface TransformResult {
    url?: string
    enable?: boolean
    delay?: number
    method?: 'get' | 'post' | 'delete' | 'put' | '*'
    response?: any
    body?: any
    params?: Record<string, string>
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    id: string
}

export interface Result {
    general?: {
        url?: string
        method?: 'get' | 'post' | 'delete' | 'put' | '*',
        params?: Record<string, string>
    }
    response?: any
    body?: any
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
}

interface IProps {
    value: Result
    onChange?: (value: Result) => void
}

const defaultData: Result = {
    body: {},
    general: {},
    response: {},
    requestHeaders: {},
    responseHeaders: {},
}

export default function TransformerItem(props: IProps) {
    const [data, setData] = useState<Result>(defaultData)
    const [isPro, setPro] = useState(false)

    useEffect(
        () => {
            if (! equal(props.value, data)) {
                console.log(props.value);
                setData((value) => ({ ...defaultData, ...props.value, }))
            }
        },
        [props.value]
    )

    const getTitle = (title: string, val: Record<string, any> = {}) => {
        const count = Object.keys(val).length
        return !!count ? `${title} (${count})` : title
    }

    return (
        <Collapse className='ti' defaultActiveKey={['1']}>
            <Collapse.Panel header={getTitle('general', data.general)} key='1'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.general) }}></Typography.Paragraph>}>
                <RecordViewer validator={GeneralSchema} minRows={6} maxRows={15} value={data.general} onChange={general => {
                    setData(data => {
                        const result = { ...data, general }
                        props?.onChange?.(result)
                        return result
                    })
                }} />
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('request header', data.requestHeaders)} key='2'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.requestHeaders) }}></Typography.Paragraph>}>
                <RecordViewer validator={HeaderSchema} value={data.requestHeaders} onChange={requestHeader => {
                    setData(data => {
                        const result = { ...data, requestHeader }
                        props?.onChange?.(result)
                        return result
                    })
                }}/>
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('response header', data.responseHeaders)} key='3'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.responseHeaders) }}></Typography.Paragraph>}>
                <RecordViewer validator={HeaderSchema} value={data.responseHeaders} onChange={responseHeader => {
                    setData(data => {
                        const result = { ...data, responseHeader }
                        props?.onChange?.(result)
                        return result
                    })
                }}/>
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('body', data.body)} key='4'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.body) }}></Typography.Paragraph>}>
                <RecordViewer value={data.body} onChange={body => {
                    setData(data => {
                        const result = { ...data, body }
                        props?.onChange?.(result)
                        return result
                    })
                }}/>
            </Collapse.Panel>
            <Collapse.Panel header='response' key='5' extra={
                <div className='ti__icon-wrap'>
                    <Tooltip title='切换视图'>
                        <SwapOutlined style={{ color: '#1890ff', padding: '0 4px' }} onClick={(e) => {
                            e.stopPropagation()
                            setPro(isPro => !isPro)
                        }} />
                    </Tooltip>
                    <Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.response) }}></Typography.Paragraph>
                </div>
            }>
                {
                    isPro
                        ? (
                            <JsonEditor value={data.response} onChange={response => {
                                setData(value => {
                                    const result = { ...value, response }
                                    props?.onChange?.(result)
                                    return result
                                })
                            }}/>
                        )
                        : <RecordViewer minRows={6} maxRows={15} value={data.response}
                            onChange={response => {
                                setData(value => {
                                    const result = { ...value, response }
                                    props?.onChange?.(result)
                                    return result
                                })
                            }} />
                }
            </Collapse.Panel>
        </Collapse>
    )
}