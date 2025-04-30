package com.robosats.modules;

import android.app.Application;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.robosats.tor.TorKmp;
import com.robosats.tor.TorKmpManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import kotlin.UninitializedPropertyAccessException;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;


public class TorModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext context;
    private static final Map<String, WebSocket> webSockets = new HashMap<>();

    public TorModule(ReactApplicationContext reactContext) {
        context = reactContext;
        TorKmp torKmpManager = new TorKmp((Application) context.getApplicationContext());
        TorKmpManager.INSTANCE.updateTorKmpObject(torKmpManager);
    }

    @Override
    public String getName() {
        return "TorModule";
    }

    @ReactMethod
    public void sendWsSend(String path, String message, final Promise promise) {
        if (webSockets.get(path) != null) {
            Objects.requireNonNull(webSockets.get(path)).send(message);
            promise.resolve(true);
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void sendWsClose(String path, final Promise promise) {
        if (webSockets.get(path) != null) {
            Objects.requireNonNull(webSockets.get(path)).close(1000, "Closing connection");
            promise.resolve(true);
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void sendWsOpen(String path, final Promise promise) {
        Log.d("Tormodule", "WebSocket opening: " + path);
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(30, TimeUnit.SECONDS) // Set read timeout
                .proxy(TorKmpManager.INSTANCE.getTorKmpObject().getProxy())
                .build();

        // Create a request for the WebSocket connection
        Request request = new Request.Builder()
                .url(path) // Replace with your WebSocket URL
                .build();

        // Create a WebSocket listener
        WebSocketListener listener = new WebSocketListener() {
            @Override
            public void onOpen(@NonNull WebSocket webSocket, Response response) {
                Log.d("Tormodule", "WebSocket opened: " + response.message());
                promise.resolve(true);
                synchronized (webSockets) {
                    webSockets.put(path, webSocket); // Store the WebSocket instance with its URL
                }
            }

            @Override
            public void onMessage(@NonNull WebSocket webSocket, @NonNull String text) {
                onWsMessage(path, text);
            }

            @Override
            public void onMessage(@NonNull WebSocket webSocket, ByteString bytes) {
                onWsMessage(path, bytes.hex());
            }

            @Override
            public void onClosing(@NonNull WebSocket webSocket, int code, @NonNull String reason) {
                Log.d("Tormodule", "WebSocket closing: " + reason);
                synchronized (webSockets) {
                    webSockets.remove(path); // Remove the WebSocket instance by URL
                }
            }

            @Override
            public void onFailure(@NonNull WebSocket webSocket, Throwable t, Response response) {
                Log.d("Tormodule", "WebSocket error: " + t.getMessage());
                promise.resolve(false);
            }
        };

        client.newWebSocket(request, listener);
    }

    @ReactMethod
    public void sendRequest(String action, String url, String headers, String body, final Promise promise) throws JSONException, UninitializedPropertyAccessException {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(30, TimeUnit.SECONDS) // Set read timeout
                .proxy(TorKmpManager.INSTANCE.getTorKmpObject().getProxy())
                .build();

        Request.Builder requestBuilder = new Request.Builder().url(url);

        JSONObject headersObject = new JSONObject(headers);
        headersObject.keys().forEachRemaining(key -> {
            String value = headersObject.optString(key);
            requestBuilder.addHeader(key, value);
        });

        if (Objects.equals(action, "DELETE")) {
            requestBuilder.delete();
        } else if (Objects.equals(action, "POST")) {
            RequestBody requestBody = RequestBody.create(body, MediaType.get("application/json; charset=utf-8"));
            requestBuilder.post(requestBody);
        } else {
            requestBuilder.get();
        }

        Request request = requestBuilder.build();
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.d("RobosatsError", e.toString());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                String body = response.body() != null ? response.body().string() : "{}";
                JSONObject headersJson = new JSONObject();
                response.headers().names().forEach(name -> {
                    try {
                        headersJson.put(name, response.header(name));
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                });
                promise.resolve("{\"json\":" + body + ", \"headers\": " + headersJson +"}");
            }
        });
    }

    @ReactMethod
    public void getTorStatus() throws UninitializedPropertyAccessException {
        String torState = TorKmpManager.INSTANCE.getTorKmpObject().getTorState().getState().name();
        WritableMap payload = Arguments.createMap();
        payload.putString("torStatus", torState);
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorStatus", payload);
    }

    @ReactMethod
    public void isConnected() throws UninitializedPropertyAccessException {
        String isConnected = String.valueOf(TorKmpManager.INSTANCE.getTorKmpObject().isConnected());
        WritableMap payload = Arguments.createMap();
        payload.putString("isConnected", isConnected);
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorIsConnected", payload);
    }

    @ReactMethod
    public void isStarting() throws UninitializedPropertyAccessException {
        String isStarting = String.valueOf(TorKmpManager.INSTANCE.getTorKmpObject().isStarting());
        WritableMap payload = Arguments.createMap();
        payload.putString("isStarting", isStarting);
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorIsStarting", payload);
    }

    @ReactMethod
    public void stop() throws UninitializedPropertyAccessException {
        TorKmpManager.INSTANCE.getTorKmpObject().getTorOperationManager().stopQuietly();
        WritableMap payload = Arguments.createMap();
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorStop", payload);
    }

    @ReactMethod
    public void start() throws InterruptedException, UninitializedPropertyAccessException {
        TorKmpManager.INSTANCE.getTorKmpObject().getTorOperationManager().startQuietly();
        WritableMap payload = Arguments.createMap();
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorStart", payload);
    }

    @ReactMethod
    public void restart() throws UninitializedPropertyAccessException {
        TorKmp torKmp = new TorKmp(context.getCurrentActivity().getApplication());
        TorKmpManager.INSTANCE.updateTorKmpObject(torKmp);
        TorKmpManager.INSTANCE.getTorKmpObject().getTorOperationManager().restartQuietly();
        WritableMap payload = Arguments.createMap();
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorRestart", payload);
    }

    @ReactMethod
    public void newIdentity() throws UninitializedPropertyAccessException {
        TorKmpManager.INSTANCE.getTorKmpObject().newIdentity(context.getCurrentActivity().getApplication());
        WritableMap payload = Arguments.createMap();
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("TorNewIdentity", payload);
    }

    private void onWsMessage(String path, String message) {
        WritableMap payload = Arguments.createMap();
        payload.putString("message", message);
        payload.putString("path", path);
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("WsMessage", payload);
    }

    private void onWsError(String path) {
        WritableMap payload = Arguments.createMap();
        payload.putString("path", path);
        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("WsError", payload);
    }
}
