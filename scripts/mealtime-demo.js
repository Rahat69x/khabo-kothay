#!/usr/bin/env node
/**
 * scripts/mealtime-demo.js
 * Demonstrates Meal-Time Mode for a 45-minute lunch in Gulshan, Dhaka using mock data.
 * Displays segmented time bars, feasibility status, 'Back by' clock time, and plain language trade-offs.
 */

import { searchMealTime } from '../server/services/mealtime.js';

async function runDemo() {
  console.log('================================================================');
  console.log('    Khabo Kothay? (খাবো কোথায়?) — Meal-Time Mode Demo (Day 1)   ');
  console.log('================================================================\n');

  const origin = { lat: 23.7785, lng: 90.4178, name: 'Gulshan 1 Circle' };
  const availableMinutes = 45;
  const mode = 'lunch';
  
  // Set demo leave time to 1:00 PM lunch hour (or current time if already lunch hours)
  const leaveAtDate = new Date();
  const currentHour = leaveAtDate.getHours();
  if (currentHour < 11 || currentHour > 15) {
    leaveAtDate.setHours(13, 0, 0, 0);
  }

  console.log(`📍 Origin: ${origin.name} (${origin.lat}, ${origin.lng})`);
  console.log(`⏱️ Available Time: ${availableMinutes} minutes`);
  console.log(`🍽️ Mode: ${mode.toUpperCase()} (Office-friendly quick dining)`);
  console.log(`🕒 Planned Departure: ${leaveAtDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`);
  console.log(`🚗 Transport: Personal Car (Traffic-aware + parking buffer)`);
  console.log(`🛡️ Buffer Preference: Balanced (1.0x buffer multiplier)\n`);

  try {
    const result = await searchMealTime({
      mode,
      availableMinutes,
      leaveAt: leaveAtDate.toISOString(),
      origin,
      destination: 'same-as-origin',
      transport: 'car',
      diningStyle: 'dine_in',
      bufferPreference: 'Balanced'
    });

    console.log(`📋 Summary: ${result.summary.message}`);
    console.log(`----------------------------------------------------------------\n`);

    if (result.results.length === 0) {
      console.log('⚠️ No feasible options found within time limit!');
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\n💡 Computed Alternatives:');
        result.suggestions.forEach(s => console.log(`   • ${s.label}`));
      }
      return;
    }

    result.results.forEach((r, idx) => {
      const tb = r.timeBreakdown;
      const statusIcon = r.status === 'SAFE' ? '🟢 SAFE' : r.status === 'TIGHT' ? '🟡 TIGHT' : '🔴 NOT RECOMMENDED';
      
      console.log(`[#${idx + 1}] ${r.name} (${r.cuisine || 'Various'}) — ${statusIcon}`);
      console.log(`    Rating: ${r.rating}★ (${r.userRatingCount}+ reviews) | Price: ${r.priceLevel ? '৳'.repeat(r.priceLevel) : '৳৳'}`);
      console.log(`    ⏰ Time Breakdown: Total ${tb.total}m / ${r.availableMinutes}m available (Spare: ${tb.spareMinutes}m)`);
      console.log(`       [Outbound: ${tb.outbound}m | Wait: ${tb.wait}m | Eat: ${tb.eat}m | Return: ${tb.return}m | Buffer: ${tb.buffer}m]`);
      console.log(`    🏁 Back by: ${r.backByTime} | Open check: ${r.openCheck.openAtArrival ? `Open until ${r.openCheck.closesAt}` : 'Closed'}`);
      console.log(`    💬 Reason: "${r.reasons[0]}"`);
      if (r.flags && r.flags.length > 0) {
        console.log(`    🚩 Flags: [${r.flags.join(', ')}]`);
      }
      console.log('');
    });

    if (result.flexibleResults && result.flexibleResults.length > 0) {
      console.log(`\n⏳ Slightly Over Your Time (+1 to +5 min) [Flexible buffer]:`);
      result.flexibleResults.forEach(r => {
        console.log(`   • ${r.name}: Takes ${r.timeBreakdown.total} min (${Math.abs(r.spareMinutes)} min over)`);
      });
    }

    console.log('================================================================');
    console.log('✓ Demo completed successfully.');
  } catch (err) {
    console.error('Error running demo:', err);
  }
}

runDemo();
