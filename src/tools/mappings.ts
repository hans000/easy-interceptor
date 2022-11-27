
export function getMethodColor(method: string) {
	return {
		get: 'green',
		post: 'geekblue',
		delete: 'warning',
		put: 'lime',
	}[method]
}