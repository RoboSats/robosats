// Heavily inspired by BlixtTor.java
package com.robosats;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.widget.Toast;

import java.util.Stack;

import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.torproject.jni.TorService;

public class RoboTor extends ReactContextBaseJavaModule {
  static private final String TAG = "RoboTor";
  static TorService torService;
  static String currentTorStatus = TorService.STATUS_OFF;
  static Stack<Promise> calleeResolvers = new Stack<>();
  static NotificationManagerCompat notificationManager;

  public RoboTor(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  public String getName() {
    return "RoboTor";
  }

  static private final ServiceConnection torServiceConnection = new ServiceConnection() {
    @Override
    public void onServiceConnected(ComponentName className, IBinder service) {
      // We've bound to LocalService, cast the IBinder and get LocalService instance
      TorService.LocalBinder binder = (TorService.LocalBinder) service;
      torService = binder.getService();
      torService.startForeground(0x1337babe, getNotification(torService));
    }

    @Override
    public void onServiceDisconnected(ComponentName arg0) {
      Log.i(TAG, "onServiceDisconnected");
    }

    // Not shown, but required
    public Notification getNotification(Context context) {
      Intent notificationIntent = new Intent (context, MainActivity.class);
      PendingIntent pendingIntent =
        PendingIntent.getActivity(context, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannel channel = new NotificationChannel(BuildConfig.APPLICATION_ID, "robotor", NotificationManager.IMPORTANCE_NONE);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        notificationManager = NotificationManagerCompat.from(context);
        notificationManager.createNotificationChannel(channel);
      }
      return new Notification.Builder(context, BuildConfig.APPLICATION_ID)
        .setContentTitle("Tor")
        .setContentText("Tor is running in the background")
        .setContentIntent(pendingIntent)
        .setTicker("RoboSats")
        .setOngoing(true)
        .build();
    }
  };

  private final BroadcastReceiver torBroadcastReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      String status = intent.getStringExtra(TorService.EXTRA_STATUS);
      if (intent != null && intent.getAction() != null && intent.getAction().equals("org.torproject.android.intent.action.STOP")) {
        torService.stopSelf();
      }
      currentTorStatus = status;
      if (status.equals(TorService.STATUS_ON)) {
        while (calleeResolvers.size() > 0) {
          calleeResolvers.pop().resolve(TorService.socksPort);
        }
      } else if (status.equals(TorService.STATUS_OFF)) {
        getReactApplicationContext().unregisterReceiver(torBroadcastReceiver);
      }
    }
  };

  @ReactMethod
  public void startTor(Promise promise) {
    if (currentTorStatus.equals(TorService.STATUS_ON)) {
      promise.resolve(TorService.socksPort);
      return;
    }
    calleeResolvers.add(promise);

    getReactApplicationContext().registerReceiver(torBroadcastReceiver, new IntentFilter(TorService.ACTION_STATUS));
    Intent intent = new Intent(getReactApplicationContext(), TorService.class);

    getReactApplicationContext().startForegroundService(intent);
    getReactApplicationContext().bindService(intent, torServiceConnection, Context.BIND_AUTO_CREATE);
  }

  @ReactMethod
  public void stopTor(Promise promise) {
    if (notificationManager != null) {
      notificationManager.cancelAll();
    }
    try {
      getReactApplicationContext().unbindService(torServiceConnection);
    } catch (IllegalArgumentException e) {
      Log.w(TAG, "Tried to unbindService on unbound service");
    }
    promise.resolve(true);
  };

  @ReactMethod
  public void getTorStatus(Promise promise) {
    promise.resolve(currentTorStatus);
  }
}
