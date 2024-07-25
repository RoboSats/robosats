package com.robosats;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.robosats.modules.NotificationsModule;
import com.robosats.modules.RoboIdentitiesModule;
import com.robosats.modules.SystemModule;
import com.robosats.modules.TorModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RobosatsPackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new SystemModule(reactContext));
        modules.add(new TorModule(reactContext));
        modules.add(new NotificationsModule(reactContext));
        modules.add(new RoboIdentitiesModule(reactContext));

        return modules;
    }
}
