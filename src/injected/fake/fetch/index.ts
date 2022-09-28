import { delayRun } from '../../../tools'
import { __global__ } from '../globalVar'

export default async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const { faked, onFetchIntercept, onMatch } = __global__.options
    const req = input instanceof Request ? input.clone() : new Request(input.toString(), init)

    const matchItem = onMatch({
        method: req.method,
        requestUrl: req.url,
    })

    const realResponse = faked ? new Response(new Blob(['null'])) : await __global__.NativeFetch.call(null, input, init)
    const response = await onFetchIntercept(matchItem)(realResponse)

    return new Promise((resolve) => {
        delayRun(() => {
            resolve(response || realResponse)
        }, matchItem ? matchItem.delay : undefined)
    })
}