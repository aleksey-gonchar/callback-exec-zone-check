'use strict'

import 'jquery'
import 'zone.js'

const async = require('async')
const _ = require('lodash')
const request = require('superagent')

class AfterAllZone {
  constructor (next) {
    this.name = 'TaskTrackingZone'
    this.next = next
    this.taskCount = 0
    this.taskInvoked = 0
  }

  onScheduleTask (parent, current, target, task) {
    parent.scheduleTask(target, task);
    this.taskCount++
  }

  onInvokeTask (parent, current, target, task) {
    parent.invokeTask(target, task);
    this.taskInvoked++

    if (this.taskCount === this.taskInvoked) {
      __zone_symbol__setTimeout(() => {
        this.next()
      }, 0)
    }
  }

  onInvoke (
    parentZoneDelegate,
    currentZone,
    targetZone,
    task, delegate,
    applyThis, applyArgs,
    source
  ) {
    console.log(
      'Zone:', currentZone.name,
      'enter'
    )

    parentZoneDelegate.invoke(
      targetZone,
      task,
      applyThis,
      applyArgs,
      source
    )

    console.log(
      'Zone:', currentZone.name,
      'leave'
    )
  }
}

function getUrl (url, resolve, reject) {
  const xhr = new XMLHttpRequest
  xhr.addEventListener('error', reject)
  xhr.addEventListener('load', resolve)
  xhr.open('GET', url)
  xhr.send(null)
}

function htmlLog(payload) {
  document.getElementById('console').innerHTML += (`${payload}<br>`)
}

// TODO: add dom manipulation fn
const promiseXhrQueue = [
  function () {
    request.get('http://localhost:8080/')
      .end((err, res) => {
        console.log('request.get():end()', res)
      })
  },
  function () {
    htmlLog('test')
  },
  function () {
    console.log('getUrl: enter')
    getUrl('http://localhost:8080/', () => {
      console.log('getUrl: finish')
    }, () => {})
    console.log('getUrl: leave')
  },

  function () {
    return new Promise( (resolve, reject) => {
      console.log('promiseQueue: promise-> resolve enter')

      getUrl('http://localhost:8080/', resolve, reject)

      console.log('promiseQueue: promise-> resolve leave')
    })
      .then(() => console.log('promise->resolve.then()'))
      .catch((e) => console.log('promise->resolve.catch()', e))

  },

  function () {
    return new Promise( (resolve, reject) => {
      console.log('promiseQueue: promise-> resolve enter')

      setTimeout(() => {
        return getUrl('http://localhost:8080/', resolve, reject)
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
  },

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
  },

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


let rootZone = Zone.current
let fnZones = []

function execFnAndCheck(fns) {
  let taskQueue = []

  fns.forEach(fn => {
    let taskExec = (next) => {
      let innerNext = () => {
        console.log('REAL next() call')
        next()
      }

      const throttledNext = _.throttle(innerNext, 100, { leading: false, trailing: true })
      let fnZone = rootZone.fork(new AfterAllZone(throttledNext))
      fnZones.push(fnZone)
      fnZone.run(fn)

      const taskCounts = fnZone._zoneDelegate._taskCounts
      const taskCount = _.reduce(taskCounts, (res, count) => {
        if (count === 0) { return res }
        res += count

        return res
      }, 0)

      if (taskCount === 0) { return next() }
    }

    taskQueue.push(taskExec)
  })

  return new Promise((resolve, reject) => {
    async.parallel(taskQueue, (err, results) => {
      if (err) { return reject() }

      return resolve()
    })
  })
}

window.fnZones = fnZones
window.execFnAndCheck = {
  mixed: () => {
    execFnAndCheck(promiseXhrQueue)
      .then(() => {
        console.log('CB CALL QUEUE FINISHED')
      })
  }
}
console.log('main.js loaded')
