package com.robosats.modules;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
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
    public String generateRoboname(String initial_string) {
        return new RoboIdentities().generateRoboname(initial_string);
    }
}
