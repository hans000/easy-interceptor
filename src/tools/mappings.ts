
export function getMethodColor(method: string) {
	return {
		get: 'green',
		post: 'geekblue',
		delete: 'warning',
		put: 'lime',
	}[method]
}

export function getConfigText(action: ActionType) {
	return {
		interceptor: '启用拦截',
		watch: '启用监听',
		close: '关闭',
	}[action]
}