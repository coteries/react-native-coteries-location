const OriginalReactNative = require('react-native');
const RNCoteriesLocation = OriginalReactNative.NativeModules.RNCoteriesLocation;
const LocationEventEmitter = OriginalReactNative.NativeAppEventEmitter;

var subscriptions = [];
var updatesEnabled = false;

type GeoOptions = {
  timeout: number,
  maximumAge: number,
  enableHighAccuracy: boolean,
  distanceFilter: number
};

var CoteriesLocation = {

  getCurrentPosition: function(
    geo_success: Function,
    geo_error?: Function,
    geo_options?: GeoOptions
  ) {
    // invariant(
    //   typeof geo_success === "function",
    //   "Must provide a valid geo_success callback."
    // );
    CoteriesLocation.getCurrentPosition(
      geo_options || {},
      geo_success,
      geo_error || logError
    );
  },

  getCurrentHeading: function(
    geo_success: Function,
    geo_error?: Function,
    geo_options?: GeoOptions
  ) {
    // invariant(
    //   typeof geo_success === "function",
    //   "Must provide a valid geo_success callback."
    // );

    RNCoteriesLocation.getCurrentHeading(
      geo_options || {},
      geo_success,
      geo_error
    );
  },

  watchPosition: function(
    success: Function,
    error?: Function,
    options?: GeoOptions
  ): number {
    if (!updatesEnabled) {
      RNCoteriesLocation.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      LocationEventEmitter.addListener("geolocationDidChange", success),
      error ? LocationEventEmitter.addListener("geolocationError", error) : null
    ]);
    return watchID;
  },

  watchHeading: function(
    success: Function,
    error?: Function,
    options?: GeoOptions
  ): number {
    if (!updatesEnabled) {
      RNCoteriesLocation.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      LocationEventEmitter.addListener("headingDidChange", success),
      error ? LocationEventEmitter.addListener("geolocationError", error) : null
    ]);
    return watchID;
  },

  clearWatch: function(watchID: number) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }

    sub[0].remove();
    // array element refinements not yet enabled in Flow
    var sub1 = sub[1];
    sub1 && sub1.remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      CoteriesLocation.stopObserving();
    }
  },

  stopObserving: function() {
    if (updatesEnabled) {
      CoteriesLocation.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        var sub = subscriptions[ii];
        if (sub) {
          // warning("Called stopObserving with existing subscriptions.");
          sub[0].remove();
          // array element refinements not yet enabled in Flow
          var sub1 = sub[1];
          sub1 && sub1.remove();
        }
      }
      subscriptions = [];
    }
  }
};

module.exports = CoteriesLocation;
