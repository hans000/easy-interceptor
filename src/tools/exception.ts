import { ExtensionName } from "./constants";

export function createBlockException() {
    return new Error('Error blocked by ' + ExtensionName)
}