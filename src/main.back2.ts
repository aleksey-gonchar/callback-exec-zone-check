'use strict'

import 'jquery'
import 'zone.js'

const async = require('async')
const _ = require('lodash')
// const Promise = require('bluebird')

class TrackTaskZoneSpec {
  constructor (next) {
    this.name = 'TaskTrackingZone'
    this.next = next
  }

  // onHasTask (delegate, current, target, hasTaskState) {
  //   if (
  //     !hasTaskState.microTask
  //     && !hasTaskState.macroTask
  //   ) {
  //     this.next()
  //   }
  // }

  onZoneEnter () {
    console.log('task enter')
  }

  onZoneLeave () {
    this.next()
    console.log('task leave')
  }

  // onInvoke (
  //   parentZoneDelegate,
  //   currentZone,
  //   targetZone,
  //   task, delegate,
  //   applyThis, applyArgs,
  //   source
  // ) {
  //   console.log(
  //     'Zone:', currentZone.name,
  //     'enter'
  //   )
  //
  //   parentZoneDelegate.invoke(
  //     targetZone,
  //     task,
  //     applyThis,
  //     applyArgs,
  //     source
  //   )
  //
  //   console.log(
  //     'Zone:', currentZone.name,
  //     'leave'
  //   )
  // }
}

const queue = [function () {
  console.log('sync fn1 start')
  console.log('sync fn1 end')
}]

const asyncQueue = [function () {
  console.log('async fn1 start')

  setTimeout(function () {
    console.log('async fn1 timeout called')
  }, 100)

  console.log('async fn1 end')
}]


// TODO: add dom manipulation fn
const mixedQueue = [
  function () {
    console.log('sync fn1 start')
    console.log('sync fn1 end')
  },

  function () {
    console.log('async fn2 start')

    setTimeout(function () {
      console.log('async fn2 timeout called')
    }, 1500)

    console.log('async fn2 end')
  },

  function () {
    console.log('async fn3 start')

    setTimeout(function () {
      console.log('async fn3 timeout called')
    }, 400)

    console.log('async fn3 end')
  },

  function () {
    console.log('sync fn4 start')
    console.log('sync fn4 end')
  }
]

const promiseQueue = [
  function () {
    return new Promise( (resolve, reject) => {
      console.log('promiseQueue: promise-> resolve enter')

      setTimeout(() => {
        console.log('promiseQueue: promise-> resolve finish')
        return resolve()
      }, 200)

      console.log('promiseQueue: promise-> resolve leave')
    })
      .then(() => console.log('promise->resolve.then()'))
      .catch((e) => console.log('promise->resolve.catch()', e))

  },
  function () {
    return new Promise( (resolve, reject) => {
      console.log('promiseQueue: promise->reject enter')

      setTimeout(() => {
        console.log('promiseQueue: promise->reject finish')
        return reject(new Error('test'))
      }, 200)

      console.log('promiseQueue: promise->reject leave')
    })
      .catch((e) => console.log('promise->reject.catch()', e))
      .then(() => console.log('promise->reject.then()'))
  }
]

function getUrl (url, resolve, reject) {
  const xhr = new XMLHttpRequest
  xhr.addEventListener('error', reject)
  xhr.addEventListener('load', resolve)
  xhr.open('GET', url)
  xhr.send(null)
}

const promiseXhrQueue = [
  /**
   * Causes to set: 3 eventTask, 1 macroTask
   * @returns {Promise<void>}
   */
  function () {
    getUrl('http://localhost:8080/', () => {}, () => {})
  },
  /**
   * Causes to set: 3 eventTask, 1 macroTask
   * @returns {Promise<void>}
   */
  // function () {
  //   return new Promise( (resolve, reject) => {
  //     console.log('promiseQueue: promise-> resolve enter')
  //
  //     getUrl('http://localhost:8080/', resolve, reject)
  //
  //     console.log('promiseQueue: promise-> resolve leave')
  //   })
  //     .then(() => console.log('promise->resolve.then()'))
  //     .catch((e) => console.log('promise->resolve.catch()', e))
  //
  // },

  /**
   * Causes to set 1 eventTask
   * @returns {Promise<void>}
   */
  // function () {
  //   return new Promise( (resolve, reject) => {
  //     console.log('promiseQueue: promise-> resolve enter')
  //
  //     setTimeout(() => {
  //       return getUrl('http://localhost:8080/', resolve, reject)
  //     }, 200)
  //
  //     console.log('promiseQueue: promise-> resolve leave')
  //   })
  //     .then(() => console.log('promise->resolve.then()'))
  //     .catch((e) => console.log('promise->resolve.catch()', e))
  //
  // },
  // function () {
  //   return new Promise( (resolve, reject) => {
  //     console.log('promiseQueue: promise->reject enter')
  //
  //     setTimeout(() => {
  //       console.log('promiseQueue: promise->reject finish')
  //       return reject(new Error('test'))
  //     }, 200)
  //
  //     console.log('promiseQueue: promise->reject leave')
  //   })
  //     .catch((e) => console.log('promise->reject.catch()', e))
  //     .then(() => console.log('promise->reject.then()'))
  // }
]

function htmlLog(payload) {
  document.getElementById('console').innerHTML += (`${payload}<br>`)
}

let rootZone = Zone.current
let cbZones = []

function execFnAndCheck(fns) {
  let taskQueue = []

  fns.forEach(fn => {
    let taskCount
    let taskExec = (next) => {
      let innerNext = () => {
        next()
      }

      let fnZone = rootZone.fork(new TrackTaskZoneSpec(innerNext))
      fnZone.run(fn)

      // const taskCounts = fnZone._zoneDelegate._taskCounts
      // taskCount = _.reduce(taskCounts, (res, count) => {
      //   if (count === 0) { return res }
      //   res += count
      //
      //   return res
      // }, 0)
      //
      // if (taskCount === 0) { return next() }
    }

    taskQueue.push(taskExec)
  })

  async.parallel(taskQueue, (err, results) => {
    console.log('CB CALL QUEUE FINISHED')
  })
}

window.cbZones = cbZones

window.execFnAndCheck = {
  sync: () => execFnAndCheck(queue),
  async: () => execFnAndCheck(async),
  // mixed: () => execFnAndCheck(mixedQueue)
  // mixed: () => execFnAndCheck(promiseQueue)
  mixed: () => execFnAndCheck(promiseXhrQueue)
}
console.log('test.js loaded')
