class TrackTaskZoneSpec {
  constructor(next) {
    this.name = 'TaskTrackingZone'
    this.next = next
  }

  onHasTask(delegate, current, target, hasTaskState) {
    if (
      !hasTaskState.microTask
      && !hasTaskState.macroTask
    ) {
      this.next()
    }
  }

  onInvokeTask(
    parentZoneDelegate,
    currentZone,
    targetZone,
    task, delegate,
    applyThis, applyArgs,
    source
  ) {
    console.log(
      'Zone:', currentZone.name,
      'Task:', task
    )
    console.log('Invoke', task.source)

    return parentZoneDelegate.invoke(
      targetZone,
      task,
      applyThis,
      applyArgs,
      source
    )
  }
}

const queue = [function () {
  console.log('sync fn1 start')
  console.log('sync fn1 end')
}]

const asyncQueue = [function () {
  console.log('async fn2 start')

  setTimeout(function () {
    console.log('async fn2 timeout called')
  }, 300)

  console.log('async fn2 end')
}]

const mixedQueue = [
  function () {
    console.log('sync fn1 start')
    console.log('sync fn1 end')
  },

  function () {
    console.log('async fn2 start')

    setTimeout(function () {
      console.log('async fn2 timeout called')
    }, 300)

    console.log('async fn2 end')
  },

  function () {
    console.log('async fn3 start')

    setTimeout(function () {
      console.log('async fn3 timeout called')
    }, 300)

    console.log('async fn3 end')
  },

  function () {
    console.log('sync fn4 start')
    console.log('sync fn4 end')
  }
]

function htmlLog(payload) {
  document.getElementById('console').innerHTML += (`${payload}<br>`)
}

define(['jquery', 'zone.js', 'async.js', 'lodash.js'], ($, zone, async, _) => {
  let rootZone = Zone.current
  let cbZones = []

  let logZone = rootZone.fork({
    name: 'logZone',
    onInvoke: function (
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
  })

  function execFnAndCheck(fns) {
    let taskQueue = []

    fns.forEach(fn => {
      let taskExec = (next) => {
        let innerNext = () => {
          next()
        }

        let fnZone = logZone.fork(new TrackTaskZoneSpec(innerNext))
        fnZone.run(fn)

        const taskCounts = fnZone._zoneDelegate._taskCounts

        if (!_.some(taskCounts, value => value > 0)) {
          return next()
        }
      }

      taskQueue.push(taskExec)
    })

    async.series(taskQueue, (err, results) => {
      console.log('cb call queue finished')
    })
  }

  window.cbZones = cbZones
  window.execFnAndCheck = execFnAndCheck

  console.log('test.js loaded')
})


