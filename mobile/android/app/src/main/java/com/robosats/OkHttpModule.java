package com.robosats;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okhttp3.RequestBody;
import okhttp3.MediaType;

import android.util.Log;
import android.util.Base64;

import org.json.JSONTokener;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.net.Proxy;
import java.net.InetSocketAddress;

import java.util.concurrent.TimeUnit;
import java.util.Iterator;

import java.nio.charset.StandardCharsets;

public class OkHttpModule extends ReactContextBaseJavaModule {
    //9050 probably shouldn't be hard coded here, but if there's a SOCKS proxy running on 9050, it's almost certainly Tor
    Proxy proxy = new Proxy(Proxy.Type.SOCKS, new InetSocketAddress("127.0.0.1", 9050));

    //30 second timeouts may seem excessive, but we're dealing with Tor...
    private final OkHttpClient client = new OkHttpClient.Builder()
                                                .connectTimeout(30, TimeUnit.SECONDS)
                                                .readTimeout(30, TimeUnit.SECONDS)
                                                .writeTimeout(30, TimeUnit.SECONDS)
                                                .proxy(proxy).build();


    public OkHttpModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "OkHttpModule";
    }

    private void executeRequest(Request.Builder builder, ReadableMap headers, Promise promise) {
        if (headers != null) {
            for (ReadableMapKeySetIterator it = headers.keySetIterator(); it.hasNextKey(); ) {
                String key = it.nextKey();
                String value = headers.getString(key);
                builder.addHeader(key, value);
            }
        }

        Request request = builder.build();
        for (String name : request.headers().names()) {
        }

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                Log.e("OKHTTP_MODULE", "Response failed. Code: " + response.code() + ", Message: " + response.message());
                promise.reject("OKHTTP_FETCH_ERROR", "Failed to execute API call");
                return;
            }

            // Moving Tor into Java required mangling the responses into a more fetch-y format
            // Loads of annoying logic to recreate the react-native-tor response format, because unknown other stuff in the stack is using it :-|
            // See ApiNativeClient as an example consumer of this format
            WritableMap responseMap = Arguments.createMap();
            if (response.headers() != null) {
                WritableMap headersMap = Arguments.createMap();
                for (String name : response.headers().names()) {
                    headersMap.putString(name.toLowerCase(), response.headers().get(name));
                }
                responseMap.putMap("headers", headersMap);
            }
            else {
                promise.reject("OKHTTP_NULL_RESPONSE_HEADERS", "Response headers are null, something went wrong");
            }

            responseMap.putInt("respCode", response.code());
            String mimeType = response.header("Content-Type");
            if (mimeType != null) {
                responseMap.putString("mimeType", mimeType);
            }

            ResponseBody responseBodyObject = response.body();
            if(responseBodyObject != null) {
                byte[] bytes = responseBodyObject.bytes();
                String bodyString = new String(bytes, StandardCharsets.UTF_8);
                String bodyB64 = Base64.encodeToString(bytes, Base64.NO_WRAP);

                if (mimeType != null && (mimeType.equals("application/json") || mimeType.startsWith("application/json;"))) {
                    try {
                        Object json = new JSONTokener(bodyString).nextValue();
                        if (json instanceof JSONObject) {
                            responseMap.putMap("json", convertJSONObjectToWritableMap((JSONObject) json));
                        } else if (json instanceof JSONArray) {
                            responseMap.putArray("json", convertJSONArrayToWritableArray((JSONArray) json));
                        }
                    } catch (JSONException e) {
                        // If MIME type suggests it's JSON but it can't be parsed, then something is wrong.
                        promise.reject("JSON_PARSE_ERROR", "Failed to parse JSON response");
                        return;
                    }
                }

                responseMap.putString("b64Data", bodyB64);
            }

            promise.resolve(responseMap);
        } catch (Exception e) {
            Log.e("OKHTTP_MODULE", "Exception occurred while making request", e);
            promise.reject("OKHTTP_NETWORK_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void get(String url, ReadableMap headers, Promise promise) {
        Request.Builder builder = new Request.Builder()
                .url(url);

        executeRequest(builder, headers, promise);
    }

    @ReactMethod
    public void post(String url, ReadableMap headers, String body, Promise promise) {
        RequestBody requestBody = RequestBody.create(
            MediaType.parse("application/json; charset=utf-8"),
            body
        );

        Request.Builder builder = new Request.Builder()
            .url(url)
            .post(requestBody);

         executeRequest(builder, headers, promise);
    }

    @ReactMethod
    public void delete(String url, ReadableMap headers, Promise promise) {
        Request.Builder builder = new Request.Builder()
                .url(url)
                .delete();

         executeRequest(builder, headers, promise);
    }

    private WritableArray convertJSONArrayToWritableArray(JSONArray jsonArray) throws JSONException {
        WritableArray writableArray = Arguments.createArray();
        for (int i = 0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);
            if (value instanceof JSONObject) {
                writableArray.pushMap(convertJSONObjectToWritableMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                writableArray.pushArray(convertJSONArrayToWritableArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                writableArray.pushBoolean((Boolean) value);
            } else if (value instanceof Integer) {
                writableArray.pushInt((Integer) value);
            } else if (value instanceof Double) {
                writableArray.pushDouble((Double) value);
            } else if (value instanceof String) {
                writableArray.pushString((String) value);
            } else {
                writableArray.pushNull();
            }
        }
        return writableArray;
    }

    private WritableMap convertJSONObjectToWritableMap(JSONObject jsonObject) throws JSONException {
        WritableMap writableMap = Arguments.createMap();
        Iterator<String> iterator = jsonObject.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            Object value = jsonObject.get(key);
            if (value instanceof JSONObject) {
                writableMap.putMap(key, convertJSONObjectToWritableMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                writableMap.putArray(key, convertJSONArrayToWritableArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                writableMap.putBoolean(key, (Boolean) value);
            } else if (value instanceof Integer) {
                writableMap.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                writableMap.putDouble(key, (Double) value);
            } else if (value instanceof String) {
                writableMap.putString(key, (String) value);
            } else {
                writableMap.putNull(key);
            }
        }
        return writableMap;
    }
}
