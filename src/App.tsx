import './App.less'
import { Button, Dropdown, Input, Menu, message, Modal, Spin, Table, Tag, Tooltip, Upload } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import React, { useEffect, useRef, useState } from 'react'
import TransformerItem, { Result, TransformResult } from './components/TransformerItem'
import { FontSizeOutlined, TagOutlined, ControlOutlined, DeleteOutlined, PlusOutlined, CaretRightOutlined, SearchOutlined, DownOutlined, VerticalAlignBottomOutlined, UploadOutlined, SyncOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import minimatch from 'minimatch'
import { randID } from './utils'
import { getConfigText, getMethodColor } from './tools/mappings'
import { download } from './tools/download'
import { buildStorageMsg } from './tools/message'
import jsonschema from 'json-schema'
import { TransformResultSchema } from './components/TransformerItem/validator'
import getStorage from './tools/getStorage'
import useStorage from './hooks/useStorage'
import { useDebounce } from './hooks/useDebounce'

const __DEV__ = import.meta.env.DEV

function App() {
    const [dark, setDark] = useStorage('dark', false)
    const [action, setAction] = useStorage('action', 'close')
    const [data, setData] = useStorage<TransformResult[]>('rules', [])
    const [expandedRowKeys, setExpandedRowKeys] = useStorage('expandedRowKeys', [])
    const [selectedRowKeys, setSelectedRowKeys] = useStorage('selectedRowKeys', [])
    const [scrollTop, setScrollTop] = useStorage('scrollTop', 0)
    const [loading, setLoading] = useState(false)
    const originRef = useRef('')

    useEffect(
        () => {
            reload()
            updateOrigin()
        },
        []
    )

    // 数据改变后通知background，并保存chrome.storage
    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, buildStorageMsg('rules', data))
            }
        },
        [data]
    )

    useEffect(
        () => {
            const html = document.querySelector('html')
            const cls = 'theme--dark'
            if (dark && !html.classList.contains(cls)) {
                html.classList.add(cls)
            } else {
                html.classList.remove(cls)
            }
        },
        [dark]
    )

    const handle = useDebounce((event: any) => {
        setScrollTop(event.target.scrollTop)
    })

    useEffect(
        () => {
            const container = document.querySelector('.ant-table-body')
            container.addEventListener('scroll', handle)
            getStorage(['scrollTop']).then(result => {
                setTimeout(() => {
                    container.scrollTo({
                        top: result.scrollTop,
                        behavior: 'smooth',
                    })
                }, 500)
            })
        },
        []
    )

    const reload = (clean = false) => {
        setLoading(true)
        getStorage([
            'action', 'rules', 'selectedRowKeys', 'expandedRowKeys', 'dark',
        ]).then(result => {
            setLoading(false)
            setDark(result.dark)
            setAction(result.action)
            if (clean) {
                setSelectedRowKeys([])
                setExpandedRowKeys([])
                setData(result.rules.map(item => ({ ...item, count: 0 })))
            } else {
                setSelectedRowKeys(result.selectedRowKeys)
                setExpandedRowKeys(result.expandedRowKeys)
                setData(result.rules)
            }
        })
    }

    const updateOrigin = () => {
        if (! __DEV__) {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                try {
                    const [, a, b] = tabs[0].url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
                    const origin = a + b
                    originRef.current = origin
                } catch (error) {}
            })
        }
    }

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
                        const origin = originRef.current
                        const shortText = !!origin && value.startsWith(origin) ? '~' + value.slice(origin.length) : value
                        return (
                            <Tooltip placement="topLeft" title={value}>
                                <span>{shortText}</span>
                            </Tooltip>
                        )
                    }
                },
                {
                    dataIndex: 'count', key: 'count', width: 100, align: 'center' as any,
                    title: '拦截次数',
                    render: value => value ? value : null
                },
                {
                    dataIndex: 'method', key: 'method', width: 50, align: 'center' as any,
                    // filters: [
                    //     { text: 'get', value: 'get' },
                    //     { text: 'post', value: 'post' },
                    //     { text: 'put', value: 'put' },
                    //     { text: 'delete', value: 'delete' },
                    // ],
                    // onFilter: (value, record) => record.method.includes(value),
                    title: (
                        <Tooltip title='请求类型'>
                            <TagOutlined />
                        </Tooltip>
                    ),
                    render: value => value !== '*' ? <Tag color={getMethodColor(value)}>{value}</Tag> : null
                },
                {
                    dataIndex: 'regexp', key: 'regexp', width: 50, align: 'center' as any,
                    title: (
                        <Tooltip title='启用正则匹配'>
                            <FontSizeOutlined />
                        </Tooltip>
                    ),
                    render: (value, record, index) => <Checkbox checked={value} onChange={(e) => {
                        setData(data => {
                            const result = [...data]
                            result[index].regexp = e.target.checked
                            return result
                        })
                    }}></Checkbox>
                },
                {
                    dataIndex: 'enable', key: 'enable', width: 50, align: 'center' as any,
                    // filters: [
                    //     { text: '启用', value: true },
                    //     { text: '停用', value: false },
                    // ],
                    // onFilter: (value, record) => record.enable === value,
                    title: (
                        <Tooltip title='启用拦截'>
                            <ControlOutlined />
                        </Tooltip>
                    ),
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
            obj.regexp = value.general.regexp
            obj.delay = value.general.delay
            obj.method = value.general.method || ''
            obj.requestHeaders = value.requestHeaders || {}
            obj.responseHeaders = value.responseHeaders || {}
            obj.response = value.response || {}
            obj.body = value.body || {}
            // obj.params = value.general.params || {}
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
                                    const result = [...data, { url: '/api-' + data.length, id: randID(), count: 0, method: 'get' as any }]
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
                                const origin = originRef.current || 'interceptor-data'
                                download(origin + '.json', JSON.stringify(sel, null, 2))
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
                                        const arr = JSON.parse(text) as TransformResult[]
                                        const result = jsonschema.validate(arr, TransformResultSchema)
                                        if (! result.valid) {
                                            throw new Error()
                                        }
                                        Modal.confirm({
                                            title: '导入说明',
                                            content: '请选择覆盖数据还是追加数据',
                                            cancelText: '覆盖',
                                            closable: true,
                                            onCancel: (close) => {
                                                if (typeof close === 'function') {
                                                    setData(arr)
                                                    close()
                                                }
                                            },
                                            okText: '追加',
                                            onOk: () => {
                                                let count = 0
                                                setData((data) => {
                                                    return arr.reduce(
                                                        (acc, s) => {
                                                            if (acc.find(el => el.id === s.id)) {
                                                                count++
                                                            } else {
                                                                acc.push(s)
                                                            }
                                                            return acc
                                                        },
                                                        [...data]
                                                    )
                                                })
                                                if (count) {
                                                    message.warn(`重复${count}条数据，已过滤`)
                                                }
                                            },
                                        })
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
                        <Tooltip title='刷新数据'>
                            <Button icon={<SyncOutlined />} onClick={() => reload(true)}></Button>
                        </Tooltip>
                        <Tooltip title='切换主题'>
                            <Button icon={<span>{ dark ? '🌑' : '🌞'}</span>} onClick={() => {
                                setDark(dark => !dark)
                            }}></Button>
                        </Tooltip>
                    </Button.Group>
                    <div>
                        <Dropdown trigger={['click']} overlay={
                            <Menu activeKey={action} onClick={(info) => {
                                if (! __DEV__) {
                                    chrome.runtime.sendMessage(chrome.runtime.id, buildStorageMsg('action', info.key))
                                }
                                setAction(info.key)
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
                                <span>{getConfigText(action as ActionType)}</span> <DownOutlined />
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
                        }}
                        defaultExpandedRowKeys={expandedRowKeys}
                        expandable={{
                            expandedRowKeys,
                            expandIcon: props => (
                                <span style={{ padding: 8 }} onClick={() => {
                                    setExpandedRowKeys(() => props.expanded ? [] : [props.record.id]) }}>
                                    <CaretRightOutlined style={{ transition: '.35s ease', transform: `rotate(${props.expanded ? '90deg' : '0'})` }}/>
                                </span>
                            ),
                            expandedRowRender: (record: TransformResult, index: number) => {
                                const { id, enable, regexp,
                                    body, requestHeaders, response, responseHeaders, ...general } = record
                                const value = {
                                    body,
                                    general,
                                    response,
                                    requestHeaders,
                                    responseHeaders,
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
