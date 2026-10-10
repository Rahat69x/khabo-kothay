package com.khabokothay.app.core;

import org.junit.Test;
import static org.junit.Assert.*;

public class BengaliFormatterTest {
    @Test
    public void testBanglaDigitsConversion() {
        assertEquals("১২৩৪৫৬৭৮৯০", BengaliFormatter.toBanglaDigits("1234567890"));
        assertEquals("৫০০", BengaliFormatter.toBanglaDigits(500));
    }

    @Test
    public void testFormatBdt() {
        assertEquals("৳৫০০", BengaliFormatter.formatBdt(500, true));
        assertEquals("৳500", BengaliFormatter.formatBdt(500, false));
    }
}
