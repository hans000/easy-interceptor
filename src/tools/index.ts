/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { pathMatch } from "../utils"

export function matchPath(pattern: string, path: string) {
    return /[?*]/.test(pattern) ? pathMatch(pattern, path) : path.includes(pattern)
}
