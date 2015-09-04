rm dist/pantauharga.apk ||
cordova build --release android &&
/c/Program\ Files/Java/jdk1.7.0_67/bin/jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk alias_name &&
/c/Android/sdk/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk dist/pantauharga.apk
