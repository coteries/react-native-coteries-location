package com.syarul.rnalocation;

import android.location.Location;
import android.location.LocationManager;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class RNALocationModule extends ReactContextBaseJavaModule{

    // React Class Name as called from JS
    public static final String REACT_CLASS = "RNALocation";
    // Unique Name for Log TAG
    public static final String TAG = RNALocationModule.class.getSimpleName();
    private LocationManager mLocationManager;
    private Location mLastLocation; // Save last Location Provided

    private static final int LOCATION_INTERVAL = 1000 * 60;
    private static final float LOCATION_DISTANCE = 10f;

    //The React Native Context
    ReactApplicationContext mReactContext;


    // Constructor Method as called in Package
    public RNALocationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        // Save Context for later use
        mReactContext = reactContext;
        mLocationManager = (LocationManager) mReactContext.getSystemService(Context.LOCATION_SERVICE);
        initLastLocation();

    }

    public void destroy()
    {
        Log.e(TAG, "destroy");
        if (mLocationManager != null) {
            for (int i = 0; i < mLocationListeners.length; i++) {
                try {
                    mLocationManager.removeUpdates(mLocationListeners[i]);
                } catch (Exception ex) {
                    Log.i(TAG, "fail to remove location listners, ignore", ex);
                }
            }
        }
    }


    @Override
    public String getName() {
        return REACT_CLASS;
    }

    /*
     * Location Callback as called by JS
     */
    @ReactMethod
    public void getLocation() {
        initLastLocation();
        if (mLastLocation != null) {
            try {
                double Longitude;
                double Latitude;
                double Bearing;

                // Receive Longitude / Latitude from (updated) Last Location
                Longitude = mLastLocation.getLongitude();
                Latitude = mLastLocation.getLatitude();


                Log.i(TAG, "Got new location. Lng: " +Longitude+" Lat: "+Latitude);

                // Create Map with Parameters to send to JS
                WritableMap params = Arguments.createMap();
                params.putDouble("Longitude", Longitude);
                params.putDouble("Latitude", Latitude);

                // Send Event to JS to update Location
                sendEvent(mReactContext, "getCurrentPosition", params);
            } catch (Exception e) {
                e.printStackTrace();
                Log.i(TAG, "Location services disconnected.");
            }
        } else {
            WritableMap params = Arguments.createMap();
            params.putDouble("Longitude", 0);
            params.putDouble("Latitude", 0);
            sendEvent(mReactContext, "getCurrentPosition", params);
        }
    }

    @ReactMethod
    public void watchPosition() {
        getLocation();
        try {
            mLocationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER, LOCATION_INTERVAL, LOCATION_DISTANCE,
                    mLocationListeners[1]);
        } catch (java.lang.SecurityException ex) {
            Log.i(TAG, "fail to request location update, ignore", ex);
        } catch (IllegalArgumentException ex) {
            Log.d(TAG, "network provider does not exist, " + ex.getMessage());
        }
        try {
            mLocationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER, LOCATION_INTERVAL, LOCATION_DISTANCE,
                    mLocationListeners[0]);
        } catch (java.lang.SecurityException ex) {
            Log.i(TAG, "fail to request location update, ignore", ex);
        } catch (IllegalArgumentException ex) {
            Log.d(TAG, "gps provider does not exist " + ex.getMessage());
        }
    }

    @ReactMethod
    public void watchHeading() {
        initLastLocation();
        if (mLastLocation != null) {
            try {
                double Bearing;
                Bearing = mLastLocation.getBearing();
                WritableMap params = Arguments.createMap();
                params.putDouble("Bearing", Bearing);
                sendEvent(mReactContext, "headingDidChange", params);

            }
            catch (Exception e) {
                e.printStackTrace();
                Log.i(TAG, "Location services disconnected.");
            }
        }
    }

    private void initLastLocation() {
        if (mLocationManager != null) {
            try {
                mLastLocation = mLocationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            } catch (Exception ex) {
                Log.i(TAG, "Failed to get Location Service", ex);
            }
        }
    }

    private class LocationListener implements android.location.LocationListener {

        public LocationListener(String provider) {
            Log.e(TAG, "LocationListener " + provider);
            mLastLocation = new Location(provider);
        }

        @Override
        public void onLocationChanged(Location location) {
            Log.e(TAG, "locationChanged: " + location);
            mLastLocation.set(location);

            double Longitude;
            double Latitude;

            // Receive Longitude / Latitude from (updated) Last Location
            Longitude = mLastLocation.getLongitude();
            Latitude = mLastLocation.getLatitude();

            Log.i(TAG, "Got new location. Lng: " +Longitude+" Lat: "+Latitude);

            // Create Map with Parameters to send to JS
            WritableMap params = Arguments.createMap();
            params.putDouble("Longitude", Longitude);
            params.putDouble("Latitude", Latitude);

            // Send Event to JS to update Location
            sendEvent(mReactContext, "getCurrentPosition", params);
        }

        @Override
        public void onProviderDisabled(String provider) {
            Log.e(TAG, "onProviderDisabled: " + provider);
        }

        @Override
        public void onProviderEnabled(String provider) {
            Log.e(TAG, "onProviderEnabled: " + provider);
        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
            Log.e(TAG, "onStatusChanged: " + provider);
        }
    }

    LocationListener[] mLocationListeners = new LocationListener[] {
            new LocationListener(LocationManager.GPS_PROVIDER),
            new LocationListener(LocationManager.NETWORK_PROVIDER)
    };

    /*
     * Internal function for communicating with JS
     */
    private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
        if (reactContext.hasActiveCatalystInstance()) {
            reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        } else {
            Log.i(TAG, "Waiting for CatalystInstance...");
        }
    }
}
