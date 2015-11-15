rm -f dist/pantauharga.apk &&
cordova build --release android &&
$JAVA_HOME/bin/jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/keystore/pantauharga.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk pantauharga &&
$ANDROID_HOME/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk dist/pantauharga.apk
