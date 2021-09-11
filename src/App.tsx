import { Button, Dropdown, Input, Menu, message, Spin, Table, Tag, Tooltip, Upload } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import React, { useEffect, useRef, useState } from 'react'
import './App.less'
import TransformerItem, { Result, TransformResult } from './components/TransformerItem'
import { DeleteOutlined, PlusOutlined, CaretRightOutlined, SearchOutlined, DownOutlined, ArrowsAltOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined, UploadOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import minimatch from 'minimatch'
import { randID } from './utils'
import { getConfigText, getMethodColor } from './tools/mappings'
import { download } from './tools/download'

window.setting = {
    __hs_action: 'close',
    __hs_rules: [],
}

const __DEV__ = import.meta.env.DEV

function App() {

    const [data, setData] = useState<TransformResult[]>([])
    const [expandedRowKeys, setExpandedRowKeys] = useState([])
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [configText, setConfigText] = useState('关闭')
    const [loading, setLoading] = useState(false);

    useEffect(
        () => {
            if (! __DEV__) {
                chrome.storage.local.get(['__hs_action', '__hs_rules'], (result: any) => {
                    window.setting = { ...window.setting, ...result }
                    setData(window.setting.__hs_rules)
                    setConfigText(getConfigText(window.setting.__hs_action))
                })
            }
        },
        []
    )

    // 数据改变后通知background，并保存chrome.storage
    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, {
                    type: '__Hs_Transformer__',
                    to: 'background',
                    from: 'iframe',
                    key: 'rules',
                    value: data
                })
                if (chrome.storage) {
                    chrome.storage.local.set({ __hs_rules: data });
                }
            }
        },
        [data]
    )

    const columns = React.useMemo<ColumnsType<any>>(
        () => {
            return [
                {
                    title: '地址url', dataIndex: 'url', key: 'url', ellipsis: true,
                    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
                    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                        <div style={{ padding: 8 }}>
                            <Input placeholder='搜索关键字'
                                style={{ display: 'block', marginBottom: 8, width: 300 }}
                                onChange={e => {
                                    const v = e.target.value
                                    const [, k] = (selectedKeys[0] || '').toString().split('\n')
                                    setSelectedKeys([[v, k].join('\n')])
                                    confirm({ closeDropdown: false });
                                }} />
                            <Input placeholder='排除选项，glob规则'
                                style={{ display: 'block', width: 300 }}
                                onChange={e => {
                                    const v = e.target.value
                                    const [k] = (selectedKeys[0] || '').toString().split('\n')
                                    setSelectedKeys([[k, v].join('\n')])
                                    confirm({ closeDropdown: false });
                                }} />
                        </div>
                    ),
                    onFilter(value: string, record) {
                        const [k, e] = value.split('\n')
                        const include = record.url.includes(k)
                        const exclude = e ? e.split(',').some(el => minimatch(record.url, el)) : false
                        return record.url ? (include && !exclude) : true
                    },
                    render: (value: string) => {
                        const origin = window.location.origin
                        const shortText = value.startsWith(origin) ? '~' + value.slice(origin.length) : value
                        return (
                            <Tooltip placement="topLeft" title={value}>
                                <span>{shortText}</span>
                            </Tooltip>
                        )
                    }
                },
                {
                    title: '请求类型', dataIndex: 'method', key: 'method', width: 100, align: 'center' as any,
                    filters: [
                        { text: 'get', value: 'get' },
                        { text: 'post', value: 'post' },
                        { text: 'put', value: 'put' },
                        { text: 'delete', value: 'delete' },
                        { text: 'options', value: 'options' },
                    ],
                    onFilter: (value, record) => record.method.includes(value),
                    render: value => value !== '*' ? <Tag color={getMethodColor(value)}>{value}</Tag> : null
                },
                {
                    title: '启用拦截', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as any,
                    filters: [
                        { text: '启用', value: true },
                        { text: '停用', value: false },
                    ],
                    onFilter: (value, record) => record.enable === value,
                    render: (value, record, index) => <Checkbox checked={value} onChange={(e) => {
                        setData(data => {
                            const result = [...data]
                            result[index].enable = e.target.checked
                            return result
                        })
                    }}></Checkbox>
                },
            ]	
        },
        []
    )

    const update = (value: Result, index: number) => {
        setData(data => {
            const result = [...data]
            const obj = result[index]
            obj.url = value.general.url
            obj.method = value.general.method || '*'
            obj.requestHeaders = value.requestHeaders || {}
            obj.responseHeaders = value.responseHeaders || {}
            obj.response = value.response || {}
            obj.body = value.body || {}
            obj.params = value.general.params || {}
            return result
        })
    }

    const getActionText = React.useCallback(
        (type: string) => {
            const count = selectedRowKeys.length
            const total = data.length
            return count ? `${type}${count}项` : total ? `${type}所有，共${total}项` : ''
        },
        [selectedRowKeys.length, data.length]
    )

    return (
        <Spin spinning={loading}>
            <div className="app">
                <div className={'app__top'}>
                    <Button.Group style={{ paddingRight: 8 }}>
                        <Tooltip title={'添加'}>
                            <Button icon={<PlusOutlined />} onClick={() => {
                                setData(data => {
                                    const result = [...data, { url: window.location.origin + '/api-' + data.length, id: randID(), method: 'get' as any }]
                                    return result
                                })
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText('删除')}>
                            <Button icon={<DeleteOutlined />} onClick={() => {
                                if (! selectedRowKeys.length) {
                                    return setData([])
                                }
                                setData(data.filter(item => !selectedRowKeys.find(id => id === item.id)))
                                setSelectedRowKeys([])
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText('下载')}>
                            <Button icon={<VerticalAlignBottomOutlined />} onClick={() => {
                                const sel = selectedRowKeys.length ? data.filter(item => !selectedRowKeys.find(id => id === item.id)) : data
                                download(window.location.origin + '.json', JSON.stringify(sel, null, 2))
                                setSelectedRowKeys([])
                            }}></Button>
                        </Tooltip>
                        <Tooltip title='导入'>
                            <Upload showUploadList={false} beforeUpload={(file) => {
                                setLoading(true)
                                if (! ['application/json', 'text/plain'].includes(file.type)) {
                                    message.error('文件格式错误！仅支持txt, json')
                                    setLoading(false)
                                } else {
                                    file.text().then(text => {
                                        const obj = JSON.parse(text)
                                        console.log(obj);
                                    }).catch(() => {
                                        message.error('内容格式错误！')
                                    }).finally(() => {
                                        setLoading(false)
                                    })
                                }
                                return false
                            }}>
                                <Button icon={<UploadOutlined />}></Button>
                            </Upload>
                        </Tooltip>
                    </Button.Group>
                    <div>
                        <Dropdown trigger={['click']} overlay={
                            <Menu onClick={(info) => {
                                window.setting.__hs_action = info.key as ActionType
                                if (!__DEV__) {
                                    chrome.storage.local.set({ __hs_action: info.key })
                                    chrome.runtime.sendMessage(chrome.runtime.id, {
                                        type: '__Hs_Transformer__',
                                        to: 'background',
                                        from: 'iframe',
                                        key: 'action',
                                        value: info.key,
                                    })
                                }
                                setConfigText(getConfigText(info.key as ActionType))
                            }}>
                                <Menu.Item key='close'>
                                    <span>关闭</span>
                                </Menu.Item>
                                <Menu.Item key='watch'>
                                    <span>启用监听</span>
                                </Menu.Item>
                                <Menu.Item key='interceptor'>
                                    <span>启用拦截</span>
                                </Menu.Item>
                            </Menu>
                        }>
                            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                                <span>{configText}</span> <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </div>
                <div className="app__cont">
                    <Table
                        rowKey='id'
                        size='small'
                        pagination={false}
                        columns={columns}
                        scroll={{ y: 512 }}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => {
                                setSelectedRowKeys(keys)
                            },
                            // selections: [
                            // 	Table.SELECTION_ALL,
                            // 	Table.SELECTION_INVERT,
                            // 	Table.SELECTION_NONE,
                            // ],
                        }}
                        expandable={{
                            expandedRowKeys,
                            expandIcon: props => <CaretRightOutlined style={{ transition: '.35s ease', transform: `rotate(${props.expanded ? '90deg' : '0'})` }}
                                onClick={() => {
                                    setExpandedRowKeys(() => props.expanded ? [] : [props.record.id])
                                }}/>,
                            expandedRowRender: (record: TransformResult, index: number) => {
                                const value = {
                                    general: {
                                        url: record.url,
                                        method: record.method,
                                        params: record.params,
                                    },
                                    body: record.body,
                                    response: record.response,
                                    responseHeader: record.responseHeaders,
                                    requestHeader: record.requestHeaders,
                                }
                                return (
                                    <TransformerItem key={index} value={value} onChange={value => update(value, index)}/>
                                )
                            },
                        }}
                        dataSource={data}
                    />
                </div>
            </div>
        </Spin>
    )
}

export default App
