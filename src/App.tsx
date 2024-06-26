/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import './App.less'
import { Badge, Checkbox, BadgeProps, Button, Dropdown, Input, message, Modal, Spin, Table, Tag, Tooltip, Upload, Switch, Space, Divider, Select, Popover, Segmented, InputNumber } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { TagOutlined, ControlOutlined, CodeOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, VerticalAlignBottomOutlined, UploadOutlined, SyncOutlined, RollbackOutlined, BugOutlined, FilterOutlined, FormOutlined, SettingOutlined, AppstoreOutlined, FieldTimeOutlined, StopOutlined, DashboardOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/lib/table'
import { pathMatch, randID, renderSize } from './tools'
import { getMethodColor } from './tools/mappings'
import { sizeof } from "./tools"
import { download } from "./tools"
import jsonschema from 'json-schema'
import { ConfigSchema, TransformResultSchema } from './components/MainEditor/validator'
import useStorage from './hooks/useStorage'
import MainEditor from './components/MainEditor'
import { FileType } from './components/MainEditor/config'
import Quota, { getPercent } from './components/Quota'
import { runCode } from './tools/runCode'
import { loader } from "@monaco-editor/react";
import { sendRequestLog } from './tools/sendRequest'
import { ActiveGroupId, HiddenFieldsFieldKey, ActiveIdFieldKey, RulesFieldKey, SelectedRowFieldKeys, UpdateMsgKey, WatchFilterKey, ConfigInfoFieldKey, PopupMsgKey } from './tools/constants'
import useTranslate from './hooks/useTranslate'
import getStorage from './tools/getStorage'
import { ConfigProvider, theme } from 'antd'
import { sendMessageToBackgound } from './tools/message'

const __DEV__ = import.meta.env.DEV
const isZHCN = __DEV__ ? true : chrome.i18n.getUILanguage().includes('zh')

export interface MatchRule {
    id: string
    count: number
    delay?: number
    enable?: boolean
    url?: string
    groupId?: string
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

if (!process.env.VITE_LOCAL) {
    loader.config({
        paths: {
            vs: process.env.VITE_VS
        },
    })
}

const fields = ['url', 'redirectUrl', 'test', 'groupId', 'description', 'type', 'method', 'status', 'delay', 'params', 'requestHeaders', 'responseHeaders', 'body', 'response', 'responseText']

const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches

export type BanType = 'xhr' | 'fetch' | 'none' | 'all'

export interface ConfigInfoType {
    faked: boolean
    fakedLog: boolean
    runAt: string
    runAtDelay: number
    runAtTrigger: string
    action: string
    banType: BanType
    bootLog: boolean
    allFrames: boolean
    dark: boolean
}

const defaultConfigInfo: ConfigInfoType = {
    faked: false,
    fakedLog: true,
    runAt: 'start',
    runAtDelay: 0,
    runAtTrigger: '**',
    action: 'close',
    banType: 'none',
    bootLog: true,
    allFrames: false,
    dark: isDarkTheme,
}

export default function App() {
    const [configInfo, setConfigInfo] = useStorage<ConfigInfoType>(ConfigInfoFieldKey, defaultConfigInfo)
    const [activeGroupId, setActiveGroupId] = useStorage(ActiveGroupId, 'default')
    const [watchFilter, setWatchFilter] = useStorage(WatchFilterKey, '')
    const [rules, setRules] = useStorage<MatchRule[]>(RulesFieldKey, [])
    const [selectedRowKeys, setSelectedRowKeys] = useStorage(SelectedRowFieldKeys, [])
    const [loading, setLoading] = useState(false)
    const [activeId, setActiveId] = useStorage<string>(ActiveIdFieldKey, null)
    const [invalid, setInvalid] = useState(false)
    const [visible, setVisible] = useState(false)
    const [hiddenFields, setHiddenFields] = useStorage<string[]>(HiddenFieldsFieldKey, [])
    const [percent, setPercent] = useState(0)
    const originRef = useRef('')
    const editorRef = useRef()
    const t = useTranslate()

    const watchRules = () => {
        if (!__DEV__) {
            chrome.storage.local.onChanged.addListener((result) => {
                if (result.hasOwnProperty(UpdateMsgKey)) {
                    reload()
                }
            })
        }
    }

    const reload = async (clean = false) => {
        const map = {
            [ConfigInfoFieldKey]: setConfigInfo,
            [RulesFieldKey]: setRules,
            [SelectedRowFieldKeys]: setSelectedRowKeys,
            [ActiveIdFieldKey]: setActiveId,
            [HiddenFieldsFieldKey]: setHiddenFields,
            [WatchFilterKey]: setWatchFilter,
            [ActiveGroupId]: setActiveGroupId,
        }

        setLoading(true)
        const result = await getStorage(Object.keys(map))
        setLoading(false)
        Object.entries(map).forEach(([key, fn]) => fn(result[key]))
        if (clean) {
            setSelectedRowKeys([])
            setRules(result[RulesFieldKey].map(item => ({ ...item, count: 0 })))
            setActiveId(null)
        }
    }

    const updateOrigin = () => {
        if (!__DEV__) {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab) {
                    try {
                        const [, a, b] = tab.url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
                        const origin = a + b
                        originRef.current = origin
                    } catch (error) { }
                }
            })
        } else {
            originRef.current = location.origin
        }
    }

    const update = (value: Record<FileType, string>, index: number) => {
        setRules(rule => {
            const result = [...rule]
            const config = JSON.parse(value.config)
            result[index] = {
                groupId: 'default',
                ...Object.keys(result[index]).reduce((acc, k) => {
                    if (!fields.includes(k)) {
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
            return count ? `${type}${count}${t('items')}` : total ? `${type}${t('total', [total + ''])}` : ''
        },
        [selectedRowKeys.length, rules.length]
    )

    const editable = React.useMemo(() => !!activeId, [activeId])

    const disabled = React.useMemo(() => editable, [editable])

    const workspaces = React.useMemo(
        () => {
            const result = new Set<string>(['default'])
            rules.forEach(rule => result.add(rule.groupId))
            return [...result].filter(Boolean)
        },
        [rules]
    )

    const workspaceRules = React.useMemo(() => rules.filter(rule => (rule.groupId || 'default') === activeGroupId), [rules, activeGroupId])

    const activeIndex = React.useMemo(() => rules.findIndex(rule => rule.id === activeId), [activeId])

    const columns: ColumnsType<MatchRule> = [
        {
            dataIndex: 'groupId',
            filters: workspaces.map(workspace => ({ text: workspace, value: workspace })),
            width: 5,
            onFilter: (_, record) => record.groupId === activeGroupId,
            render: (_, record) => {
                const status = record.code
                    ? 'default'
                    : (['lime', 'lime', 'success', 'success', 'warning', 'error'][(record.status || 200) / 100 | 0] || 'default') as BadgeProps['status']
                return <Badge style={{ left: -10 }} status={status} />
            },
        },
        {
            title: (
                <Dropdown open={visible} onOpenChange={setVisible}
                    menu={{
                        items: fields.map(field => {
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
                        })
                    }}>
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
            render: (value, record) => {
                const index = rules.findIndex(rule => rule.id === record.id)
                const shortText = value.replace(new RegExp(`^${originRef.current}`), '~')
                return (
                    <Dropdown trigger={['contextMenu']} menu={{
                        items: [
                            {
                                label: t('menu_copy'),
                                key: 'copy',
                                onClick: () => {
                                    setRules(r => {
                                        const rules = [...r]
                                        const rule = { ...rules[index], id: randID(), count: 0, enable: false }
                                        rule.description = t('menu_copy') + (rule.description || '')
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
                        ]
                    }}>
                        <Tooltip placement='topLeft' title={record.description}>
                            <a onClick={() => {
                                setActiveId(record.id)
                            }}>{shortText}</a>
                        </Tooltip>
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
            render: (value, record) => (
                <>
                    {!!record.code ? <CodeOutlined onClick={() => {
                        runCode(record, activeIndex)
                    }} /> : null}
                    <span style={{ paddingLeft: 4 }}>{value ? value : null}</span>
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
            render: (value = 'get', record) => {
                if (!value) {
                    return null
                }
                const canSend = record.url !== undefined

                return (
                    <Tag title={canSend ? t('tip_send') : ''} style={{ cursor: canSend ? 'pointer' : 'text', borderStyle: canSend ? 'solid' : 'dashed' }} color={getMethodColor(value)} onClick={() => {
                        if (canSend) {
                            sendRequestLog(record, activeIndex)
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
                            const allChecked = rules.filter(rule => rule.groupId === activeGroupId).every(rule => rule.enable)
                            return rules.map(rule => {
                                return {
                                    ...rule,
                                    enable: rule.groupId === activeGroupId ? !allChecked : rule.enable
                                }
                            })
                        })
                    }} />
                </Tooltip>
            ),
            render: (value, record) => (
                <Checkbox checked={value} onChange={(e) => {
                    if (!value) {
                        setConfigInfo(info => ({ ...info, action: 'intercept' }))
                    }
                    setRules(data => {
                        const result = [...data]
                        const index = rules.findIndex(rule => rule.id === record.id)
                        result[index].enable = e.target.checked
                        return result
                    })
                }}></Checkbox>
            )
        },
    ]

    const formatResult = (record: MatchRule) => {
        const data = Object.fromEntries(fields.filter(field => !hiddenFields.includes(field)).map(k => [k, record[k]]))
        return {
            code: record.code,
            config: JSON.stringify(data, null, 4),
        }
    }

    useEffect(
        () => {
            reload()
            updateOrigin()
            watchRules()
        },
        []
    )

    useEffect(
        () => {
            if (!__DEV__) {
                sendMessageToBackgound({
                    from: PopupMsgKey,
                    type: 'configInfo',
                    payload: configInfo,
                })
            }

            const html = document.querySelector('html')
            const cls = 'theme--dark'
            if (configInfo.dark && !html.classList.contains(cls)) {
                html.classList.add(cls)
            } else {
                html.classList.remove(cls)
                document.head.querySelector('link[dark]')?.remove()
            }
        },
        [configInfo]
    )
    useEffect(
        () => {
            if (!__DEV__) {
                sendMessageToBackgound({
                    from: PopupMsgKey,
                    type: 'rules',
                    payload: workspaceRules.filter(e => e.enable),
                })
            }
        },
        [workspaceRules]
    )
    useEffect(
        () => {
            getPercent(sizeof(rules)).then(setPercent)
        },
        [rules]
    )

    return (
        <ConfigProvider theme={{
            algorithm: configInfo.dark ? theme.darkAlgorithm : undefined,
            components: {
                Table: {
                    headerBorderRadius: 0,
                },
                Button: {
                    borderRadius: 0
                }
            }
        }}
            locale={{
                locale: '',
                Empty: {
                    description: isZHCN ? '暂时数据' : 'No Data'
                }
            }}
        >
            <Spin spinning={loading}>
                <div className="app">
                    <div className={'app__top'}>
                        <Button.Group style={{ padding: '0 4px' }}>
                            <Tooltip title={t('action_add')}>
                                <Button disabled={disabled} icon={<PlusOutlined />} onClick={() => {
                                    setRules(rule => {
                                        const result = [...rule, {
                                            id: randID(),
                                            count: 0,
                                            groupId: activeGroupId,
                                            test: '/api-' + rule.length,
                                            response: {
                                                code: 0,
                                                data: [],
                                                message: 'success'
                                            },
                                        }]
                                        return result
                                    })
                                }}></Button>
                            </Tooltip>
                            <Tooltip title={getActionText(t('menu_remove'))}>
                                <Button disabled={disabled} icon={<DeleteOutlined />} onClick={() => {
                                    if (!selectedRowKeys.length) {
                                        return setRules([])
                                    }
                                    setRules(rules.filter(item => !selectedRowKeys.find(id => id === item.id)))
                                    setSelectedRowKeys([])
                                }}></Button>
                            </Tooltip>
                            <Tooltip title={getActionText(t('action_export'))}>
                                <Button disabled={disabled} icon={<VerticalAlignBottomOutlined />} onClick={() => {
                                    const data = selectedRowKeys.length
                                        ? rules.filter(item => !selectedRowKeys.find(id => id === item.id))
                                        : rules
                                    download(`${selectedRowKeys.length ? activeGroupId : 'all'}.json`, JSON.stringify(data, null, 2))
                                }}></Button>
                            </Tooltip>
                            <Tooltip title={t('action_import')}>
                                <Upload className='app__upload' disabled={disabled} showUploadList={false} beforeUpload={(file) => {
                                    setLoading(true)
                                    if (! ['application/json', 'text/plain'].includes(file.type)) {
                                        message.error(t('import_modal_err'))
                                        setLoading(false)
                                    } else {
                                        file.text().then(text => {
                                            const arr = JSON.parse(text) as MatchRule[]
                                            const result = jsonschema.validate(arr, TransformResultSchema)
                                            if (!result.valid) {
                                                throw result.errors
                                            }
                                            if (!rules.length) {
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
                                                        message.warning(t('import_modal_filter', [count + '']))
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
                                    <Button disabled={disabled} icon={<UploadOutlined />}></Button>
                                </Upload>
                            </Tooltip>
                            <Tooltip title={t('action_refresh')}>
                                <Button disabled={disabled} icon={<SyncOutlined />} onClick={() => {
                                    setSelectedRowKeys([])
                                    setRules(rules => rules.map(rule => ({ ...rule, count: 0 })))
                                    setActiveId(null)
                                }}></Button>
                            </Tooltip>
                            <Tooltip title={t('action_mode')}>
                                <Button disabled={disabled} type={configInfo.faked ? 'primary' : 'default'} icon={<BugOutlined />} onClick={() => {
                                    setConfigInfo(info => ({ ...info, faked: !info.faked }))
                                }}></Button>
                            </Tooltip>
                            {
                                editable && (
                                    <Tooltip title={t('action_back')}>
                                        <Button icon={<RollbackOutlined />} onClick={() => {
                                            if (invalid) {
                                                (editorRef.current as any).sendMsg()
                                                return
                                            }
                                            setActiveId(null)
                                        }}></Button>
                                    </Tooltip>
                                )
                            }
                        </Button.Group>
                        <div>
                            {
                                configInfo.action === 'watch' && (
                                    <Input value={watchFilter} onChange={e => setWatchFilter(e.target.value)}
                                        style={{ width: 200 }}
                                        suffix={
                                            <Tooltip title={t('button_fill_title')}>
                                                <FormOutlined onClick={() => setWatchFilter(originRef.current + '/**')} />
                                            </Tooltip>
                                        }
                                        placeholder={t('placeholder_watch_filter')}
                                        allowClear />
                                )
                            }
                            <Select bordered={false}
                                placement='bottomRight'
                                popupMatchSelectWidth={false}
                                value={configInfo.action}
                                onChange={(key) => {
                                    setConfigInfo(info => ({ ...info, action: key }))
                                    if (key === 'intercept' && !!activeId) {
                                        setRules(rules => {
                                            const newRules = [...rules]
                                            newRules[activeIndex].enable = true
                                            return newRules
                                        })
                                    }
                                }}>
                                <Select.Option key={'close'}><Badge status='default' text={t('close')}></Badge></Select.Option>
                                <Select.Option key={'watch'}><Badge color={'orange'} status='default' text={t('watch')}></Badge></Select.Option>
                                <Select.Option key={'intercept'}><Badge color={'purple'} status='default' text={t('intercept')}></Badge></Select.Option>
                            </Select>
                        </div>
                    </div>
                    <div className='app__quota'>
                        <Quota percent={percent} />
                    </div>
                    <div className="app__cont">
                        <Table
                            rowKey='id'
                            size='small'
                            pagination={false}
                            columns={columns}
                            scroll={{ y: 492 }}
                            dataSource={workspaceRules}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (keys) => {
                                    setSelectedRowKeys(keys)
                                },
                            }}
                        />
                    </div>
                    <div className="app__bar">
                        <div className='app__bar-item'>
                            <Popover trigger={['click']} placement='topLeft' showArrow={false} content={(
                                <>
                                    <Divider orientation='left' plain>
                                        <Button size='small' type='primary' onClick={() => {
                                            setConfigInfo(info => ({ ...info, fakedLog: true, bootLog: true, dark: false, allFrames: false }))
                                        }}>{t('action_reset')}</Button>
                                    </Divider>
                                    <Space size={'large'}>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ marginRight: 8 }}>{t('action_all_frames')}</span>
                                            <Switch checked={configInfo.allFrames} onClick={() => setConfigInfo(info => ({ ...info, allFrames: !info.allFrames }))}></Switch>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ marginRight: 8 }}>{t('action_theme')}</span>
                                            <Switch checked={configInfo.dark} onClick={() => setConfigInfo(info => ({ ...info, dark: !info.dark }))}></Switch>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ marginRight: 8 }}>{t('action_boot_log')}</span>
                                            <Switch checked={configInfo.bootLog} onClick={() => setConfigInfo(info => ({ ...info, bootLog: !info.bootLog }))}></Switch>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ marginRight: 8 }}>{t('action_faked_log')}</span>
                                            <Switch checked={configInfo.fakedLog} onClick={() => setConfigInfo(info => ({ ...info, fakedLog: !info.fakedLog }))}></Switch>
                                        </div>
                                    </Space>
                                </>
                            )}>
                                <SettingOutlined />
                            </Popover>
                        </div>
                        <div className='app__bar-item'>
                            <Tooltip title={t('select_workspace')}>
                                <AppstoreOutlined />
                            </Tooltip>
                            <Select
                                className='workspace'
                                size='small'
                                suffixIcon={null}
                                placement='topLeft'
                                value={activeGroupId}
                                onChange={(activeGroupId) => {
                                    setSelectedRowKeys([])
                                    setActiveGroupId(activeGroupId)
                                }}
                                bordered={false}
                                style={{ maxWidth: 150 }}
                                dropdownStyle={{ maxWidth: 200 }}
                                optionLabelProp='display'
                                options={workspaces.map(workspace => ({
                                    label: workspace,
                                    display: <span style={{ color: 'white' }}>{workspace}</span>,
                                    value: workspace
                                }))}
                                popupMatchSelectWidth={false} />
                        </div>
                        <div className='app__bar-item'>
                            <Popover trigger={['click']} placement='top' showArrow={false} content={(
                                <>
                                    <Segmented value={configInfo.runAt} onChange={(runAt: string) => {
                                        setConfigInfo(info => ({ 
                                            ...info, 
                                            runAt,
                                            action: (runAt === 'override' && info.action === 'close') ? 'intercept' : info.action,
                                        }))
                                    }} options={[
                                        {
                                            label: t('run_at_start'),
                                            value: 'start',
                                        },
                                        {
                                            label: t('run_at_end'),
                                            value: 'end',
                                        },
                                        {
                                            label: t('run_at_delay'),
                                            value: 'delay',
                                        },
                                        {
                                            label: t('run_at_trigger'),
                                            value: 'trigger',
                                        },
                                        {
                                            label: t('run_at_override'),
                                            value: 'override',
                                        },
                                    ]} />
                                    <div style={{
                                        margin: '8px 0'
                                    }}>
                                        {
                                            configInfo.runAt === 'delay' && <InputNumber value={configInfo.runAtDelay} onChange={(value) => setConfigInfo(info => ({ ...info, runAtDelay: value }))} style={{ width: '100%' }} defaultValue={300} min={0} step={1} precision={0} />
                                        }
                                        {
                                            configInfo.runAt === 'trigger' && <Input value={configInfo.runAtTrigger} onChange={e => setConfigInfo(info => ({ ...info, runAtTrigger: e.target.value }))} style={{ width: '100%' }} defaultValue={'*'} />
                                        }
                                    </div>
                                </>
                            )} title={t('run_at_title')}>
                                <div style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} >
                                    <FieldTimeOutlined />
                                    <span style={{ marginLeft: 4 }}>{configInfo.runAt}</span>
                                    {
                                        configInfo.runAt === 'delay' && <span> | {configInfo.runAtDelay}</span>
                                    }
                                    {
                                        configInfo.runAt === 'trigger' && <span title={configInfo.runAtTrigger}> | {configInfo.runAtTrigger}</span>
                                    }
                                </div>
                            </Popover>
                        </div>
                        <div className='app__bar-item'>
                            <Popover trigger={['click']} placement='top' showArrow={false} content={(
                                <>
                                    <Segmented value={configInfo.banType} onChange={(ban: 'xhr' | 'fetch' | 'none') => {
                                        setConfigInfo(info => ({ ...info, banType: ban }))
                                    }} options={[
                                        { label: t('ban_none'), value: 'none' },
                                        { label: t('ban_xhr'), value: 'xhr' },
                                        { label: t('ban_fetch'), value: 'fetch' },
                                        { label: t('ban_all'), value: 'all' },
                                    ]} />
                                </>
                            )} title={t('ban_title')}>
                                <div style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} >
                                    <StopOutlined />
                                    <span style={{ marginLeft: 4 }}>{configInfo.banType}</span>
                                </div>
                            </Popover>
                        </div>
                        <div className='app_bar-item'>
                            <Tooltip title={t('quota_percent')}>
                                <DashboardOutlined />
                                <span style={{ marginLeft: 4 }}>{percent}%</span>
                            </Tooltip>
                        </div>
                    </div>
                    {
                        editable && (
                            <div className='app__editor'>
                                <MainEditor
                                    isDark={configInfo.dark}
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
        </ConfigProvider>
    )
}