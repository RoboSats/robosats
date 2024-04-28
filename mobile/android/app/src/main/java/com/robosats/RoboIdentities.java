package com.robosats;

import android.util.Log;

public class RoboIdentities {
    static {
        System.loadLibrary("robonames");
        System.loadLibrary("robohash");
    }

    public String generateRoboname(String initial_string) {
        return nativeGenerateRoboname(initial_string);
    }

    public String generateRobohash(String initial_string) {
        return nativeGenerateRobohash(initial_string);
    }

    // Native functions implemented in Rust.
    private static native String nativeGenerateRoboname(String initial_string);
    private static native String nativeGenerateRobohash(String initial_string);
}
