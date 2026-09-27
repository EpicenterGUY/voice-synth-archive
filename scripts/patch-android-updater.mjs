import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const root=process.cwd();
const pkg=JSON.parse(await readFile(join(root,"package.json"),"utf8"));
const config=JSON.parse(await readFile(join(root,"capacitor.config.json"),"utf8"));
const appId=String(config.appId||"app.vocadive.mobile");
const version=String(pkg.version||"0.0.0");
const parts=version.split(".").map(x=>Number(x)||0);
const versionCode=(parts[0]||0)*1000000+(parts[1]||0)*1000+(parts[2]||0);
const javaDir=join(root,"android","app","src","main","java",...appId.split("."));
const mainActivity=join(javaDir,"MainActivity.java");
const pluginFile=join(javaDir,"VocaDiveUpdaterPlugin.java");
const manifestPath=join(root,"android","app","src","main","AndroidManifest.xml");
const pathsFile=join(root,"android","app","src","main","res","xml","vocadive_update_paths.xml");
const gradlePath=join(root,"android","app","build.gradle");

await mkdir(javaDir,{recursive:true});
await mkdir(dirname(pathsFile),{recursive:true});

const activity=`package ${appId};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VocaDiveUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;
await writeFile(mainActivity,activity);

const plugin=`package ${appId};

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "VocaDiveUpdater")
public class VocaDiveUpdaterPlugin extends Plugin {
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject out = new JSObject();
            out.put("packageName", getContext().getPackageName());
            out.put("versionName", info.versionName == null ? "" : info.versionName);
            long code = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
            out.put("versionCode", code);
            out.put("debuggable", (getContext().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("APP_INFO_FAILED", e);
        }
    }

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        boolean allowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject out = new JSObject();
        out.put("allowed", allowed);
        call.resolve(out);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                getActivity().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("INSTALL_SETTINGS_FAILED", e);
        }
    }

    @PluginMethod
    public void download(PluginCall call) {
        final String url = call.getString("url", "");
        final String expectedSha = call.getString("sha256", "");
        final String requestedName = call.getString("fileName", "VocaDive-update.apk");

        if (url == null || !url.toLowerCase(Locale.ROOT).startsWith("https://")) {
            call.reject("HTTPS_URL_REQUIRED");
            return;
        }

        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                File base = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (base == null) {
                    base = new File(getContext().getCacheDir(), "updates");
                }
                if (!base.exists() && !base.mkdirs()) {
                    throw new IllegalStateException("업데이트 저장 폴더를 만들 수 없습니다.");
                }

                String safeName = requestedName.replaceAll("[^A-Za-z0-9._-]", "_");
                if (!safeName.toLowerCase(Locale.ROOT).endsWith(".apk")) safeName += ".apk";
                File target = new File(base, safeName);
                File temp = new File(base, safeName + ".part");
                if (temp.exists()) temp.delete();

                URL current = new URL(url);
                int redirects = 0;
                while (true) {
                    conn = (HttpURLConnection) current.openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("Accept", "application/vnd.android.package-archive,application/octet-stream,*/*");
                    conn.setRequestProperty("User-Agent", "VocaDive-Android-Updater/${version}");
                    conn.setInstanceFollowRedirects(false);
                    int code = conn.getResponseCode();
                    if (code >= 300 && code < 400) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location == null || ++redirects > 8) throw new IllegalStateException("업데이트 다운로드 리디렉션 실패");
                        current = new URL(current, location);
                        continue;
                    }
                    if (code < 200 || code >= 300) throw new IllegalStateException("HTTP " + code);
                    break;
                }

                long total = conn.getContentLengthLong();
                long done = 0;
                long lastEmit = 0;
                MessageDigest digest = MessageDigest.getInstance("SHA-256");

                try (BufferedInputStream in = new BufferedInputStream(conn.getInputStream());
                     FileOutputStream out = new FileOutputStream(temp)) {
                    byte[] buffer = new byte[64 * 1024];
                    int n;
                    while ((n = in.read(buffer)) >= 0) {
                        if (n == 0) continue;
                        out.write(buffer, 0, n);
                        digest.update(buffer, 0, n);
                        done += n;
                        long now = System.currentTimeMillis();
                        if (now - lastEmit >= 180 || (total > 0 && done >= total)) {
                            lastEmit = now;
                            JSObject progress = new JSObject();
                            progress.put("bytes", done);
                            progress.put("total", total);
                            progress.put("percent", total > 0 ? Math.min(100, Math.round(done * 100.0 / total)) : -1);
                            notifyListeners("downloadProgress", progress);
                        }
                    }
                    out.getFD().sync();
                }

                String actualSha = hex(digest.digest());
                if (expectedSha != null && !expectedSha.trim().isEmpty() && !actualSha.equalsIgnoreCase(expectedSha.trim())) {
                    temp.delete();
                    throw new SecurityException("SHA256_MISMATCH");
                }

                if (target.exists()) target.delete();
                if (!temp.renameTo(target)) {
                    try (FileInputStream in = new FileInputStream(temp);
                         FileOutputStream out = new FileOutputStream(target)) {
                        byte[] buffer = new byte[64 * 1024];
                        int n;
                        while ((n = in.read(buffer)) >= 0) if (n > 0) out.write(buffer, 0, n);
                    }
                    temp.delete();
                }

                JSObject result = new JSObject();
                result.put("path", target.getAbsolutePath());
                result.put("sha256", actualSha);
                result.put("bytes", target.length());
                getActivity().runOnUiThread(() -> call.resolve(result));
            } catch (Exception e) {
                getActivity().runOnUiThread(() -> call.reject("DOWNLOAD_FAILED: " + e.getMessage(), e));
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    @PluginMethod
    public void install(PluginCall call) {
        final String path = call.getString("path", "");
        if (path == null || path.trim().isEmpty()) {
            call.reject("APK_PATH_REQUIRED");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    && !getContext().getPackageManager().canRequestPackageInstalls()) {
                JSObject out = new JSObject();
                out.put("launched", false);
                out.put("permissionRequired", true);
                call.resolve(out);
                return;
            }

            File apk = new File(path);
            if (!apk.exists() || !apk.isFile()) {
                call.reject("APK_NOT_FOUND");
                return;
            }

            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                apk
            );

            Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
            intent.putExtra(Intent.EXTRA_RETURN_RESULT, false);

            if (intent.resolveActivity(getContext().getPackageManager()) == null) {
                intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            }

            getContext().startActivity(intent);
            JSObject out = new JSObject();
            out.put("launched", true);
            out.put("permissionRequired", false);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("INSTALL_LAUNCH_FAILED", e);
        }
    }

    private static String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format(Locale.ROOT, "%02x", b & 0xff));
        return sb.toString();
    }
}
`;
await writeFile(pluginFile,plugin);

let manifest=await readFile(manifestPath,"utf8");
if(!manifest.includes("android.permission.REQUEST_INSTALL_PACKAGES")){
  manifest=manifest.replace(
    "</manifest>",
    '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n</manifest>'
  );
}
if(!manifest.includes(appId+".fileprovider") && !manifest.includes('${applicationId}.fileprovider')){
  const provider=`
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/vocadive_update_paths" />
        </provider>
`;
  manifest=manifest.replace("</application>",provider+"    </application>");
}
await writeFile(manifestPath,manifest);

await writeFile(pathsFile,`<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="vocadive_updates" path="Download/" />
    <cache-path name="vocadive_update_cache" path="updates/" />
</paths>
`);

let gradle=await readFile(gradlePath,"utf8");
gradle=gradle.replace(/versionCode\s+\d+/, "versionCode "+versionCode);
gradle=gradle.replace(/versionName\s+["'][^"']+["']/, 'versionName "'+version+'"');
await writeFile(gradlePath,gradle);

console.log(JSON.stringify({
  appId,
  version,
  versionCode,
  plugin:pluginFile,
  manifest:manifestPath
},null,2));
