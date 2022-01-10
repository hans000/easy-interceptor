import { JSONSchema7 } from 'json-schema';
import { GeneralSchema, HeaderSchema } from './validator';
interface EditorProps {
    name: FileType
    language: string
    value?: string
    readonly?: boolean
    schema?: JSONSchema7
}

export type FileType = 'general' | 'requestHeaders' | 'responseHeaders' | 'body' | 'response' | 'code'

export default {
    general: {
        name: 'general',
        language: 'json',
        value: 'general',
        schema: GeneralSchema,
    },
    requestHeaders: {
        name: 'requestHeaders',
        language: 'json',
        value: 'requestHeaders',
        readonly: true,
        schema: false,
    },
    responseHeaders: {
        name: 'responseHeaders',
        language: 'json',
        value: 'responseHeaders',
        readonly: true,
        schema: false,
    },
    body: {
        name: 'body',
        language: 'json',
        value: 'body',
        readonly: true,
        schema: false,
    },
    response: {
        name: 'response',
        language: 'json',
        value: 'response',
        readonly: false,
    },
    code: {
        name: 'code',
        language: 'javascript',
        value: 'code',
        readonly: false,
    },
} as Record<FileType, EditorProps>