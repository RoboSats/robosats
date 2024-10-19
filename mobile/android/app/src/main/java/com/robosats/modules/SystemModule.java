package com.robosats.modules;

import android.content.Intent;
import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.robosats.NotificationsService;

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

    @ReactMethod
    public void stopNotifications(String stop_notifications) {
        String PREFS_NAME = "System";
        String KEY_DATA = "Notifications";

        ReactApplicationContext context  = getReactApplicationContext();
        Intent intent = new Intent(context, NotificationsService.class);

        if (Boolean.parseBoolean(stop_notifications)) {
            context.stopService(intent);
        } else {
            context.startService(intent);
        }

        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_DATA, stop_notifications);

        editor.apply();
    }
}
