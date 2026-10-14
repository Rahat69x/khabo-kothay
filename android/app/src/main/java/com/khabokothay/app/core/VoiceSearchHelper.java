package com.khabokothay.app.core;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.util.Locale;

/**
 * F3: Voice Input Helper.
 * Checks microphone permissions explicitly on tap, configures bilingual speech recognition
 * (Bangla & English), and returns transcribed text for user editing before submission.
 */
public final class VoiceSearchHelper {
    public static final int REQUEST_CODE_SPEECH = 101;
    public static final int REQUEST_CODE_MIC_PERMISSION = 102;

    private VoiceSearchHelper() {}

    public static boolean hasMicrophonePermission(Context context) {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    public static void requestMicrophonePermission(Activity activity) {
        ActivityCompat.requestPermissions(
            activity,
            new String[]{Manifest.permission.RECORD_AUDIO},
            REQUEST_CODE_MIC_PERMISSION
        );
    }

    public static Intent createSpeechIntent(String promptText) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "bn-BD");
        intent.putExtra(RecognizerIntent.EXTRA_SUPPORTED_LANGUAGES, new String[]{"bn-BD", "en-US"});
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, promptText != null ? promptText : "খাবারের কথা বলুন (Speak what you want to eat)");
        return intent;
    }
}
