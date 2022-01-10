import './App.less'
import { Badge, BadgeProps, Button, Dropdown, Input, Menu, message, Modal, Spin, Table, Tag, Tooltip, Upload } from 'antd'
import Checkbox from 'antd/lib/checkbox/Checkbox'
import React, { useEffect, useRef, useState } from 'react'
import { FontSizeOutlined, TagOutlined, ControlOutlined, CodeOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, DownOutlined, VerticalAlignBottomOutlined, UploadOutlined, SyncOutlined, RollbackOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import minimatch from 'minimatch'
import { randID, renderSize } from './utils'
import { getConfigText, getMethodColor } from './tools/mappings'
import { download } from './tools/download'
import { buildStorageMsg } from './tools/message'
import jsonschema from 'json-schema'
import { TransformResultSchema } from './components/MainEditor/validator'
import getStorage from './tools/getStorage'
import useStorage from './hooks/useStorage'
import MainEditor from './components/MainEditor'
import { FileType } from './components/MainEditor/config'
import { sizeof } from './tools/sizeof'
import Quote from './components/Quote'
import { runCode } from './tools/runCode'

export interface TransformResult {
    id: string
    count: number
    url?: string
    enable?: boolean
    regexp?: boolean
    status?: number
    delay?: number
    method?: 'get' | 'post' | 'delete' | 'put' | ''
    response?: any
    body?: any
    // params?: Record<string, string>
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    code?: string
}

const __DEV__ = import.meta.env.DEV

function App() {
    const originRef = useRef('')
    const [dark, setDark] = useStorage('dark', false)
    const [action, setAction] = useStorage('action', 'close')
    const [rules, setRules] = useStorage<TransformResult[]>('rules', [])
    const [selectedRowKeys, setSelectedRowKeys] = useStorage('selectedRowKeys', [])
    const [loading, setLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useStorage('index', -1)
    const [invalid, setInvalid] = useState(false)
    const editorRef = useRef()

    useEffect(
        () => {
            reload()
            updateOrigin()
            watchRules()
        },
        []
    )

    const watchRules = () => {
        if (! __DEV__) {
            // @ts-ignore
            chrome.storage.local.onChanged.addListener((result) => {
                if (result.__hs_update__ !== undefined) {
                    reload()
                }
            })
        }
    }

    // 数据改变后通知background，并保存chrome.storage
    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, buildStorageMsg('rules', rules))
            }
        },
        [rules]
    )

    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, buildStorageMsg('action', action))
            }
        },
        [action]
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

    const reload = (clean = false) => {
        setLoading(true)
        getStorage([
            'action', 'rules', 'selectedRowKeys', 'dark',  'index',
        ]).then(result => {
            setLoading(false)
            setDark(result.dark)
            setAction(result.action)
            if (clean) {
                setSelectedRowKeys([])
                setRules(result.rules.map(item => ({ ...item, count: 0 })))
                setActiveIndex(-1)
            } else {
                setSelectedRowKeys(result.selectedRowKeys)
                setRules(result.rules)
                setActiveIndex(result.index)
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

    const size = React.useMemo(() => sizeof(rules), [rules])

    const columns = React.useMemo<ColumnsType<TransformResult>>(
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
                    render: (value, record, index) => {
                        const origin = originRef.current
                        const shortText = !!origin && value.startsWith(origin) ? '~' + value.slice(origin.length) : value
                        const status = record.code
                            ? 'default'
                            : (['lime', 'lime', 'success', 'success', 'warning', 'error'][(record.status || 200) / 100 | 0] || 'default') as BadgeProps['status']
                        return (
                            <Tooltip placement="topLeft" title={value}>
                                <Badge status={status} text={
                                    <span style={{ cursor: 'pointer' }} onClick={() => {
                                        setActiveIndex(index)
                                    }}>{shortText}</span>}></Badge>
                            </Tooltip>
                        )
                    }
                },
                {
                    dataIndex: 'count', key: 'count', width: 100, align: 'center',
                    title: '大小',
                    sorter: {
                        compare: (a, b) => sizeof(a) - sizeof(b),
                    },
                    render: (_, record) => {
                        // <-262.144kb 1MB 4MB 4MB->
                        //      18     20  22
                        const map = ['lime', 'green', 'orange', 'red']
                        const size = sizeof(record)
                        const r = Math.log2(size)
                        const index = r < 18 ? 0 : ((r - 18) / 2 + 1 | 0)
                        return <Badge status={index === 3 ? 'processing' : 'default'} color={map[index]} text={renderSize(size)} />
                    }
                },
                {
                    dataIndex: 'count', key: 'count', width: 100, align: 'center',
                    title: '拦截•次数',
                    render: (value, record) => (
                        <>
                            { !!record.code ? <CodeOutlined onClick={() => {
                                runCode(record.code, {
                                    status: record.status,
                                    response: record.response,
                                    delay: record.delay,
                                })
                            }} /> : null } 
                            <span style={{ paddingLeft: 4 }}>{ value ? value : null }</span>
                        </>
                    )
                },
                {
                    dataIndex: 'method', key: 'method', width: 50, align: 'center',
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
                    dataIndex: 'regexp', key: 'regexp', width: 50, align: 'center',
                    title: (
                        <Tooltip title='启用正则匹配'>
                            <FontSizeOutlined />
                        </Tooltip>
                    ),
                    render: (value, record, index) => <Checkbox checked={value} onChange={(e) => {
                        setRules(data => {
                            const result = [...data]
                            result[index].regexp = e.target.checked
                            return result
                        })
                    }}></Checkbox>
                },
                {
                    dataIndex: 'enable', key: 'enable', width: 50, align: 'center',
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
                        if (! value) {
                            setAction('intercept')
                        }
                        setRules(data => {
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

    const update = (value: Record<FileType, string>, index: number) => {
        setRules(data => {
            const result = [...data]
            const obj = result[index]

            const general = JSON.parse(value.general)
            const requestHeaders = JSON.parse(value.requestHeaders) || {}
            const responseHeaders = JSON.parse(value.responseHeaders) || {}
            const response = JSON.parse(value.response) || null
            const body = JSON.parse(value.body) || {}

            obj.url = general.url
            obj.regexp = general.regexp
            obj.delay = general.delay || 0
            obj.status = general.status || 200
            obj.method = general.method || ''
            obj.requestHeaders = requestHeaders
            obj.responseHeaders = responseHeaders
            obj.response = response || null
            obj.body = body
            obj.code = value.code || ''
            // obj.params = value.general.params || {}
            return result
        })
    }

    const getActionText = React.useCallback(
        (type: string) => {
            const count = selectedRowKeys.length
            const total = rules.length
            return count ? `${type}${count}项` : total ? `${type}所有，共${total}项` : ''
        },
        [selectedRowKeys.length, rules.length]
    )

    const back = () => {
        if (invalid) {
            (editorRef.current as any).sendMsg()
            return
        }
        setActiveIndex(-1)
    }

    const editable = React.useMemo(() => activeIndex !== -1, [activeIndex])

    const formatResult = (record: TransformResult) => {
        const { id, enable, regexp, count,
            body, requestHeaders, response, responseHeaders, code, ...general } = record
        return {
            body: JSON.stringify(body || {}, null, 4),
            general: JSON.stringify(general || {}, null, 4),
            response: JSON.stringify(response || null, null, 4),
            requestHeaders: JSON.stringify(requestHeaders || {}, null, 4),
            responseHeaders: JSON.stringify(responseHeaders || {}, null, 4),
            code,
        }
    }

    return (
        <Spin spinning={loading}>
            <div className="app">
                <div className={'app__top'}>
                    <Button.Group style={{ paddingRight: 8 }}>
                        <Tooltip title={'添加'}>
                            <Button disabled={editable} icon={<PlusOutlined />} onClick={() => {
                                setRules(data => {
                                    const result = [...data, { url: '/api-' + data.length, id: randID(), count: 0, method: 'get' as any }]
                                    return result
                                })
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText('删除')}>
                            <Button disabled={editable} icon={<DeleteOutlined />} onClick={() => {
                                if (! selectedRowKeys.length) {
                                    return setRules([])
                                }
                                setRules(rules.filter(item => !selectedRowKeys.find(id => id === item.id)))
                                setSelectedRowKeys([])
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText('下载')}>
                            <Button disabled={editable} icon={<VerticalAlignBottomOutlined />} onClick={() => {
                                const sel = selectedRowKeys.length ? rules.filter(item => !selectedRowKeys.find(id => id === item.id)) : rules
                                const origin = originRef.current || 'interceptor-data'
                                download(origin + '.json', JSON.stringify(sel, null, 2))
                                setSelectedRowKeys([])
                            }}></Button>
                        </Tooltip>
                        <Tooltip title='导入'>
                            <Upload disabled={editable} showUploadList={false} beforeUpload={(file) => {
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
                                                    setRules(arr.map(item => ({ ...item, count: 0 })))
                                                    close()
                                                }
                                            },
                                            okText: '追加',
                                            onOk: () => {
                                                let count = 0
                                                setRules((data) => {
                                                    return arr.reduce(
                                                        (acc, s) => {
                                                            if (acc.find(el => el.id === s.id)) {
                                                                count++
                                                            } else {
                                                                s.count = 0
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
                                <Button disabled={editable} icon={<UploadOutlined />}></Button>
                            </Upload>
                        </Tooltip>
                        <Tooltip title='刷新数据'>
                            <Button disabled={editable} icon={<SyncOutlined />} onClick={() => reload(true)}></Button>
                        </Tooltip>
                        <Tooltip title='切换主题'>
                            <Button icon={<span>{ dark ? '🌜' : '🌞'}</span>} onClick={() => {
                                setDark(dark => !dark)
                            }}></Button>
                        </Tooltip>
                        {
                            editable && (
                                <Tooltip title='返回'>
                                    <Button icon={<RollbackOutlined />} onClick={back}></Button>
                                </Tooltip>
                            )
                        }
                    </Button.Group>
                    <div>
                        <Dropdown trigger={['click']} overlay={
                            <Menu activeKey={action} onClick={(info) => {
                                setAction(info.key)
                            }}>
                                <Menu.Item key='close'>
                                    <Badge status='default' text='关闭'></Badge>
                                </Menu.Item>
                                <Menu.Item key='watch'>
                                    <Badge color={'orange'} status='default' text='启用监听'></Badge>
                                </Menu.Item>
                                <Menu.Item key='intercept'>
                                    <Badge color={'purple'} status='default' text='启用拦截'></Badge>
                                </Menu.Item>
                            </Menu>
                        }>
                            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                                <span>{getConfigText(action as ActionType)}</span> <DownOutlined />
                            </a>
                        </Dropdown>
                    </div>
                </div>
                <div className='app__quote'>
                    <Quote size={size}/>
                </div>
                <div className="app__cont">
                    <Table
                        rowKey='id'
                        size='small'
                        pagination={false}
                        columns={columns}
                        scroll={{ y: 512 }}
                        dataSource={rules}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => {
                                setSelectedRowKeys(keys)
                            },
                        }}
                    />
                </div>
                {
                    editable && (
                        <div className='app__editor'>
                            <MainEditor ref={editorRef} value={formatResult(rules[activeIndex])} onChange={(value, invalid) => {
                                update(value, activeIndex)
                                setInvalid(invalid)
                            }} />
                        </div>
                    )
                }
            </div>
        </Spin>
    )
}

export default App
