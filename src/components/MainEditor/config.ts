/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { JSONSchema7 } from 'json-schema';
import { MutableRefObject } from 'react';
import { MatchRule } from '../../App';
import { runCode } from '../../tools/runCode';
import { sendRequestLog } from '../../tools/sendRequest';
import { ConfigSchema, SettingSchema, removeRequiredField } from './validator';

interface CustomEditorContext {
    editor: any
    monaco: any
    rawdataRef?: MutableRefObject<Record<FileType, string>>
    rule?: MatchRule
    index?: number
}

interface EditorProps {
    name: FileType
    language: string
    value?: string
    readonly?: boolean
    schema?: JSONSchema7 | false
    beforeMount?: (monaco) => void
    onMount?: (context: CustomEditorContext) => void
}

export type FileType = 'config' | 'code' | 'setting'

function createAction(id: string, label: string, handle: Function) {
    return {
        id,
        label,
        contextMenuGroupId: 'intercept',
        run: handle,
    }
}

function createRequestAction(context: CustomEditorContext) {
    return createAction('send request', 'Send Request', () => {
        sendRequestLog(context.rule, context.index)
    })
}

function createRunCodeAction(context: CustomEditorContext) {
    return createAction('run code', 'Run Code', () => {
        const rawdata = context.rawdataRef.current
        const config = JSON.parse(rawdata.config) as any
        runCode({ ...context.rule, ...config, code: rawdata.code }, context.index)
    })
}

const config: EditorProps[] = [
    {
        name: 'config',
        language: 'json',
        value: 'config',
        schema: ConfigSchema,
        onMount: ({ editor, monaco, rule, index }) => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                schemas: [
                    {
                        uri: 'ei://config.json',
                        fileMatch: [editor.getModel().uri.toString()],
                        schema: removeRequiredField(ConfigSchema)
                    }
                ]
            })
            editor.addAction(createRequestAction({ editor, monaco, rule, index }))
        }
    },
    {
        name: 'code',
        language: 'javascript',
        value: 'code',
        beforeMount: (monaco) => {
            const libSource = `
declare interface Rule {
    count?: number
    delay?: number
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
    redirectUrl?: string
}
interface Context {
    xhr?: XMLHttpRequest
    response?: Response
    rule: Rule
}
declare function onResponseHeaders(fn: (headers: Record<string, string>) => Record<string, string> | void): void
declare function onRequestHeaders(fn: (headers: Record<string, string>) => Record<string, string> | void): void
declare function onRedirect(fn: (rule: Rule) => string | void): void
declare function onMatching(fn: (rule: Rule) => MatchingRule | void): void
declare function onResponding(fn: (context: Context) => ResponseRule | void): void

interface ResponseRule {
    response?: any
    responseText?: string
    status?: number
    delay?: number
}
interface MatchingRule extends ResponseRule {
    responseHeaders?: Record<string, string>
}
`
            const libUri = 'ts:typings/fake.d.ts';
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,
            });
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ESNext,
                allowNonTsExtensions: true,
            });
            monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
        },
        onMount: (context) => {
            const { editor } = context
            editor.addAction(createRunCodeAction(context))
            editor.addAction(createRequestAction(context))
        }
    },
    {
        name: 'setting',
        language: 'json',
        value: 'setting',
        schema: SettingSchema,
        onMount: ({ editor, monaco }) => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                schemas: [
                    {
                        uri: 'ei://setting.json',
                        fileMatch: [editor.getModel().uri.toString()],
                        schema: SettingSchema
                    }
                ]
            })
        }
    }
]

export default config
