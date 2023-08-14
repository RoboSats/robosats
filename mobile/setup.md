Tested on Ubuntu 20.04 and OSX 12.5.1

# Ubuntu

## Install JDK

Make sure you install version 17

```
sudo apt update
sudo apt install default-jdk
java -version
```

## Install Android Studio

```
sudo add-apt-repository ppa:maarten-fonville/android-studio
sudo apt update
sudo apt install android-studio
```

## Install watchman

```
wget https://github.com/facebook/watchman/releases/download/v2022.06.20.00/watchman-v2022.06.20.00-linux.zip
unzip watchman-v2022.06.20.00-linux.zip
cd watchman-v2022.06.20.00-linux
sudo mkdir -p /usr/local/{bin,lib} /usr/local/var/run/watchman
sudo cp bin/* /usr/local/bin
sudo cp lib/* /usr/local/lib
sudo chmod 755 /usr/local/bin/watchman
sudo chmod 2777 /usr/local/var/run/watchman
```

## (If in VMware linux environment)

```
sudo apt install -y open-vm-tools-desktop
sudo apt install -y qemu-kvm libvirt-bin ubuntu-vm-builder bridge-utils
sudo usermod -aG kvm $(whoami)
reboot
```

## Create Emulator (or connect Android phone and install adb)

Use the GUI of Android studio to create a new virtual device. As of 26/03/2023 we are using a Pixel 5 as template and System image Tiramisu API level 33

If using a phone, start the USB debugging mode.

Open or create `robosats/mobile/android/local.properties`:

- Add `sdk.dir = /home/<YOUR_USERNAME>/Android/Sdk`

You can check your SDK location on the GUI of Android studio: `Tools > SDK Manager`
Make sure you have NDK installed : `Tools > SDK Manager > SDK Tools > NDK (Side by Side)`

## Launch app builder and

Make sure you have the `main.js` file created on `robosats/mobile/html/Web.bundle/js`, if not, go to `robosats/frontend/`

```
npm run dev
```

Launch your emulator if you are using one:

```
cd ~/Android/Sdk/tools && ./emulator -avd <DEVICE_NAME>
```

Point a terminal to `/robosats/mobile/` to start metro

```
npm start
```

And on another terminal, also in `/robosats/mobile/`, build and install the debug app

```
npx react-native run-android
```

You can also use `react-native run-android --mode=release` to fully test the release builds of the app.

# OSX

## Install JDK

Make sure you install version 17

```
https://www.oracle.com/java/technologies/downloads
```

## Install Android Studio

Download and install https://developer.android.com/studio/index.html
Make sure you have the following libraries installed globally.

```
npm install -g react-native-cli
brew install android-platform-tools
```

Open `robosats/mobile/android` to start the first build process.

## Install watchman

Check https://github.com/facebook/watchman/releases/download or use brew:

```
brew install node
brew install watchman
```

## Create Emulator (or connect Android phone and install adb)

Use the GUI of Android studio to create a new virtual devide, make sure you add enought internal storage (>= 2 GB).
As of 11/10/2022 we are using a Pixel 5 as template and System image R API level 30 Android 11.0

Open or create `robosats/mobile/android/local.properties`:

- Add `sdk.dir = /Users/<YOUR_USERNAME>//Library/Android/sdk`
- M1 Users should also add `ndk.dir= /Users/<YOUR_USERNAME>//Library/Android/sdk/ndk/{{ndkVersion}}`

You can check your SDK location on the GUI of Android studio: `Tools > SDK Manager`
Make sure you have NDK installed : `Tools > SDK Manager > SDK Tools > NDK (Side by Side)`

## Run app

Make sure you have the `main.js` file created on `robosats/mobile/html/Web.bundle/js`, if not, go to `robosats/frontend/`

```
npm run dev
```

Point a terminal to `robosats/mobile/`

```
npx react-native run-android
```

After the build, run or debug your project on Android Studio. Alternatively, you can run the following command to check logs on terminal:

```
npx react-native log-android
```
