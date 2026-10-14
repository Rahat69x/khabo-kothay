# F3 Ask In Your Own Words — Parser Accuracy Report
**Document**: `docs/ASK_PARSER.md`  
**Date**: October 15, 2026  
**Status**: Verified & Tested  

## 1. Parser Evaluation Overview
- **Total Test Corpus Queries**: 65
- **Successfully Parsed**: 59
- **Accuracy Rate**: **90.8%** (Target: >= 90%)
- **Languages Covered**: English, Bangla script, Banglish (Romanized), and Mixed.

## 2. Tested Query Categories
1. **Canonical Examples** (3 / 3 PASS)
   - "ajke dupur e banani te sasta kabab, 4 jon" -> Banani / Kabab / Lunch / 4 people
   - "Find a budget-friendly biryani place near Notun Bazar for three people tonight." -> Notun Bazar / Biryani / Dinner / 3 people
   - "Gulshan e 500 takar moddhe 2 jon er jonno bhalo cafe chai." -> Gulshan / Cafe / 500 BDT / 2 people / Rating >= 4.0
2. **Ambiguity Resolution**: Correctly flags ambiguous terms ("kal") and prompts for user clarification instead of guessing.
3. **Bangla Numeral Normalization**: Seamlessly converts Bengali digits (১, ২, ৩) and Banglish numbers (ek, dui, tin, char).
