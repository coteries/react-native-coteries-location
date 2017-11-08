const ReactNative = require('react-native')

// iOS
const RNCoteriesLocation = ReactNative.NativeModules.RNCoteriesLocation
const { NativeEventEmitter, DeviceEventEmitter } = ReactNative
const LocationEventEmitter = new NativeEventEmitter(RNCoteriesLocation)

// Android
const RNALocation = ReactNative.NativeModules.RNALocation

var subscriptions = []
var updatesEnabled = false

const isIOS = ReactNative.Platform.OS === 'ios'

var CoteriesLocation = {
  getCurrentPosition: (geoSuccess, geoError, geoOptions) => {
    console.log('CoteriesLocation.getCurrentPosition')
    if (isIOS) {
      RNCoteriesLocation.getCurrentPosition(
        geoOptions || {},
          geoSuccess,
          geoError
        )
    } else {
      DeviceEventEmitter.addListener('getCurrentPosition', (e) => {
        geoSuccess({ coords: { longitude: e.Longitude, latitude: e.Latitude } })
        DeviceEventEmitter.removeListener('getCurrentPosition')
      })
      RNALocation.getLocation()
    }
  },

  getCurrentHeading: (geoSuccess, geoError, geoOptions) => {
    if (isIOS) {
      RNCoteriesLocation.getCurrentHeading(
        geoOptions || {},
        geoSuccess,
        geoError
      )
    }
  },

  watchPosition: (geoSuccess, error, options) => {
    console.log('RNALocation watchPosition')
    if (isIOS) {
      if (!updatesEnabled) {
        RNCoteriesLocation.startObserving(options || {})
        updatesEnabled = true
      }

      var watchID = subscriptions.length
      subscriptions.push([
        LocationEventEmitter.addListener('geolocationDidChange', geoSuccess),
        error ? LocationEventEmitter.addListener('geolocationError', error) : null
      ])
      return watchID
    } else {
      if (!updatesEnabled) {
        updatesEnabled = true
        DeviceEventEmitter.addListener('geolocationDidChange', (e) => {
          geoSuccess({ coords: { longitude: e.Longitude, latitude: e.Latitude } })
        })
        RNALocation.watchPosition()
      }
    }
  },

  watchHeading: (success, error, options) => {
    if (isIOS) {
      if (!updatesEnabled) {
        RNCoteriesLocation.startObserving(options || {})
        updatesEnabled = true
      }
      var watchID = subscriptions.length
      subscriptions.push([
        LocationEventEmitter.addListener('headingDidChange', success),
        error ? LocationEventEmitter.addListener('geolocationError', error) : null
      ])
      return watchID
    } else {
      if (!updatesEnabled) {
        updatesEnabled = true
        DeviceEventEmitter.addListener('headingDidChange', success, error)
        RNALocation.watchHeading()
      }
    }
  },

  clearWatch: (watchID) => {
    var sub = subscriptions[watchID]
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return
    }

    sub[0].remove()
    // array element refinements not yet enabled in Flow
    var sub1 = sub[1]
    sub1 && sub1.remove()
    subscriptions[watchID] = undefined
    var noWatchers = true
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false // still valid subscriptions
      }
    }
    if (noWatchers) {
      CoteriesLocation.stopObserving()
    }
  },

  stopObserving: () => {
    if (isIOS) {
      if (updatesEnabled) {
        RNCoteriesLocation.stopObserving()
        updatesEnabled = false
        for (var ii = 0; ii < subscriptions.length; ii++) {
          var sub = subscriptions[ii]
          if (sub) {
            // warning("Called stopObserving with existing subscriptions.");
            sub[0].remove()
            // array element refinements not yet enabled in Flow
            var sub1 = sub[1]
            sub1 && sub1.remove()
          }
        }
        subscriptions = []
      }
    } else {
      if (updatesEnabled) {
        DeviceEventEmitter.removeListener('geolocationDidChange')
        updatesEnabled = false
      }
    }
  }
}

module.exports = CoteriesLocation
