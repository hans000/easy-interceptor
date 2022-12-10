/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import './App.less'
import { Badge, Checkbox, BadgeProps, Button, Dropdown, Input, message, Modal, Spin, Table, Tag, Tooltip, Upload } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { TagOutlined, ControlOutlined, CodeOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, DownOutlined, VerticalAlignBottomOutlined, UploadOutlined, SyncOutlined, RollbackOutlined, BugOutlined, FilterOutlined, MenuOutlined, UnorderedListOutlined, EllipsisOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import { pathMatch, randID, renderSize } from './utils'
import { getMethodColor } from './tools/mappings'
import { download, sizeof } from './tools'
import { createStorageAction } from './tools/message'
import jsonschema from 'json-schema'
import { ConfigSchema, TransformResultSchema } from './components/MainEditor/validator'
import getStorage from './tools/getStorage'
import useStorage from './hooks/useStorage'
import MainEditor from './components/MainEditor'
import { FileType } from './components/MainEditor/config'
import Quote from './components/Quote'
import { runCode } from './tools/runCode'
import { loader } from "@monaco-editor/react";
import { sendRequestLog } from './tools/sendRequest'
import { ActionFieldKey, DarkFieldKey, FakedFieldKey, HiddenFieldsFieldKey, IndexFieldKey, RulesFieldKey, SelectedRowFieldKeys, UpdateMsgKey } from './tools/constants'
import useTranslate from './hooks/useTranslate'

export interface MatchRule {
    id: string
    count: number
    delay?: number
    enable?: boolean
    url?: string
    description?: string
    test: string
    type?: 'xhr' | 'fetch'
    method?: 'get' | 'post' | 'delete' | 'put' | 'patch'
    body?: any
    params?: [string, string][]
    requestHeaders?: Record<string, string>
    status?: number
    response?: any
    responseText?: string
    responseHeaders?: Record<string, string>
    code?: string
    redirectUrl?: string
}

const __DEV__ = import.meta.env.DEV

if (! process.env.VITE_LOCAL) {
    loader.config({
        paths: {
            vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs'
        },
    })
}

const fields = ['url', 'redirectUrl', 'test', 'type', 'method', 'status', 'delay', 'params', 'requestHeaders', 'responseHeaders', 'body', 'response', 'responseText', 'description']

const isDrakTheme = window.matchMedia("(prefers-color-scheme: dark)").matches

function App() {
    const originRef = useRef('')
    const [dark, setDark] = useStorage(DarkFieldKey, isDrakTheme)
    const [action, setAction] = useStorage(ActionFieldKey, 'close')
    const [faked, setFaked] = useStorage(FakedFieldKey, false)
    const [rules, setRules] = useStorage<MatchRule[]>(RulesFieldKey, [])
    const [selectedRowKeys, setSelectedRowKeys] = useStorage(SelectedRowFieldKeys, [])
    const [loading, setLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useStorage(IndexFieldKey, -1)
    const [invalid, setInvalid] = useState(false)
    const [visible, setVisible] = useState(false)
    const [hiddenFields, setHiddenFields] = useStorage(HiddenFieldsFieldKey, [])
    const editorRef = useRef()
    const t = useTranslate()

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
                if (result[UpdateMsgKey] !== undefined) {
                    reload()
                }
            })
        }
    }

    // 数据改变后通知background，并保存chrome.storage
    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, createStorageAction('rules', rules.filter(e => e.enable)))
            }
        },
        [rules]
    )

    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, createStorageAction('faked', faked))
            }
        },
        [faked]
    )

    useEffect(
        () => {
            if (! __DEV__) {
                chrome.runtime.sendMessage(chrome.runtime.id, createStorageAction('action', action))
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
            ActionFieldKey, RulesFieldKey, SelectedRowFieldKeys, DarkFieldKey,  IndexFieldKey, HiddenFieldsFieldKey, FakedFieldKey
        ]).then(result => {
            setLoading(false)
            setDark(result[DarkFieldKey])
            setFaked(result[FakedFieldKey])
            setAction(result[ActionFieldKey])
            setHiddenFields(result[HiddenFieldsFieldKey])
            if (clean) {
                setSelectedRowKeys([])
                setRules(result[RulesFieldKey].map(item => ({ ...item, count: 0 })))
                setActiveIndex(-1)
            } else {
                setSelectedRowKeys(result[SelectedRowFieldKeys])
                setRules(result[RulesFieldKey])
                setActiveIndex(result[IndexFieldKey])
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

    const columns = React.useMemo<ColumnsType<MatchRule>>(
        () => {
            return [
                {
                    title: (
                        <Dropdown open={visible} onOpenChange={setVisible} menu={{ items: fields.map(field => {
                            const disabled = (ConfigSchema.properties[field] as any).required
                            return {
                                key: field,
                                label: (
                                    <Checkbox disabled={disabled} key={field} defaultChecked={!hiddenFields.includes(field)} onChange={(e) => {
                                        const checked = e.target.checked
                                        setHiddenFields(fields => {
                                            if (checked) {
                                                return fields.filter(item => item !== field)
                                            } else {
                                                return [...fields, field]
                                            }
                                        })
                                    }}>{field}</Checkbox>
                                ),
                            }
                        })}}>
                            <span>
                                <span>{t('row_rule')}</span>
                                <FilterOutlined style={{ marginLeft: 8, padding: 4, color: '#bfbfbf' }} />
                            </span>
                        </Dropdown>
                    ),
                    dataIndex: 'test', key: 'test', ellipsis: true,
                    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
                    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                        <div style={{ padding: 8 }}>
                            <Input placeholder={t('keyword')}
                                style={{ display: 'block', marginBottom: 8, width: 300 }}
                                onChange={e => {
                                    const v = e.target.value
                                    const [, k] = (selectedKeys[0] || '').toString().split('\n')
                                    setSelectedKeys([[v, k].join('\n')])
                                    confirm({ closeDropdown: false });
                                }} />
                            <Input placeholder={t('exclude')}
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
                        const include = record.test.includes(k) || record.description?.includes(k)
                        const exclude = e ? e.split(',').some(pattern => pathMatch(pattern, record.test)) : false
                        return value ? (include && !exclude) : true
                    },
                    render: (value, record, index) => {
                        const status = record.code
                            ? 'default'
                            : (['lime', 'lime', 'success', 'success', 'warning', 'error'][(record.status || 200) / 100 | 0] || 'default') as BadgeProps['status']
                        return (
                            <Dropdown trigger={['contextMenu']} menu={{ items: [
                                {
                                    label: t('menu_copy'),
                                    key: 'copy',
                                    onClick: () => {
                                        setRules(r => {
                                            const rules = [...r]
                                            const rule = { ...rules[index], id: randID(), count: 0, enable: false }
                                            rule.description = t('refresh') + (rule.description || '')
                                            rules.splice(index + 1, 0, rule)
                                            return rules
                                        })
                                    }
                                },
                                {
                                    label: t('menu_remove'),
                                    key: 'remove',
                                    onClick() {
                                        setRules(r => {
                                            const rules = [...r]
                                            rules.splice(index, 1)
                                            return rules
                                        })
                                    }
                                },
                                {
                                    label: t('menu_refresh'),
                                    key: 'fresh',
                                    onClick() {
                                        setRules(r => {
                                            const rules = [...r]
                                            rules[index].count = 0
                                            return rules
                                        })
                                    }
                                },
                            ]}}>
                                <Badge status={status} text={
                                    <>
                                        <a title={value} onClick={() => {
                                            setActiveIndex(index)
                                        }}>{value}</a>
                                        <span title={record.description} className='row__desc'>{record.description}</span>
                                    </>
                                }></Badge>
                            </Dropdown>
                        )
                    }
                },
                {
                    dataIndex: 'type', key: 'type', width: 100, align: 'center',
                    title: t('row_type'),
                    render: (type) => type || 'xhr / fetch'
                },
                {
                    dataIndex: 'count', key: 'count', width: 100, align: 'center',
                    title: t('row_size'),
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
                    dataIndex: 'count', key: 'count', width: 80, align: 'center',
                    title: <Tooltip title={t('tip_debug_count')}><BugOutlined /></Tooltip>,
                    render: (value, record, index) => (
                        <>
                            { !!record.code ? <CodeOutlined onClick={() => {
                                runCode(record, index)
                            }} /> : null } 
                            <span style={{ paddingLeft: 4 }}>{ value ? value : null }</span>
                        </>
                    )
                },
                {
                    dataIndex: 'method', key: 'method', width: 60, align: 'center',
                    title: (
                        <Tooltip title={t('tip_tag')}>
                            <TagOutlined />
                        </Tooltip>
                    ),
                    render: (value = 'get', record, index) => {
                        if (! value) {
                            return null
                        }
                        const canSend = record.url !== undefined

                        return (
                            <Tag title={ canSend ? t('tip_send') : '' } style={{ cursor: canSend ? 'pointer' : 'text', borderStyle: canSend ? 'solid' : 'dashed' }} color={getMethodColor(value)} onClick={() => {
                                if (canSend) {
                                    sendRequestLog(record, index)
                                }
                            }}>{value}</Tag>
                        )
                    }
                },
                {
                    dataIndex: 'enable', key: 'enable', width: 40, align: 'center',
                    title: (
                        <Tooltip title={t('intercept')}>
                            <ControlOutlined onClick={() => {
                                setRules(rules => {
                                    const allChecked = rules.every(rule => rule.enable)
                                    return rules.map(rule => {
                                        return { ...rule, enable: !allChecked }
                                    })
                                })
                            }} />
                        </Tooltip>
                    ),
                    render: (value, record, index) => (
                        <Checkbox checked={value} onChange={(e) => {
                            if (! value) {
                                setAction('intercept')
                            }
                            setRules(data => {
                                const result = [...data]
                                result[index].enable = e.target.checked
                                return result
                            })
                        }}></Checkbox>
                    )
                },
            ]	
        },
        [setRules]
    )

    const update = (value: Record<FileType, string>, index: number) => {
        setRules(rule => {
            const result = [...rule]
            const config = JSON.parse(value.config)
            result[index] = {
                ...Object.keys(result[index]).reduce((acc, k) => {
                    if (! fields.includes(k)) {
                        acc[k] = result[index][k]
                    }
                    return acc
                }, {}),
                ...config,
                code: value.code
            }
            return result
        })
    }

    const getActionText = React.useCallback(
        (type: string) => {
            const count = selectedRowKeys.length
            const total = rules.length
            return count ? `${type}${count}${t('items')}` : total ? `${type}${t('total', [total])}` : ''
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

    const formatResult = (record: MatchRule) => {
        const { code, } = record
        const data = fields.filter(field => !hiddenFields.includes(field)).reduce((acc, k) => (acc[k] = record[k], acc), {})
        return {
            code,
            config: JSON.stringify(data, null, 4)
        }
    }

    return (
        <Spin spinning={loading}>
            <div className="app">
                <div className={'app__top'}>
                    <Button.Group style={{ paddingRight: 8 }}>
                        <Tooltip title={t('action_add')}>
                            <Button disabled={editable} icon={<PlusOutlined />} onClick={() => {
                                setRules(rule => {
                                    const result = [...rule, {
                                        id: randID(),
                                        count: 0,
                                        test: '/api-' + rule.length,
                                        response: {
                                            foo: 'xxx'
                                        },
                                    }]
                                    return result
                                })
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText(t('menu_remove'))}>
                            <Button disabled={editable} icon={<DeleteOutlined />} onClick={() => {
                                if (! selectedRowKeys.length) {
                                    return setRules([])
                                }
                                setRules(rules.filter(item => !selectedRowKeys.find(id => id === item.id)))
                                setSelectedRowKeys([])
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={getActionText(t('action_export'))}>
                            <Button disabled={editable} icon={<VerticalAlignBottomOutlined />} onClick={() => {
                                const sel = selectedRowKeys.length ? rules.filter(item => !selectedRowKeys.find(id => id === item.id)) : rules
                                const origin = originRef.current || 'data'
                                download(origin + '.json', JSON.stringify(sel, null, 2))
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={t('action_import')}>
                            <Upload disabled={editable} showUploadList={false} beforeUpload={(file) => {
                                setLoading(true)
                                if (! ['application/json', 'text/plain'].includes(file.type)) {
                                    message.error(t('import_modal_err'))
                                    setLoading(false)
                                } else {
                                    file.text().then(text => {
                                        const arr = JSON.parse(text) as MatchRule[]
                                        const result = jsonschema.validate(arr, TransformResultSchema)
                                        if (! result.valid) {
                                            throw result.errors
                                        }
                                        if (! rules.length) {
                                            setRules(arr.map(item => ({ ...item, count: 0 })))
                                            return
                                        }
                                        Modal.confirm({
                                            title: t('import_modal_title'),
                                            content: t('import_modal_content'),
                                            cancelText: t('import_modal_override'),
                                            closable: true,
                                            onCancel: (close) => {
                                                if (typeof close === 'function') {
                                                    setRules(arr.map(item => ({ ...item, count: 0 })))
                                                    close()
                                                }
                                            },
                                            okText: t('import_modal_append'),
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
                                                    message.warn(t('import_modal_filter', [count]))
                                                }
                                            },
                                        })
                                    }).catch((err: jsonschema.ValidationError[] | string) => {
                                        const msg = Array.isArray(err) ? `${err[0].property} ${err[0].message}` : err
                                        message.error(msg)
                                    }).finally(() => {
                                        setLoading(false)
                                    })
                                }
                                return false
                            }}>
                                <Button disabled={editable} icon={<UploadOutlined />}></Button>
                            </Upload>
                        </Tooltip>
                        <Tooltip title={t('action_refresh')}>
                            <Button disabled={editable} icon={<SyncOutlined />} onClick={() => reload(true)}></Button>
                        </Tooltip>
                        <Tooltip title={t('action_theme')}>
                            <Button icon={<span>{ dark ? '🌜' : '🌞'}</span>} onClick={() => {
                                setDark(dark => !dark)
                            }}></Button>
                        </Tooltip>
                        <Tooltip title={t('action_mode')}>
                            <Button type={ faked ? 'primary' : 'default' } icon={<BugOutlined />} onClick={() => {
                                setFaked(faked => !faked)
                            }}></Button>
                        </Tooltip>
                        {
                            editable && (
                                <Tooltip title={t('action_back')}>
                                    <Button icon={<RollbackOutlined />} onClick={back}></Button>
                                </Tooltip>
                            )
                        }
                    </Button.Group>
                    <div>
                        <Dropdown menu={{
                            activeKey: action,
                            onClick: info => {
                                setAction(info.key)
                                if (info.key === 'intercept' && activeIndex !== -1) {
                                    setRules(rules => {
                                        const newRules = [...rules]
                                        newRules[activeIndex].enable = true
                                        return newRules
                                    })
                                }
                            },
                            items: [
                            {
                                label: <Badge status='default' text={t('close')}></Badge>,
                                key: 'close',
                            },
                            {
                                label: <Badge color={'orange'} status='default' text={t('watch')}></Badge>,
                                key: 'watch',
                            },
                            {
                                label: <Badge color={'purple'} status='default' text={t('intercept')}></Badge>,
                                key: 'intercept',
                            }
                        ]}}>
                            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                                <span>{t(action)}</span> <DownOutlined />
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
                            <MainEditor
                                ref={editorRef}
                                index={activeIndex}
                                rule={rules[activeIndex]}
                                value={formatResult(rules[activeIndex])}
                                onChange={(value, invalid) => {
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
