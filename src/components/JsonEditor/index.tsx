import React, { useEffect, useRef } from 'react';
import './index.less'
import 'jsoneditor/dist/jsoneditor.min.css'
import JSONEditor from 'jsoneditor';
import { equal } from '../../utils';

interface IProps {
    style?: React.CSSProperties
    value: any
    onChange?: (value: any) => void
}

export default function(props: IProps) {

    const containerRef = useRef<any>()
    const editorRef = useRef<JSONEditor>()

    useEffect(
        () => {
            if (editorRef?.current && !equal(props.value, editorRef.current.get())) {
                editorRef?.current?.set(props.value)
            }
        },
        [props.value]
    )

    useEffect(() => {
        editorRef.current = new JSONEditor(containerRef.current, {
            mode: 'code',
            modes: ['code', 'tree', 'text', 'view', 'preview'],
            onChange() {
                //@ts-ignore
                editorRef.current.validate().then(errorList => {
                    const error = !!errorList.length
                    const text = editorRef.current.get()
                    if (! error) {
                        props?.onChange?.(text)
                    }
                })
            },
        })
        if (props.value) {
            editorRef.current.set(props.value)
        }
    }, [])

    return (
        <div className='json__cont' style={props.style} ref={containerRef}></div>
    )
}