import { JSONSchema7 } from 'json-schema';
import { MutableRefObject } from 'react';
import { MatchRule } from '../../App';
import { runCode } from '../../tools/runCode';
import { sendRequest } from '../../tools/sendRequest';
import { ConfigSchema, removeRequiredField } from './validator';

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
    schema?: JSONSchema7
    beforeMount?: (monaco) => void
    onMount?: (context: CustomEditorContext) => void
}

export type FileType = 'config' | 'code'

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
        sendRequest(context.rule, context.index)
    })
}

function createRunCodeAction(context: CustomEditorContext) {
    return createAction('run code', 'Run Code', () => {
        const rawdata = context.rawdataRef.current
        const config = JSON.parse(rawdata.config) as any
        runCode({ ...context.rule, ...config, code: rawdata.code })
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
                        uri: 'http://json-schema.org/',
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
//         beforeMount: (monaco) => {
//             const libSource = `
// declare type Context = {
//     delay?: number
//     sendReal?: boolean
//     requestInit: {
//         url: string
//         method?: 'get' | 'post' | 'delete' | 'put' | 'patch'
//         body?: any
//         params?: Record<string, string>
//         headers?: Record<string, string>
//     }
//     responseInit: {
//         status?: number
//         response?: any
//         headers?: Record<string, string>
//     }
// }

// declare module "fake" {
//     export = $
// }

// declare type Handle = (context: Context) => Context

// declare var $: (handle: Handle) => Context
// `
//             const libUri = 'ts:typings/fake.d.ts';
//             monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
//         },
        onMount: (context) => {
            const { editor } = context
            editor.addAction(createRunCodeAction(context))
            editor.addAction(createRequestAction(context))
        }
    },
]

export default config