package com.khabokothay.app.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class CrashReporterTest {

    @Test
    public void sanitize_redactsSecretsAndPii() {
        String raw = "Exception with AIzaSyD3x949219391039401934910394910 and Bearer secret_token_xyz for test@example.com";
        String clean = CrashReporter.sanitize(raw);
        assertFalse(clean.contains("AIzaSyD"));
        assertFalse(clean.contains("secret_token_xyz"));
        assertFalse(clean.contains("test@example.com"));
        assertTrue(clean.contains("[REDACTED_API_KEY]"));
        assertTrue(clean.contains("[REDACTED_SECRET]"));
        assertTrue(clean.contains("[REDACTED_EMAIL]"));
    }
}
