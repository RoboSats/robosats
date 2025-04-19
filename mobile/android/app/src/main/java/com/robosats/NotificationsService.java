package com.robosats;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.robosats.tor.TorKmp;
import com.robosats.tor.TorKmpManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Iterator;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import kotlin.UninitializedPropertyAccessException;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NotificationsService extends Service {
    private Handler handler;
    private Runnable periodicTask;
    private static final String CHANNEL_ID = "robosats_notifications";
    private static final int NOTIFICATION_ID = 76453;
    private static final long INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    private static final String PREFS_NAME_NOTIFICATION = "Notifications";
    private static final String PREFS_NAME_SYSTEM = "System";
    private static final String KEY_DATA_SLOTS = "Slots";
    private static final String KEY_DATA_PROXY = "UsePoxy";
    private static final String KEY_DATA_FEDERATION = "Federation";

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildServiceNotification());

        handler = new Handler();
        periodicTask = new Runnable() {
            @Override
            public void run() {
                Log.d("NotificationsService", "Running periodic task");
                executeBackgroundTask();
                handler.postDelayed(periodicTask, INTERVAL_MS);
            }
        };

        Log.d("NotificationsService", "Squeduling periodic task");
        handler.postDelayed(periodicTask, 5000);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && periodicTask != null) {
            handler.removeCallbacks(periodicTask);
        }

        stopForeground(true);
    }

    private void createNotificationChannel() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Robosats",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        manager.createNotificationChannel(channel);
    }

    private void executeBackgroundTask() {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        executor.submit(this::checkNotifications);
        executor.shutdown();
    }

    private Notification buildServiceNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Tor Notifications")
                .setContentText("Running in the background every 5 minutes to check for notifications.")
                .setSmallIcon(R.mipmap.ic_icon)
                .setTicker("Robosats")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(pendingIntent);

        return builder.build();
    }

    public void checkNotifications() {
        Log.d("NotificationsService", "checkNotifications");
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
                String shortAlias = "";
                if (slot.has("activeShortAlias")) {
                    shortAlias = slot.getString("activeShortAlias");
                } else if (slot.has("activeOrder") && !slot.isNull("activeOrder")) {
                    JSONObject activeOrder = slot.getJSONObject("activeOrder");
                    shortAlias = activeOrder.getString("shortAlias");
                }
                if (!shortAlias.isBlank()) {
                    coordinatorRobot = robots.getJSONObject(shortAlias);
                    fetchNotifications(coordinatorRobot, shortAlias);
                }
            }
        } catch (JSONException | InterruptedException e) {
            Log.d("NotificationsService", "Error reading garage: " + e);
        }
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
        if (unix_time_millis > 0) {
            String last_created_at = String
                    .valueOf(LocalDateTime.ofInstant(Instant.ofEpochMilli(unix_time_millis), ZoneId.of("UTC")));
            url += "?created_at=" + last_created_at;
        }

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
                Log.d("NotificationsService", "Error fetching coordinator: " + e.toString());
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
                    for (int i=0; i < results.length(); i++) {
                        JSONObject notification = results.getJSONObject(i);
                        Integer order_id = notification.getInt("order_id");
                        String title = notification.getString("title");

                        if (title.isEmpty()) {
                            continue;
                        }

                        displayOrderNotification(order_id, title, coordinator);

                        long milliseconds;
                        try {
                            String created_at = notification.getString("created_at");
                            LocalDateTime datetime = LocalDateTime.parse(created_at, DateTimeFormatter.ISO_DATE_TIME);
                            milliseconds = datetime.toInstant(ZoneOffset.UTC).toEpochMilli() + 1000;
                        } catch (JSONException e) {
                            milliseconds = System.currentTimeMillis();
                        }

                        SharedPreferences.Editor editor = sharedPreferences.edit();
                        editor.putLong(token, milliseconds);
                        editor.apply();
                        break;
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

        Intent intent = new Intent(this.getApplicationContext(), MainActivity.class);
        intent.putExtra("coordinator", coordinator);
        intent.putExtra("order_id", order_id);
        PendingIntent pendingIntent = PendingIntent.getActivity(this.getApplicationContext(), 0,
                intent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle("Order #" + order_id)
                        .setContentText(message)
                        .setSmallIcon(R.mipmap.ic_icon)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true);

        notificationManager.notify(order_id, builder.build());
    }

    private void displayErrorNotification() {
        NotificationManager notificationManager = (NotificationManager)
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle("Connection Error")
                        .setContentText("There was an error while connecting to the Tor network.")
                        .setSmallIcon(R.mipmap.ic_icon)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
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
