import TextArea from 'antd/lib/input/TextArea'
import React, { useEffect, useRef, useState } from 'react'
import { equal } from '../../utils'
import parse from '../../utils/toJson'
import jsonschema, { JSONSchema7 } from 'json-schema'
import './index.less'
import { Alert } from 'antd'

interface IProps {
    style?: React.CSSProperties
    value: any
    defaultValue?: any
    onChange?: (value: any) => void
    maxRows?: number
    minRows?: number
    validator?: JSONSchema7
    readonly?: boolean
}

export default function RecordViewer(props: IProps) {

    const [editable, setEditable] = useState(false)
    const [error, setError] = useState(false)
    const [value, setValue] = useState<string>(null)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(
        () => {
            if (JSON.stringify(props.value) !== value) {
                const result = props.value
                    ? props.value
                    : props.defaultValue !== undefined
                        ? props.defaultValue
                        : {}
                setValue(JSON.stringify(result, null, 4))
            }
        },
        [props.value]
    )

    const cls = React.useMemo(
        () => {
            const list = ['rv__editor', 'ant-input']
            if (error) {
                list.push('rv__editor--error')
            }
            if (! editable) {
                list.push('rv__editor--readonly')
            } else {
            }
            return list.join(' ')
        },
        [error, value, editable]
    )

    const update = (value: string, flag = false) => {
        setValue(value)
        try {
            const obj = JSON.parse(value)
            const result = validator(obj)
            if (result.valid) {
                flag && props?.onChange?.(obj)
                console.log(obj)
                setError(false)
            } else {
                throw result.errors
            }
        } catch (error) {
            setErrorMsg(() => {
                if (Array.isArray(error)) {
                    const err = error[0]
                    const k = err.property
                    const v = err.message
                    return `property ${k}: ${v}`
                } else {
                    return error.message
                }
            })
            setError(true)
        }
    }

    const validator = (json: any) => {
        if (! props.validator) {
            return { valid: true, errors: [] }
        }
        return jsonschema.validate(json, props.validator)
    }

    return (
        <div className='rv' style={props.style}>
            <TextArea bordered={editable} className={cls} readOnly={!editable}
                value={value}
                onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Tab' || e.key === 'Escape') {
                        e.preventDefault()
                    }
                    if (e.key === 'Escape' && !error) {
                        setEditable(false)
                    }
                }}
                onChange={e => update(e.target.value)}
                onBlur={() => {
                    try {
                        // error时尝试修复
                        const obj = error ? parse(value) : JSON.parse(value)
                        const val = JSON.stringify(obj, null, 4)
                        update(val, true)
                        setEditable(false)
                    } catch (error) {
                    }
                }}
                autoSize={{ maxRows: props.maxRows, minRows: props.minRows }}
                onDoubleClick={() => {
                    if (props.readonly) {
                        return
                    }
                    setEditable(true)
                }}
                ></TextArea>
            {
                error ? <Alert type='error' message={errorMsg} /> : null
            }
        </div>
    )
}