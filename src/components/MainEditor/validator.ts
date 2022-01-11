import { JSONSchema7 } from "json-schema";

export const GeneralSchema: JSONSchema7 = {
    type: "object",
    additionalProperties: false,
    properties: {
        url: {
            type: "string",
            required: ["url"],
        },
        method: {
            type: "string",
            enum: ["get", "post", "put", "delete", ""]
        },
        delay: {
            type: "number"
        },
        status: {
            type: "number"
        },
        // params: {
        //     type: "object",
        //     patternProperties: {
        //         "^[A-Za-z_$][A-Za-z0-9_$]*$": {
        //             type: "string"
        //         }
        //     }
        // },
    },
}

export const CodeResultSchema: JSONSchema7 = {
    type: "object",
    additionalProperties: false,
    properties: {
        delay: {
            type: "number"
        },
        status: {
            type: "number"
        },
        response: {
            required: ["response"],
        },
    },
}

export const HeaderSchema: JSONSchema7 = {
    type: "object",
    patternProperties: {
        "^[A-Za-z_$][A-Za-z0-9_$]*$": {
            type: "string"
        }
    }
}

export const TransformResultSchema: JSONSchema7 = {
    type: "array",
    items: {
        type: "object",
        additionalProperties: false,
        properties: {
            id: {
                type: "string",
                required: ["id"],
            },
            url: {
                type: "string",
                required: ["url"],
            },
            enable: {
                type: "boolean",
            },
            regexp: {
                type: "boolean",
            },
            delay: {
                type: "number",
            },
            status: {
                type: "number",
            },
            count: {
                type: "number",
            },
            method: {
                type: "string",
                enum: ["get", "post", "put", "delete", ""]
            },
            // params: {
            //     type: "object",
            //     patternProperties: {
            //         "^[A-Za-z_$][A-Za-z0-9_$]*$": {
            //             type: "string"
            //         }
            //     }
            // },
            requestHeaders: {
                type: "object",
                patternProperties: {
                    "^[A-Za-z_$][A-Za-z0-9_$]*$": {
                        type: "string"
                    }
                }
            },
            responseHeaders: {
                type: "object",
                patternProperties: {
                    "^[A-Za-z_$][A-Za-z0-9_$]*$": {
                        type: "string"
                    }
                }
            },
            body: {
                type: "object",
            },
            response: {
                type: ["object", "null"],
            },
            code: {
                type: "string",
            },
        },
    }
}