Tested on Ubuntu 20.04

# Install JDK
```
sudo apt update
sudo apt install default-jdk
java -version
```
# Install Android Studio
```
sudo add-apt-repository ppa:maarten-fonville/android-studio
sudo apt update
sudo apt install android-studio
```
# Install watchman
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
# (If in VMware linux environment)
```
sudo apt install -y open-vm-tools-desktop
sudo apt install -y qemu-kvm libvirt-bin ubuntu-vm-builder bridge-utils
sudo usermod -aG kvm $(whoami)
reboot
```
# Create Emulator (or connect Android phone and install adb)
Use the GUI of Android studio to create a new virtual devide. As of 23/06/2022 we are using a Pixel 5 as template and System image R API level 30 Android 11.0

If using a phone, start the USB debugging mode.

Go to /robosats/mobile/android/local.properties and add `sdk.dir = /home/USERNAME/Android/Sdk` (create the file local.properties if it does not exist)

# Launch app builder and 
Point a terminal to /robosats/mobile/
```
npm start
```
on another temrinal also in /robosats/mobile/
```
npx react-native run-android
```
