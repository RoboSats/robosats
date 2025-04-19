package com.robosats;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class MainActivity extends ReactActivity {
  private static final int REQUEST_CODE_POST_NOTIFICATIONS = 1;
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_CODE_POST_NOTIFICATIONS);
    } else {
        String PREFS_NAME = "System";
        String KEY_DATA = "Notifications";

        SharedPreferences sharedPreferences =
                getApplicationContext()
                        .getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
        String stop_notifications = sharedPreferences.getString(KEY_DATA, "false");
        if (!Boolean.parseBoolean(stop_notifications)) {
            Intent serviceIntent = new Intent(getApplicationContext(), NotificationsService.class);
            getApplicationContext().startService(serviceIntent);
        }
    }

    Intent intent = getIntent();
    if (intent != null) {
       String coordinator = intent.getStringExtra("coordinator");
       int order_id = intent.getIntExtra("order_id", 0);
       if (order_id > 0) {
           navigateToPage(coordinator, order_id);
       }
    }
  }

  @Override
  public void onNewIntent(Intent intent) {
      super.onNewIntent(intent);
      if (intent != null) {
          String coordinator = intent.getStringExtra("coordinator");
          int order_id = intent.getIntExtra("order_id", 0);
          if (order_id > 0) {
              navigateToPage(coordinator, order_id);
          }
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
          String PREFS_NAME = "System";
          String KEY_DATA = "Notifications";

          SharedPreferences sharedPreferences =
                  getApplicationContext()
                          .getSharedPreferences(PREFS_NAME, ReactApplicationContext.MODE_PRIVATE);
          String stop_notifications = sharedPreferences.getString(KEY_DATA, "false");
          if (!Boolean.parseBoolean(stop_notifications)) {
              Intent serviceIntent = new Intent(getApplicationContext(), NotificationsService.class);
              getApplicationContext().startService(serviceIntent);
          }
      } else {
        // Permission denied, handle accordingly
        // Maybe show a message to the user explaining why the permission is necessary
      }
    }
  }

  private void navigateToPage(String coordinator, Integer order_id) {
      ReactContext reactContext = getReactInstanceManager().getCurrentReactContext();
      if (reactContext != null) {
          WritableMap payload = Arguments.createMap();
          payload.putString("coordinator", coordinator);
          payload.putInt("order_id", order_id);
          reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("navigateToPage", payload);
      }
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
