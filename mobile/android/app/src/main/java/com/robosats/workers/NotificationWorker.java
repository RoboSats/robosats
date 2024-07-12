package com.robosats.workers;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;

import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.facebook.react.bridge.ReactApplicationContext;
import com.robosats.MainActivity;
import com.robosats.R;
import com.robosats.tor.TorKmp;
import com.robosats.tor.TorKmpManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.Proxy;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import kotlin.UninitializedPropertyAccessException;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NotificationWorker extends Worker {
    private static final String CHANNEL_ID = "robosats_notifications";
    private static final String PREFS_NAME_NOTIFICATION = "Notifications";
    private static final String PREFS_NAME_SYSTEM = "System";
    private static final String KEY_DATA_SLOTS = "Slots";
    private static final String KEY_DATA_PROXY = "UsePoxy";
    private static final String KEY_DATA_FEDERATION = "Federation";

    public NotificationWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {

        SharedPreferences sharedPreferences =
                getApplicationContext()
                        .getSharedPreferences(PREFS_NAME_NOTIFICATION, ReactApplicationContext.MODE_PRIVATE);
        String slotsJson = sharedPreferences.getString(KEY_DATA_SLOTS, null);

        try {
            assert slotsJson != null;
            JSONObject slots = new JSONObject(slotsJson);
            Iterator<String> it = slots.keys();

            while (it.hasNext()) {
                String robotToken = it.next();
                JSONObject slot = (JSONObject) slots.get(robotToken);
                JSONObject robots = slot.getJSONObject("robots");
                JSONObject coordinatorRobot;
                String activeShortAlias;
                try {
                    activeShortAlias = slot.getString("activeShortAlias");
                    coordinatorRobot = robots.getJSONObject(activeShortAlias);
                    fetchNotifications(coordinatorRobot, activeShortAlias);
                } catch (JSONException | InterruptedException e) {
                    Log.d("JSON error", String.valueOf(e));
                }
            }
        } catch (JSONException e) {
            Log.d("JSON error", String.valueOf(e));
        }
        return Result.success();
    }

    private void fetchNotifications(JSONObject robot, String coordinator) throws JSONException, InterruptedException {
        String token = robot.getString("tokenSHA256");
        SharedPreferences sharedPreferences =
                getApplicationContext()
                        .getSharedPreferences(PREFS_NAME_SYSTEM, ReactApplicationContext.MODE_PRIVATE);
        boolean useProxy = Objects.equals(sharedPreferences.getString(KEY_DATA_PROXY, null), "true");
        JSONObject federation = new JSONObject(sharedPreferences.getString(KEY_DATA_FEDERATION, "{}"));
        long unix_time_millis = sharedPreferences.getLong(token, 0);
        String url = federation.getString(coordinator) + "/api/notifications";
//        if (unix_time_millis > 0) {
//            String last_created_at = String
//                    .valueOf(LocalDateTime.ofInstant(Instant.ofEpochMilli(unix_time_millis), ZoneId.of("UTC")));
//            url += "?created_at=" + last_created_at;
//        }

        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS) // Set connection timeout
                .readTimeout(30, TimeUnit.SECONDS); // Set read timeout

        if (useProxy) {
            TorKmp tor = this.getTorKmp();
            builder.proxy(tor.getProxy());
        }

        OkHttpClient client = builder.build();
        Request.Builder requestBuilder = new Request.Builder().url(url);

        requestBuilder
                .addHeader("Authorization", "Token " + token);

        requestBuilder.get();
        Request request = requestBuilder.build();
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                displayErrorNotification();
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
                    if (results.length() > 0) {
                        JSONObject notification = results.getJSONObject(0);
                        Integer order_id = notification.getInt("order_id");

                        displayOrderNotification(order_id, notification.getString("title"), coordinator);

                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.putLong(token, System.currentTimeMillis());
                        editor.apply();
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
            }
        });

    }

    private void displayOrderNotification(Integer order_id, String message, String coordinator) {
        NotificationManager notificationManager = (NotificationManager)
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                order_id.toString(),
                NotificationManager.IMPORTANCE_HIGH);
        notificationManager.createNotificationChannel(channel);

        Intent intent = new Intent(this.getApplicationContext(), MainActivity.class);
        intent.putExtra("coordinator", coordinator);
        intent.putExtra("order_id", order_id);
        PendingIntent pendingIntent = PendingIntent.getActivity(this.getApplicationContext(), 0,
                intent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle("Order #" + order_id)
                        .setContentText(message)
                        .setSmallIcon(R.mipmap.ic_launcher_round)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true);

        notificationManager.notify(order_id, builder.build());
    }

    private void displayErrorNotification() {
        NotificationManager notificationManager = (NotificationManager)
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                "robosats_error",
                NotificationManager.IMPORTANCE_HIGH);
        notificationManager.createNotificationChannel(channel);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle("Connection Error")
                        .setContentText("There was an error while connecting to the Tor network.")
                        .setSmallIcon(R.mipmap.ic_launcher_round)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                        .setAutoCancel(true);

        notificationManager.notify(0, builder.build());
    }

    private TorKmp getTorKmp() throws InterruptedException {
        TorKmp torKmp;
        try {
            torKmp = TorKmpManager.INSTANCE.getTorKmpObject();
        } catch (UninitializedPropertyAccessException e) {
            torKmp = new TorKmp((Application) this.getApplicationContext());
        }

        int retires = 0;
        while (!torKmp.isConnected() && retires < 15) {
            if (!torKmp.isStarting()) {
                torKmp.getTorOperationManager().startQuietly();
            }
            Thread.sleep(2000);
            retires += 1;
        }

        if (!torKmp.isConnected()) {
            displayErrorNotification();
        }

        return torKmp;
    }
}

