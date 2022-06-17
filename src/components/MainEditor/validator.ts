import { JSONSchema7 } from "json-schema";

export function removeRequiredField(schema: JSONSchema7) {
    return {
        ...schema,
        properties: Object.keys(schema.properties).reduce((s, k) => {
            const v = schema.properties[k] as JSONSchema7
            const { required, ...rest } = v
            s[k] = rest
            return s
        }, {})
    }
}

export const ConfigSchema: JSONSchema7 = {
    type: "object",
    additionalProperties: false,
    required: ["url", "response"],
    properties: {
        delay: {
            type: "number"
        },
        sendReal: {
            type: "boolean"
        },
        response: {
            required: ["response"],
            type: ["object", "null"]
        },
        responseHeaders: {
            type: "object",
            patternProperties: {
                "^[A-Za-z_$][A-Za-z0-9_$]*$": {
                    type: "string"
                }
            }
        },
        status: {
            type: "number"
        },
        statusText: {
            type: "string"
        },
        url: {
            type: "string",
            required: ["url"],
        },
        method: {
            type: "string",
            enum: ["get", "post", "put", "delete"]
        },
        params: {
            type: "array",
            items: {
                type: "array",
                items: {
                    type: ['string', 'number'],
                    minItems: 2,
                    maxItems: 2
                }
            }
        },
        body: {
            type: ["object", "null"]
        },
        requestHeaders: {
            type: "object",
            patternProperties: {
                "^[A-Za-z_$][A-Za-z0-9_$]*$": {
                    type: "string"
                }
            }
        },
    },
}


export const MatchTokenSchema: JSONSchema7 = {
    type: "object",
    additionalProperties: false,
    required: ConfigSchema.required,
    properties: {
        ...ConfigSchema.properties,
        code: {
            type: "string",
        },
    },
}

export const ExportSchema: JSONSchema7 = {
    type: "object",
    additionalProperties: false,
    required: [...ConfigSchema.required, "id"],
    properties: {
        ...MatchTokenSchema.properties,
        id: {
            type: "string",
            required: ["id"],
        },
        enable: {
            type: "boolean",
        },
        count: {
            type: "number",
        },
    },
}

export const TransformResultSchema: JSONSchema7 = {
    type: "array",
    items: ExportSchema
}