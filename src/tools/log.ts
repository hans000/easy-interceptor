/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { ExtensionName } from "./constants";

const config = {
    info: 'green',
    warn: 'orange',
    error: 'red'
}

export function log(message: any, type: 'info' | 'warn' | 'error' = 'info') {
    console.log(`%c ${ExtensionName} %c log `, `color:white;background-color:${config[type]}`, 'color:green;background-color:black', message)
}
