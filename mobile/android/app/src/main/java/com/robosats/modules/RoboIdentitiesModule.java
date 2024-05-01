package com.robosats.modules;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.robosats.RoboIdentities;

public class RoboIdentitiesModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext context;

    public RoboIdentitiesModule(ReactApplicationContext reactContext) {
        context = reactContext;
    }

    @Override
    public String getName() {
        return "RoboIdentitiesModule";
    }

    @ReactMethod
    public void generateRoboname(String initial_string, final Promise promise) {
        String roboname = new RoboIdentities().generateRoboname(initial_string);
        promise.resolve(roboname);
    }

    @ReactMethod
    public void generateRobohash(String initial_string, final Promise promise) {
        String robohash = new RoboIdentities().generateRobohash(initial_string);
        promise.resolve(robohash);
    }
}
