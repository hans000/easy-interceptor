
import MonacoEditor from '@monaco-editor/react'
import { Menu, message } from 'antd'
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import useStorage from '../../hooks/useStorage'
import getStorage from '../../tools/getStorage'
import { equal } from '../../utils'
import config, { FileType } from './config'
import jsonschema from 'json-schema'
import { MatchRule } from '../../App'
import { PathFieldKey } from '../../tools/constants'

//#region loadConfig
//#endregion


interface IProps {
    rule: MatchRule
    index: number
    value?: Record<FileType, string>
    onChange?: (value: Record<FileType, string>, invalid: boolean) => void
}

const defaultData = { config: '', code: '' }

const __DEV__ = import.meta.env.DEV



const Editor = __DEV__ || process.env.VITE_LOCAL ? MonacoEditor : (MonacoEditor as any).default as unknown as typeof MonacoEditor

const MainEditor = React.forwardRef(function (props: IProps, ref) {
    const [data, setData] = useState<Record<FileType, string>>(defaultData)
    const [filename, setFilename] = useStorage<FileType>(PathFieldKey, 'config')
    const dataRef = useRef<Record<FileType, string>>()
    const msgRef = useRef('')

    useEffect(
        () => {
            if (props.value && !equal(props.value, data)) {
                setData(props.value)
                dataRef.current = props.value
            }
            getStorage([PathFieldKey]).then(result => setFilename(result[PathFieldKey]))
        },
        []
    )

    const info = React.useMemo(() => config.find((info => info.name === filename)), [filename])
    const sendMsg = () => message.error(msgRef.current)

    useImperativeHandle(
        ref,
        () => {
            return { sendMsg }
        },
        [],
    )

    const handle = useDebounce(() => {
        if (info.language === 'json' && info.schema !== false) {
            try {
                const json = JSON.parse(data[filename])
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

    return (
        <div className='main-editor'>
            <Menu style={{ userSelect: 'none' }} mode='horizontal' selectable={false} activeKey={filename} onClick={(currInfo) => {
                if (info.name === 'config') {
                    try {
                        const json = JSON.parse(data[filename])
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
                        msgRef.current = error + ''
                        props.onChange?.(props.value, true)
                        return
                    }
                }
                setFilename(currInfo.key as FileType)
            }} items={config.map(info => ({
                label: info.name,
                key: info.name
            }))} />
            <div>
                {
                    config.map(info => {
                        return (
                            <div key={info.name} style={{ position: 'absolute', height: 510, background: '#fff', width: '100%', zIndex: filename === info.name ? 1 : 0 }} className={info.name}>
                                <Editor
                                    height="510px"
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
                                            const result = { ...data, [filename]: value }
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

export default MainEditor