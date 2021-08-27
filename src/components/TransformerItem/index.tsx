import { Input, Checkbox } from 'antd'
import React, { useEffect, useState } from 'react'
import JsonEditor from '../JsonEditor'
import './index.less'
import { DownOutlined, } from '@ant-design/icons';
import { equal } from '../../utils';

export interface TransformResult {
    type?: boolean
    enable?: boolean
    text?: string
    data?: any
}

interface IProps {
    value: TransformResult
    onChange?: (value: TransformResult) => void
    collapsed?: boolean
}

const defaultData: TransformResult = {
    type: false,
    enable: true,
    text: '',
    data: {},
}

enum ColorKind {
    Enable = '#56d7e3',
    Disable = '#3b969e',
    Error = '#9e563b'
}

export default function TransformerItem(props: IProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [color, setColor] = useState('#56d7e3')
    const [data, setData] = useState<TransformResult>(defaultData)
    const [error, setError] = useState(false)

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
            setCollapsed(() => props.collapsed)
        },
        [props.collapsed]
    )

    useEffect(
        () => {
            setColor(() => error ? ColorKind.Error : data.enable ? ColorKind.Enable : ColorKind.Disable)
        },
        [data.enable, error]
    )

    useEffect(
        () => {
            if (! equal(data, props.value)) {
                props?.onChange?.(data)
            }
        },
        [data]
    )

    return (
        <div className='ti' style={{ backgroundColor: color }}>
            <div className='ti__header'>
                {/* <div className="ti__arrow">
                    <DownOutlined rotate={collapsed ? 0 : 180} onClick={() => setCollapsed(collapsed => !collapsed)} />
                </div> */}
                <div className="ti__ctrl">
                    <Checkbox onChange={e => {
                        setData(value => ({ ...value, enable: e.target.checked }))
                    }} checked={data.enable}>是否启用</Checkbox>
                    <Checkbox onChange={e => {
                        setData(value => ({ ...value, type: e.target.checked }))
                    }} checked={data.type}>正则匹配</Checkbox>
                    <Checkbox onChange={e => {
                        setData(value => ({ ...value, type: e.target.checked }))
                    }} checked={data.type}>错误</Checkbox>
                </div>
                <div className="ti__text">
                    <Input onKeyDown={e => {
                        if (e.key === 'Tab') {
                            setCollapsed(() => false)
                        }
                    }} onChange={e => {
                        setData(value => ({ ...value, text: e.target.value }))
                    }} maxLength={999} placeholder='请输入要匹配的接口' value={data.text}/>
                </div>
            </div>
            {
                !collapsed && (
                    <div className='ti__code'>
                        <JsonEditor onChange={(data) => {
                            setError(() => error)
                            setData(value => ({ ...value, data }))
                        }} value={data.data}/>
                    </div>
                )
            }
        </div>
    )
}