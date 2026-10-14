package com.khabokothay.app.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class PayMeLineHelperTest {

    @Test
    public void isValidBangladeshMobile_validatesLocalAndInternationalFormats() {
        assertTrue(PayMeLineHelper.isValidBangladeshMobile("01711223344"));
        assertTrue(PayMeLineHelper.isValidBangladeshMobile("+8801812345678"));
        assertTrue(PayMeLineHelper.isValidBangladeshMobile("8801912345678"));
        assertTrue(PayMeLineHelper.isValidBangladeshMobile("01311223344"));
        assertTrue(PayMeLineHelper.isValidBangladeshMobile("01411223344"));

        assertFalse(PayMeLineHelper.isValidBangladeshMobile("01111223344")); // invalid operator prefix
        assertFalse(PayMeLineHelper.isValidBangladeshMobile("0171122334"));  // too short
        assertFalse(PayMeLineHelper.isValidBangladeshMobile("017112233445")); // too long
        assertFalse(PayMeLineHelper.isValidBangladeshMobile("not-a-number"));
        assertFalse(PayMeLineHelper.isValidBangladeshMobile(null));
    }

    @Test
    public void normalizeNumber_stripsCountryPrefix() {
        assertEquals("01711223344", PayMeLineHelper.normalizeNumber("+8801711223344"));
        assertEquals("01812345678", PayMeLineHelper.normalizeNumber("8801812345678"));
        assertEquals("01912345678", PayMeLineHelper.normalizeNumber("01912345678"));
    }

    @Test
    public void formatPayMeLine_formatsCorrectShareMessage() {
        String msg = PayMeLineHelper.formatPayMeLine("bKash", "01711223344", 450);
        assertTrue(msg.contains("bKash"));
        assertTrue(msg.contains("01711223344"));
        assertTrue(msg.contains("৪৫০")); // Bengali digits for 450
    }
}
