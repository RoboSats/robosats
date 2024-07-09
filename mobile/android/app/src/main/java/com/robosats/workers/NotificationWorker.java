package com.robosats.workers;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;

import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.facebook.react.bridge.ReactApplicationContext;
import com.robosats.R;
import com.robosats.tor.TorKmpManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NotificationWorker extends Worker {
    private static final String CHANNEL_ID = "robosats_notifications";
    private static final String PREFS_NAME = "Notifications";
    private static final String KEY_DATA = "Slots";

    public NotificationWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {

        SharedPreferences sharedPreferences = getApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
        String slotsJson = sharedPreferences.getString(KEY_DATA, null);

        try {
            assert slotsJson != null;
            JSONObject slots = new JSONObject(slotsJson);
            Iterator<String> it = slots.keys();

            while (it.hasNext()) {
                String robotToken = it.next();
                JSONObject slot = (JSONObject) slots.get(robotToken);

                JSONObject robots = slot.getJSONObject("robots");
                String activeShortAlias = slot.getString("activeShortAlias");
                JSONObject coordinatorRobot = robots.getJSONObject(activeShortAlias);
                String coordinator = "satstralia";
                fetchNotifications(coordinatorRobot, coordinator);
            }
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
        return Result.success();
    }

    private void fetchNotifications(JSONObject robot, String coordinator) throws JSONException {
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(30, TimeUnit.SECONDS) // Set read timeout
                .proxy(TorKmpManager.INSTANCE.getTorKmpObject().getProxy())
                .build();
        Request.Builder requestBuilder = new Request.Builder().url("http://satstraoq35jffvkgpfoqld32nzw2siuvowanruindbfojowpwsjdgad.onion/api/notifications");

        requestBuilder.addHeader("Authorization", "Token " + robot.getString("tokenSHA256"));

        requestBuilder.get();
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
                try {
                    JSONArray results = new JSONArray(body);
                    for (int i = 0; i < results.length(); i++) {
                        SharedPreferences sharedPreferences = getApplicationContext().getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
                        JSONObject notification = results.getJSONObject(i);
                        Integer order_id = notification.getInt("order_id");

                        displayNotification(order_id, notification.getString("title"), coordinator);

                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.putString(coordinator + order_id, String.valueOf(notification.getInt("created_at")));
                        editor.apply();
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
            }
        });

    }

    private void displayNotification(Integer order_id, String message, String coordinator) {
        NotificationManager notificationManager = (NotificationManager)
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                "Robosats",
                NotificationManager.IMPORTANCE_HIGH);
        notificationManager.createNotificationChannel(channel);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle("Order #" + order_id)
                        .setContentText(message)
                        .setSmallIcon(R.mipmap.ic_launcher_round)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        notificationManager.notify(order_id, builder.build());
    }
}

