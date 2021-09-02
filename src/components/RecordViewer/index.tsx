import TextArea from 'antd/lib/input/TextArea'
import React, { useEffect, useState } from 'react'
import { equal } from '../../utils'
import parse from '../../utils/toJson'
import jsonschema, { JSONSchema7 } from 'json-schema'
import './index.less'
import { Alert } from 'antd'

interface IProps {
    style?: React.CSSProperties
    value: any
    onChange?: (value: any) => void
    maxRows?: number
    minRows?: number
    validator?: JSONSchema7
}

export default function RecordViewer(props: IProps) {

    const [editable, setEditable] = useState(false)
    const [error, setError] = useState(false)
    const [value, setValue] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(
        () => {
            if (! equal(props.value, value)) {
                setValue(JSON.stringify(props.value || {}, null, 4))
            }
        },
        [props.value]
    )

    const cls = React.useMemo(
        () => {
            const list = ['rv__editor']
            if (error) {
                list.push('rv__editor--error')
            }
            if (! editable) {
                list.push('rv__editor--readonly')
            }
            return list.join(' ')
        },
        [error, value, editable]
    )

    const update = (value: string) => {
        setValue(value)
        try {
            const obj = JSON.parse(value)
            const result = validator(obj)
            if (result.valid) {
                props?.onChange?.(obj)
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
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.key === 'Escape' && !error) {
                        setEditable(false)
                    }
                }}
                onChange={(e) => update(e.target.value)}
                onBlur={() => {
                    if (! error) {
                        setEditable(false)
                    } else {
                        try {
                            // 尝试修复
                            const obj = parse(value)
                            const val = JSON.stringify(obj, null, 4)
                            update(val)
                            setEditable(false)
                        } catch (error) {
                        }
                    }
                }}
                autoSize={{ maxRows: props.maxRows, minRows: props.minRows }} onDoubleClick={() => setEditable(true)}
                ></TextArea>
            {
                error ? <Alert type='error' message={errorMsg} /> : null
            }
        </div>
    )
}