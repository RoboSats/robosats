package com.robosats;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactRootView;
import com.robosats.workers.NotificationWorker;

import java.util.concurrent.TimeUnit;

public class MainActivity extends ReactActivity {
  private static final int REQUEST_CODE_POST_NOTIFICATIONS = 1;
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_CODE_POST_NOTIFICATIONS);
    } else {
      // Permission already granted, schedule your work
      schedulePeriodicTask();
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "RoboSats";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
   * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
   * (Paper).
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new MainActivityDelegate(this, getMainComponentName());
  }

  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode == REQUEST_CODE_POST_NOTIFICATIONS) {
      if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
        schedulePeriodicTask();
      } else {
        // Permission denied, handle accordingly
        // Maybe show a message to the user explaining why the permission is necessary
      }
    }
  }

  private void schedulePeriodicTask() {
//    // Trigger the WorkManager setup and enqueueing here
//    PeriodicWorkRequest periodicWorkRequest =
//            new PeriodicWorkRequest.Builder(NotificationWorker.class, 15, TimeUnit.MINUTES)
//                    .build();
//
//    WorkManager.getInstance(getApplicationContext())
//            .enqueueUniquePeriodicWork("RobosatsNotificationsWork",
//                    ExistingPeriodicWorkPolicy.KEEP, periodicWorkRequest);
    OneTimeWorkRequest workRequest =
            new OneTimeWorkRequest.Builder(NotificationWorker.class)
                    .setInitialDelay(25, TimeUnit.SECONDS)
                    .build();

    WorkManager.getInstance(getApplicationContext())
            .enqueue(workRequest);
  }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
      return reactRootView;
    }

    @Override
    protected boolean isConcurrentRootEnabled() {
      // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
      // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }
  }
}
