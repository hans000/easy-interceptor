/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */

import MonacoEditor from '@monaco-editor/react'
import { Menu, message } from 'antd'
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import useStorage from '../../hooks/useStorage'
import getStorage from '../../tools/getStorage'
import { equal } from '../../tools'
import config, { FileType } from './config'
import jsonschema from 'json-schema'
import { MatchRule } from '../../App'
import { PathFieldKey } from '../../tools/constants'

//#region loadConfig
//#endregion


const defaultData = { config: '', code: '', setting: '' }

const __DEV__ = import.meta.env.DEV

const Editor = __DEV__ || process.env.VITE_LOCAL ? MonacoEditor : (MonacoEditor as any).default as unknown as typeof MonacoEditor

const MainEditor = React.forwardRef(function (props: {
    rule: MatchRule
    index: number
    isDark?: boolean
    value?: Record<FileType, string>
    onChange?: (value: Record<FileType, string>, invalid: boolean) => void
    fileName?: FileType
    onFileNameChange?: (fileName: FileType) => void
}, ref) {
    const [data, setData] = useState<Record<FileType, string>>(defaultData)
    const [fileName, setFileName] = useState<FileType>(props.fileName)
    const dataRef = useRef<Record<FileType, string>>()
    const msgRef = useRef('')

    const info = React.useMemo(() => config.find((info => info.name === fileName)), [fileName])
    const sendMsg = () => message.error(msgRef.current)

    const handle = useDebounce(() => {
        if (info.language === 'json' && info.schema !== false) {
            try {
                const json = JSON.parse(data[fileName])
                const validateResult = jsonschema.validate(json, info.schema)
                if (validateResult.errors.length) {
                    const { property: p, message: m } = validateResult.errors[0]
                    throw `\`${p}\` ${m}`
                }
                props.onChange?.(data, false)
            } catch (error) {
                msgRef.current = error + ''
                props.onChange?.(props.value, true)
            }
        } else {
            props.onChange?.(data, false)
        }
    })

    useImperativeHandle(
        ref,
        () => {
            return { sendMsg }
        },
        [],
    )

    useEffect(() => {
        if (props.fileName !== fileName) {
            setFileName(props.fileName)
        }
    }, [props.fileName])

    useEffect(
        () => {
            if (props.value && !equal(props.value, data)) {
                setData(props.value)
                dataRef.current = props.value
            }
            // getStorage([PathFieldKey]).then(result => setFilename(result[PathFieldKey]))
        },
        []
    )

    return (
        <div className='main-editor'>
            <Menu style={{ userSelect: 'none' }} mode='horizontal' selectable={false} activeKey={fileName} onClick={(currInfo) => {
                if (info.name === 'config') {
                    try {
                        const json = JSON.parse(data[fileName])
                        const { schema } = info
                        if (schema) {
                            const validateResult = jsonschema.validate(json, schema)
                            if (validateResult.errors.length) {
                                const { property: p, message: m } = validateResult.errors[0]
                                msgRef.current = p ? `property: \`${p}\`, ${m}` : m
                                sendMsg()
                                throw msgRef.current
                            }
                        }
                    } catch (error) {
                        sendMsg()
                        msgRef.current = error + ''
                        props.onChange?.(props.value, true)
                        return
                    }
                }
                setFileName(currInfo.key as FileType)
                props.onFileNameChange?.(currInfo.key as FileType)
            }} items={config.map(info => ({
                label: info.name,
                key: info.name,
                disabled: props.index === -1 && info.name !== 'setting',
            }))} />
            <div>
                {
                    config.map(info => {
                        return (
                            <div
                                key={info.name}
                                className={info.name}
                                style={{
                                    position: 'absolute',
                                    height: 514,
                                    background: props.isDark ? '#000' : '#fff',
                                    width: '100%',
                                    zIndex: fileName === info.name ? 1 : 0
                                }}>
                                <Editor
                                    theme={props.isDark ? 'vs-dark' : 'light'}
                                    height="514px"
                                    path={info.name}
                                    value={data[info.name]}
                                    language={info.language}
                                    options={{
                                        readOnly: info.readonly,
                                        // ...(info.model && { model: info.model })
                                    }}
                                    beforeMount={(monaco) => {
                                        if (info.beforeMount) {
                                            info.beforeMount(monaco)
                                        }
                                    }}
                                    onMount={(editor, monaco) => {
                                        if (info.onMount) {
                                            info.onMount({
                                                editor,
                                                monaco,
                                                rawdataRef: dataRef,
                                                rule: props.rule,
                                                index: props.index
                                            })
                                        }
                                    }}
                                    onChange={value => {
                                        setData(data => {
                                            const result = { ...data, [fileName]: value }
                                            dataRef.current = result
                                            return result
                                        })
                                        handle()
                                    }}
                                />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
})

MainEditor.displayName = 'MainEditor'

export default MainEditor
