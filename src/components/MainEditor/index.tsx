import Editor from '@monaco-editor/react'
import { Menu, message } from 'antd'
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import useStorage from '../../hooks/useStorage'
import getStorage from '../../tools/getStorage'
import { runCode } from '../../tools/runCode'
import { equal } from '../../utils'
import config, { FileType } from './config'
import jsonschema from 'json-schema'

interface IProps {
    value?: Record<FileType, string>
    onChange?: (value: Record<FileType, string>, invalid: boolean) => void
}

const defaultData = {
    general: '',
    requestHeaders: '',
    responseHeaders: '',
    body: '',
    response: '',
    code: '',
}


export default React.forwardRef(function MainEditor(props: IProps, ref) {
    const [data, setData] = useState<Record<FileType, string>>(defaultData)
    const [filename, setFilename] = useStorage<FileType>('path', 'general')
    const [invalid, setInvalid] = useState(false)
    const editorRef = useRef<any>()
    const dataRef = useRef<Record<FileType, string>>()
    const msgRef = useRef('')

    useEffect(
        () => {
            if (props.value && !equal(props.value, data)) {
                setData(props.value)
                dataRef.current = props.value
            }
            getStorage(['path']).then(result => setFilename(result.path))
        },
        []
    )

    const info = React.useMemo(() => config[filename], [filename])
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
                if (info.schema) {
                    const validateResult = jsonschema.validate(json, info.schema)
                    if (validateResult.errors.length) {
                        const { property: p, message: m } = validateResult.errors[0]
                        msgRef.current = `\`${p}\` ${m}`
                        sendMsg()
                        throw msgRef.current
                    }
                }
                props.onChange?.(data, false)
                setInvalid(false)
            } catch (error) {
                msgRef.current = error + ''
                setInvalid(true)
                props.onChange?.(props.value, true)
            }
        } else {
            setInvalid(false)
            props.onChange?.(data, false)
        }
    })

    return (
        <div className='main-editor'>
            <Menu mode='horizontal' activeKey={filename} onClick={(info) => {
                if (invalid) {
                    sendMsg()
                    return
                }
                setFilename(info.key as FileType)
            }}>
                { Object.keys(config).map(file => <Menu.Item key={file}>{file}</Menu.Item>) }
            </Menu>
            <Editor
                height="510px"
                path={filename}
                value={data[filename]}
                language={info.language}
                options={{
                    readOnly: info.readonly
                }}
                onMount={(editor, monaco) => {
                    editorRef.current = editor
                    editor.addAction({
                        id: 'easy-interceptor-test-code',
                        label: 'Test Code',
                        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R],
                        contextMenuGroupId: '9_cutcopypaste',
                        run() {
                            const general = JSON.parse(dataRef.current.general) as any
                            runCode(dataRef.current.code, {
                                delay: general.delay,
                                status: general.status,
                                response: JSON.parse(dataRef.current.response),
                            })
                        },
                    })
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