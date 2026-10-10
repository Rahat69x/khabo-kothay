"""
Khabo Kothay - Python Machine Learning Pipeline Runner
Demonstrates:
  1. Menu NLP analysis & Bengali food category extraction
  2. Multi-Armed Bandit (MAB) Thompson Sampling recommendation convergence
  3. Dhaka Fare Regression modeling for Rickshaw, CNG, and Car
"""

import sys
import json
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from bandit_recommender import BanditRecommender
from menu_nlp_analyzer import MenuNLPAnalyzer
from fare_regression import FareRegressionModel

SAMPLE_CAFES = [
    {
        "id": "c1",
        "name": "North End Coffee Roasters (Gulshan-2)",
        "rating": 4.7,
        "items": [
            {"name": "Espresso Single Shot", "price": 180, "desc": "Rich dark roast arabica beans"},
            {"name": "Cinnamon Roll Pastry", "price": 240, "desc": "Freshly baked warm pastry"},
            {"name": "Caramel Macchiato Coffee", "price": 380, "desc": "Steamed milk with vanilla and espresso caramel drizzle"},
            {"name": "Cold Brew Artisan Coffee", "price": 320, "desc": "18-hour steeped single origin beans"}
        ]
    },
    {
        "id": "c2",
        "name": "Star Kabab & Restaurant (Banani)",
        "rating": 4.5,
        "items": [
            {"name": "Kacchi Biryani Mutton", "price": 280, "desc": "Traditional Dhaka dum biryani with tender mutton and aloo"},
            {"name": "Chicken Chaap Kabab", "price": 160, "desc": "Slow cooked spicy Bengali tawa fry"},
            {"name": "Rumali Roti", "price": 25, "desc": "Soft hand-tossed thin bread"},
            {"name": "Borhani Spiced Yogurt", "price": 60, "desc": "Mint, coriander, mustard and black salt sour digestif"}
        ]
    },
    {
        "id": "c3",
        "name": "Gloria Jean's Coffees (Gulshan-1)",
        "rating": 4.2,
        "items": [
            {"name": "Signature Hot Chocolate", "price": 395, "desc": "Rich creamy Belgian chocolate"},
            {"name": "Blueberry Cheesecake Pastry", "price": 420, "desc": "New York style baked cream cheese"},
            {"name": "Club Sandwich Grilled Chicken", "price": 540, "desc": "Toasted layers with beef bacon, chicken and fries"}
        ]
    },
    {
        "id": "c4",
        "name": "Sultan's Dine (Gulshan Circle)",
        "rating": 4.8,
        "items": [
            {"name": "Shahi Kacchi Biryani Platter", "price": 450, "desc": "Basmati rice cooked with saffron, ghee, and succulent mutton"},
            {"name": "Jali Kabab", "price": 80, "desc": "Minced mutton egg-net fried patty"},
            {"name": "Firni Cardamom Dessert", "price": 70, "desc": "Cardamom aromatic rice pudding in clay pot"}
        ]
    }
]

def run_pipeline():
    print("=" * 70)
    print(" KHABO KOTHAY - PYTHON ANALYTICS & MACHINE LEARNING PIPELINE")
    print("=" * 70)

    # 1. Menu NLP & Pricing Analytics
    print("\n[1/3] Running Menu NLP & Dietary Intelligence Analyzer...")
    analyzer = MenuNLPAnalyzer()
    
    for cafe in SAMPLE_CAFES:
        analysis = analyzer.analyze_restaurant_menu(cafe["name"], cafe["items"])
        dist = analysis["price_distribution_bdt"]
        print(f"\n  Venue: {cafe['name']}")
        print(f"    - Tier: {analysis['budget_tier_label']}")
        print(f"    - Price Spread: Median = ৳{dist['median']} | Range = ৳{dist['min']} - ৳{dist['max']}")
        print(f"    - Top Categories: {[c[0] for c in analysis['top_cuisines']]}")

    # 2. Fare Regression Modeling
    print("\n[2/3] Fitting Transport Fare OLS Regression Models (Dhaka Calibrated)...")
    rickshaw_model = FareRegressionModel("rickshaw")
    r_feat, r_targ = FareRegressionModel.generate_synthetic_dhaka_fare_data("rickshaw", 120)
    rickshaw_model.fit(r_feat, r_targ)

    cng_model = FareRegressionModel("cng")
    c_feat, c_targ = FareRegressionModel.generate_synthetic_dhaka_fare_data("cng", 120)
    cng_model.fit(c_feat, c_targ)

    print(f"  Rickshaw OLS Formula: Fare = {rickshaw_model.weights[0]:.1f} + {rickshaw_model.weights[1]:.2f}*Dist(km) + {rickshaw_model.weights[2]:.2f}*Traffic")
    print(f"  Rickshaw Fit: R^2 = {rickshaw_model.r_squared:.3f}, RMSE = {rickshaw_model.rmse:.2f} BDT")
    print(f"  CNG OLS Formula:      Fare = {cng_model.weights[0]:.1f} + {cng_model.weights[1]:.2f}*Dist(km) + {cng_model.weights[2]:.2f}*Traffic")
    print(f"  CNG Fit:      R^2 = {cng_model.r_squared:.3f}, RMSE = {cng_model.rmse:.2f} BDT")

    # Sample Fare Quotes
    sample_dist = 2.4 # km
    sample_traffic = 1.8 # moderate rush
    r_est = rickshaw_model.predict(sample_dist, sample_traffic)
    c_est = cng_model.predict(sample_dist, sample_traffic)
    print(f"  -> Journey Estimate (2.4 km in Moderate Traffic): Rickshaw = ৳{r_est} | CNG = ৳{c_est}")

    # 3. Multi-Armed Bandit (MAB) Simulation
    print("\n[3/3] Simulating Multi-Armed Bandit Thompson Sampling (500 user turns)...")
    mab = BanditRecommender(epsilon=0.10)
    cafe_ids = [c["id"] for c in SAMPLE_CAFES]
    
    # Register arms with initial community priors
    for cafe in SAMPLE_CAFES:
        mab.register_place(cafe["id"], cafe["rating"])

    # True latent user conversion probabilities (unknown to agent initially)
    true_conversion = {
        "c1": 0.65, # North End (High quality coffee)
        "c2": 0.72, # Star Kabab (Budget favorite)
        "c3": 0.45, # Gloria Jean's
        "c4": 0.85  # Sultan's Dine (Crowd favorite)
    }

    random.seed(101)
    selections = {cid: 0 for cid in cafe_ids}
    total_conversions = 0

    for _ in range(500):
        chosen_id = mab.select_arm_thompson(cafe_ids)
        selections[chosen_id] += 1
        
        # User converts based on latent satisfaction probability
        did_order = 1.0 if random.random() < true_conversion[chosen_id] else 0.0
        total_conversions += int(did_order)
        mab.update_feedback(chosen_id, did_order)

    print(f"  Simulation completed with {total_conversions}/500 successful recommendations ({total_conversions/500*100:.1f}% conversion).")
    print("  Arm Pull Distribution (Converging to highest conversion spots):")
    for cafe in SAMPLE_CAFES:
        cid = cafe["id"]
        arm = mab.arms[cid]
        print(f"    - {cafe['name']:<35} : {selections[cid]:>3} pulls | Est Reward: {arm['mean_reward']:.2f} | Latent: {true_conversion[cid]}")

    print("\n" + "=" * 70)
    print(" [OK] Python ML & Analytics Pipeline Execution Succeeded!")
    print("=" * 70)

if __name__ == "__main__":
    run_pipeline()
