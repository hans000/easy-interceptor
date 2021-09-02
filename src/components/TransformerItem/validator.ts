import { JSONSchema7 } from "json-schema";

export const GeneralSchema: JSONSchema7 = {
    type: "object",
    properties: {
        url: {
            type: "string",
            required: ["url"],
        },
        method: {
            type: "string",
            required: ["method"],
            enum: ["get", "post", "option", "put", "delete"]
        }
    },
}

export const HeaderSchema: JSONSchema7 = {
    type: "object",
    patternProperties: {
        "^[A-Za-z_][A-Za-z0-9_]*$": {
            type: "string"
        }
    }
}