'use strict'

require('can-zone/register')

const Zone = require('can-zone')
const async = require('async')
const _ = require('lodash')

import 'jquery'

// const Promise = require('bluebird')

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
    console.log('xhr: enter')
    getUrl('http://localhost:8080/', () => {
      console.log('xhr: finish')
    }, () => {})
    console.log('xhr: leave')
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
      console.log('promiseQueue: promise->timeout resolve enter')

      setTimeout(() => {
        return getUrl('http://localhost:8080/', resolve, reject)
      }, 200)

      console.log('promiseQueue: promise->timeout resolve leave')
    })
      .then(() => console.log('promise->resolve timeout.then()'))
      .catch((e) => console.log('promise->resolve timeout.catch()', e))

  }
]

function htmlLog(payload) {
  document.getElementById('console').innerHTML += (`${payload}<br>`)
}


function execFnAndCheck(fns) {
  let taskQueue = []


  taskQueue = _.map(fns, fn => new Zone().run(fn))

  Promise.all(taskQueue)
    .then(results => {
      console.log('CB CALL QUEUE FINISHED')
    })
    .catch( e => console.error(e) )
}

window.execFnAndCheck = {
  sync: () => execFnAndCheck(queue),
  async: () => execFnAndCheck(async),
  // mixed: () => execFnAndCheck(mixedQueue)
  // mixed: () => execFnAndCheck(promiseQueue)
  mixed: () => execFnAndCheck(promiseXhrQueue)
}

console.log('main.js loaded')
