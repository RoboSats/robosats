package com.robosats.workers;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;

import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.robosats.R;

public class NotificationWorker extends Worker {
    private static final String CHANNEL_ID = "robosats_notifications";
    private static final int NOTIFICATION_ID = 123;
    public NotificationWorker(Context context, WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        displayNotification("Order #1111", "Test from the app");
        return Result.success();
    }

    private void displayNotification(String title, String message) {
        NotificationManager notificationManager = (NotificationManager)
                getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                "Robosats",
                NotificationManager.IMPORTANCE_HIGH);
        notificationManager.createNotificationChannel(channel);

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
                        .setContentTitle(title)
                        .setContentText(message)
                        .setSmallIcon(R.mipmap.ic_launcher_round)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
}

