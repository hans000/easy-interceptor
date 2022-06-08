export class CustomEventTarget {
    private _handle = {}

    addEventListener(type, handle) {
        const events = this._handle[type] || (this._handle[type] = [])
        events.push(handle)
    }

    removeEventListener(type, handle) {
        const handles = this._handle[type] || []
        let i = handles.length - 1
        while (i >= 0) {
            if (handles[i] === handle) {
                handles.splice(i, 1)
            }
            i--
        }
    }

    dispatchEvent(event) {
        const handles = this._handle[event.type] || []
        for (let i = 0; i < handles.length; i++) {
            handles[i].call(this, event)
        }
        const onType = `on${event.type}`
        if (this[onType]) {
            this[onType](event)
        }
        return event.defaultPrevented
    }
}
