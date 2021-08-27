
const __Hs_Transformer__ = {
    rules: [],
    enable: true,
}

function turnOn() {
    if (! window.XMLHttpRequest.toString().includes('[native code]')) return
    
    ah.proxy({
        // onRequest: (config, handler) => {
        //     handler.next(config)
        // },
        onResponse: (res, handler) => {
            const { rules, enable } = __Hs_Transformer__
            if (! enable) handler.next(res)

            const url = res.config.xhr.responseURL
            rules.forEach(({ type = false, enable = true, text, data = '' }) => {
                let matched = false;
                if (enable && text) {
                    if (!type && url.indexOf(text) > -1) {
                        matched = true;
                    } else if (type && url.match(new RegExp(text, 'i'))) {
                        matched = true;
                    }
                }
                if (matched) {
                    handler.resolve({
                        ...res,
                        responseText: data,
                        response: data,
                    })
                } else {
                    handler.next(res)
                }
            })
        }
    })
}

window.addEventListener("message", (event) => {
    const data = event.data
    if (data.type === '__Hs_Transformer__' && data.to === 'pageScript') {
        if (data.key === 'rules') {
            __Hs_Transformer__.rules = data.value.map(item => ({ ...item, data: JSON.stringify(item.data) }))
        } else if (data.key === 'enable') {
            __Hs_Transformer__.enable = data.value
        }
    }

    __Hs_Transformer__.enable ? turnOn() : ah.unProxy()
})


// 'use strict';

// var COMPLETED_READY_STATE = 4;

// var RealXHRSend = XMLHttpRequest.prototype.send;

// var requestCallbacks = [];
// var responseCallbacks = [];


// var wired = false;


// function arrayRemove(array,item) {
//     var index = array.indexOf(item);
//     if (index > -1) {
//         array.splice(index, 1);
//     } else {
//         throw new Error("Could not remove " + item + " from array");
//     }
// }


// function fireCallbacks(callbacks,xhr) {
//     for( var i = 0; i < callbacks.length; i++ ) {
//         callbacks[i](xhr);
//     }
// }


// exports.addRequestCallback = function(callback) {
//     requestCallbacks.push(callback);
// };
// exports.removeRequestCallback = function(callback) {
//     arrayRemove(requestCallbacks,callback);
// };


// exports.addResponseCallback = function(callback) {
//     responseCallbacks.push(callback);
// };
// exports.removeResponseCallback = function(callback) {
//     arrayRemove(responseCallbacks,callback);
// };



// function fireResponseCallbacksIfCompleted(xhr) {
//     if( xhr.readyState === COMPLETED_READY_STATE ) {
//         fireCallbacks(responseCallbacks,xhr);
//     }
// }

// function proxifyOnReadyStateChange(xhr) {
//     var realOnReadyStateChange = xhr.onreadystatechange;
//     if ( realOnReadyStateChange ) {
//         xhr.onreadystatechange = function() {
//             fireResponseCallbacksIfCompleted(xhr);
//             realOnReadyStateChange();
//         };
//     }
// }


// exports.isWired = function() {
//     return wired;
// }

// exports.wire = function() {
//     if ( wired ) throw new Error("Ajax interceptor already wired");

//     // Override send method of all XHR requests
//     XMLHttpRequest.prototype.send = function() {

//         // Fire request callbacks before sending the request
//         fireCallbacks(requestCallbacks,this);

//         // Wire response callbacks
//         if( this.addEventListener ) {
//             var self = this;
//             this.addEventListener("readystatechange", function() {
//                 fireResponseCallbacksIfCompleted(self);
//             }, false);
//         }
//         else {
//             proxifyOnReadyStateChange(this);
//         }

//         RealXHRSend.apply(this, arguments);
//     };
//     wired = true;
// };


// exports.unwire = function() {
//     if ( !wired ) throw new Error("Ajax interceptor not currently wired");
//     XMLHttpRequest.prototype.send = RealXHRSend;
//     wired = false;
// };