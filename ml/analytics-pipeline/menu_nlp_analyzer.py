"""
Khabo Kothay - Python NLP Menu Analyzer
Parses menu text, classifies Dhaka food keywords, calculates price quartiles, and detects dietary tags.
"""

import re
import math
from typing import Dict, List, Any, Optional

# Food category token patterns
CATEGORY_PATTERNS = {
    'Biriyani': [r'biriyani', r'kacchi', r'polao', r'tehari', r'khichuri', r'morog polao'],
    'Kabab': [r'kabab', r'kebab', r'sheekh', r'tikka', r'boti', r'reshmi', r'chaap', r'grill'],
    'Cafe': [r'coffee', r'espresso', r'cappuccino', r'latte', r'croissant', r'pastry', r'cheesecake'],
    'Burger': [r'burger', r'patty', r'slider', r'fries', r'cheeseburger'],
    'Japanese': [r'sushi', r'sashimi', r'ramen', r'udon', r'tempura', r'teriyaki', r'bento', r'maki'],
    'Dessert': [r'waffle', r'pancake', r'ice cream', r'cake', r'brownie', r'parfait', r'falooda'],
    'Bengali': [r'bhorta', r'macher jhol', r'rui', r'hilsa', r'ilish', r'daal', r'shorshe'],
    'Chinese': [r'chowmein', r'fried rice', r'dumpling', r'wonton', r'soup', r'manchurian']
}

DIETARY_PATTERNS = {
    'halal': [r'halal', r'beef', r'mutton', r'chicken', r'lamb', r'kebab', r'biriyani'],
    'vegetarian': [r'veg', r'paneer', r'salad', r'mushroom', r'daal', r'vegetable', r'tofu'],
    'vegan': [r'vegan', r'plant-based', r'dairy-free', r'tofu', r'salad'],
    'no_beef': [r'chicken', r'mutton', r'fish', r'prawn', r'shrimp', r'vegetarian']
}

class MenuNLPAnalyzer:
    def __init__(self):
        pass

    def extract_categories(self, text: str) -> List[str]:
        """Detects matched culinary categories from dish title or description."""
        text_lower = text.lower()
        matched = []
        for category, patterns in CATEGORY_PATTERNS.items():
            for pat in patterns:
                if re.search(r'\b' + pat + r'\b', text_lower):
                    matched.append(category)
                    break
        return matched or ['General']

    def detect_dietary_flags(self, title: str, description: str = "") -> Dict[str, bool]:
        """Detects dietary certifications and attributes."""
        combined = f"{title} {description}".lower()
        has_beef = bool(re.search(r'\bbeef\b', combined))

        return {
            'is_halal': True, # Default assumed Halal for local Dhaka non-pork outlets
            'is_veg': bool(re.search(r'\b(veg|vegetarian|paneer|mushroom)\b', combined)),
            'is_vegan': bool(re.search(r'\bvegan\b', combined)),
            'is_no_beef': not has_beef
        }

    def compute_price_distribution(self, menu_items: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Computes price metrics across menu items in BDT (min, median, max, average, IQR).
        """
        prices = [float(item['price']) for item in menu_items if 'price' in item and float(item['price']) > 0]
        if not prices:
            return {'count': 0, 'min': 0, 'median': 0, 'max': 0, 'avg': 0, 'p25': 0, 'p75': 0}

        prices.sort()
        n = len(prices)

        def percentile(p):
            idx = (n - 1) * p
            low = math.floor(idx)
            high = math.ceil(idx)
            if low == high:
                return prices[int(idx)]
            return prices[low] * (high - idx) + prices[high] * (idx - low)

        return {
            'count': n,
            'min': round(prices[0], 2),
            'p25': round(percentile(0.25), 2),
            'median': round(percentile(0.50), 2),
            'p75': round(percentile(0.75), 2),
            'max': round(prices[-1], 2),
            'avg': round(sum(prices) / n, 2)
        }

    def analyze_restaurant_menu(self, restaurant_name: str, menu_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Performs end-to-end NLP and statistical extraction on a restaurant's menu."""
        category_counts: Dict[str, int] = {}
        for item in menu_items:
            cats = self.extract_categories(item.get('name', ''))
            for c in cats:
                category_counts[c] = category_counts.get(c, 0) + 1

        dist = self.compute_price_distribution(menu_items)

        # Budget tier classification (1 to 4)
        med = dist['median']
        if med <= 350:
            tier = 1
            tier_label = "৳ (Budget Friendly)"
        elif med <= 900:
            tier = 2
            tier_label = "৳৳ (Mid-Range Casual)"
        elif med <= 1800:
            tier = 3
            tier_label = "৳৳৳ (Upscale Dining)"
        else:
            tier = 4
            tier_label = "৳৳৳৳ (Fine Dining Luxury)"

        return {
            'restaurant_name': restaurant_name,
            'total_dishes': len(menu_items),
            'price_distribution_bdt': dist,
            'budget_tier': tier,
            'budget_tier_label': tier_label,
            'top_cuisines': sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        }
