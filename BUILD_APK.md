# Building APK for Flatmates App

This guide provides instructions for building an APK for the Flatmates app.

## Prerequisites

- Node.js and npm installed
- For local builds: Android Studio and Java Development Kit (JDK)
- For cloud builds: Expo EAS account

---

## Option 1: EAS Build (Recommended - Cloud-based)

This is the easiest method and doesn't require local Android setup.

### Steps:

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   cd mobile
   eas login
   ```

3. **Configure EAS** (if first time):
   ```bash
   eas build:configure
   ```

4. **Build APK** - Choose one of these profiles:

   **Development Build** (for testing with development features):
   ```bash
   eas build --platform android --profile development
   ```

   **Preview Build** (for internal testing):
   ```bash
   eas build --platform android --profile preview
   ```

   **Production Build** (for release):
   ```bash
   eas build --platform android --profile production
   ```

5. The build will run in the cloud and provide a download link when complete.

---

## Option 2: Local Build

This option requires Android development tools installed locally.

### Prerequisites:

1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Set up environment variables**:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Steps:

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Prebuild native Android project**:
   ```bash
   npx expo prebuild --platform android
   ```

4. **Build the APK**:

   **Debug APK** (for development):
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

   **Release APK** (for production):
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   APK location: `android/app/build/outputs/apk/release/app-release.apk`

   Note: Release builds require signing configuration. See "Setting up Signing" below.

---

## Option 3: Quick Local Debug Build (In Container)

If you're in a development container with all tools installed:

```bash
cd mobile
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

The APK will be at: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Setting up Signing for Release Builds

To create a signed release APK:

1. **Generate a keystore**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore flatmates-release.keystore \
     -alias flatmates -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Create `android/gradle.properties`** (or add to existing):
   ```properties
   MYAPP_RELEASE_STORE_FILE=flatmates-release.keystore
   MYAPP_RELEASE_KEY_ALIAS=flatmates
   MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
   MYAPP_RELEASE_KEY_PASSWORD=your_key_password
   ```

3. **Update `android/app/build.gradle`** to include signing config:
   ```gradle
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                   storeFile file(MYAPP_RELEASE_STORE_FILE)
                   storePassword MYAPP_RELEASE_STORE_PASSWORD
                   keyAlias MYAPP_RELEASE_KEY_ALIAS
                   keyPassword MYAPP_RELEASE_KEY_PASSWORD
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               ...
           }
       }
   }
   ```

---

## Current EAS Build Configuration

The app is already configured with three build profiles in `eas.json`:

- **development**: Development build with debugging enabled (APK)
- **preview**: Internal testing build (APK)
- **production**: Production release build (APK)

All profiles are configured to generate APK files (not AAB).

---

## Troubleshooting

### "Android SDK not found"
- Install Android Studio and set up ANDROID_HOME environment variable

### "JAVA_HOME not set"
- Install JDK 17 and set JAVA_HOME environment variable

### Build fails with memory issues
- Increase JVM heap size in `android/gradle.properties`:
  ```properties
  org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
  ```

### Google Sign-In issues
- Ensure you've configured OAuth credentials in Google Cloud Console
- Update the Google Services configuration file if needed

---

## Next Steps

After building:
1. Transfer the APK to your Android device
2. Enable "Install from Unknown Sources" in device settings
3. Install the APK
4. Test the application

For Play Store distribution, you'll need:
- Signed release APK/AAB
- Privacy policy and terms of service (already available in repo)
- App screenshots and promotional materials
- Developer account registration
