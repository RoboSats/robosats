package com.robosats.modules;

import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class SystemModule extends ReactContextBaseJavaModule {
    public SystemModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SystemModule";
    }

    @ReactMethod
    public void useProxy(String use_proxy) {
        String PREFS_NAME = "System";
        String KEY_DATA = "UsePoxy";
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);

        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_DATA, use_proxy);

        editor.apply();
    }
    @ReactMethod
    public void setFederation(String use_proxy) {
        String PREFS_NAME = "System";
        String KEY_DATA = "Federation";
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);

        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_DATA, use_proxy);

        editor.apply();
    }
}
