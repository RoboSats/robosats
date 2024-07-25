package com.robosats.modules;

import android.content.SharedPreferences;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NotificationsModule extends ReactContextBaseJavaModule {
    public NotificationsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NotificationsModule";
    }

    @ReactMethod
    public void monitorOrders(String slots_json) {
        String PREFS_NAME = "Notifications";
        String KEY_DATA = "Slots";
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);

        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_DATA, slots_json);

        editor.apply();
    }
}
