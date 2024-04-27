package com.robosats;

public class RoboIdentities {
    static {
        System.loadLibrary("robonames");
    }

    public String generateRoboname(String initial_string) {
        return nativeGenerateRoboname(initial_string);
    }

    // Native functions implemented in Rust.
    private static native String nativeGenerateRoboname(String initial_string);
}
