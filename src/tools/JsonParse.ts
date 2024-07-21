/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */

export function parseWithComment(raw: string) {
    // TODO strip comment
    try {
        return JSON.parse(raw)
    } catch (error) {
        
    }
}
