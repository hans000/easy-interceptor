import { Collapse, Typography, Tooltip, message } from 'antd'
import React, { useEffect, useState } from 'react'
import JsonEditor from '../JsonEditor'
import './index.less'
import { CodeOutlined, SwapOutlined } from '@ant-design/icons';
import { equal } from '../../utils';
import RecordViewer from '../RecordViewer';
import { GeneralSchema, HeaderSchema } from './validator';
import useStorage from '../../hooks/useStorage';
import getStorage from '../../tools/getStorage';
import TextArea from 'antd/lib/input/TextArea'

export interface TransformResult {
    id: string
    count: number
    url?: string
    enable?: boolean
    regexp?: boolean
    delay?: number
    method?: 'get' | 'post' | 'delete' | 'put' | ''
    response?: any
    body?: any
    // params?: Record<string, string>
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    code?: string
}

export interface Result {
    general?: {
        url?: string
        delay?: number
        regexp?: boolean
        method?: 'get' | 'post' | 'delete' | 'put' | '',
        // params?: Record<string, string>
    }
    response?: any
    body?: any
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    code?: string
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
    code: '',
}

export default function TransformerItem(props: IProps) {
    const [data, setData] = useState<Result>(defaultData)
    const [isPro, setPro] = useState(false)
    const [activeKey, setActiveKey] = useStorage('activeKey', [])

    useEffect(
        () => {
            if (! equal(props.value, data)) {
                setData((value) => ({ ...defaultData, ...props.value, }))
            }
        },
        [props.value]
    )

    useEffect(
        () => {
            getStorage(['activeKey']).then(result => {
                setActiveKey(result.activeKey)
            })
        },
        []
    )

    const getTitle = (title: string, val: Record<string, any> = {}) => {
        const count = Object.keys(val).length
        return !!count ? `${title} (${count})` : title
    }

    return (
        <Collapse className='ti' defaultActiveKey={activeKey} activeKey={activeKey} onChange={ keys => setActiveKey(keys as string[])}>
            <Collapse.Panel header={'general'} key='1'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.general, null, 2) }}></Typography.Paragraph>}>
                <RecordViewer validator={GeneralSchema} minRows={6} maxRows={15} value={data.general} onChange={general => {
                    setData(data => {
                        const result = { ...data, general }
                        props?.onChange?.(result)
                        return result
                    })
                }} />
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('request header', data.requestHeaders)} key='2'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.requestHeaders, null, 2) }}></Typography.Paragraph>}>
                <RecordViewer readonly validator={HeaderSchema} value={data.requestHeaders} onChange={requestHeader => {
                    setData(data => {
                        const result = { ...data, requestHeader }
                        props?.onChange?.(result)
                        return result
                    })
                }}/>
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('response header', data.responseHeaders)} key='3'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.responseHeaders, null, 2) }}></Typography.Paragraph>}>
                <RecordViewer readonly validator={HeaderSchema} value={data.responseHeaders} onChange={responseHeader => {
                    setData(data => {
                        const result = { ...data, responseHeader }
                        props?.onChange?.(result)
                        return result
                    })
                }}/>
            </Collapse.Panel>
            <Collapse.Panel header={getTitle('body', data.body)} key='4'
                extra={<Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.body, null, 2) }}></Typography.Paragraph>}>
                <RecordViewer readonly value={data.body} onChange={body => {
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
                    <Typography.Paragraph onClick={e => e.stopPropagation()} copyable={{ text: JSON.stringify(data.response, null, 2) }}></Typography.Paragraph>
                </div>
            }>
                {
                    isPro
                        ? <JsonEditor value={data.response} onChange={response => {
                            setData(value => {
                                const result = { ...value, response }
                                props?.onChange?.(result)
                                return result
                            })
                        }}/>
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
            <Collapse.Panel header='code' key='6' extra={
                <CodeOutlined style={{ color: '#1890ff' }} onClick={e => {
                    e.stopPropagation()
                    if (data.code) {
                        try {
                            console.log(eval(`;(${data.code})(${JSON.stringify(data.response)})`))
                        } catch (error) {
                            console.error(error)
                        }
                    }
                }}/>
            }>
                <TextArea value={data.code} onChange={code => {
                    console.log(code.target.value);
                    
                    setData(data => {
                        const result = { ...data, code: code.target.value }
                        props?.onChange?.(result)
                        return result
                    })
                }} />
            </Collapse.Panel>
        </Collapse>
    )
}