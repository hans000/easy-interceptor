/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */

export function getMethodColor(method: string) {
	return {
		get: 'green',
		post: 'geekblue',
		delete: 'warning',
		put: 'lime',
	}[method]
}