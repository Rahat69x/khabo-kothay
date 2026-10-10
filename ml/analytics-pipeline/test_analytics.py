"""
Khabo Kothay - Python Machine Learning Pipeline Test Suite
Tests for:
  - BanditRecommender (Thompson Sampling & Epsilon-Greedy)
  - MenuNLPAnalyzer (Tokenization, Price Analytics & Dietary Recognition)
  - FareRegressionModel & MatrixOps (OLS Matrix Algebra & Fare Predictions)
"""

import unittest
from bandit_recommender import BanditRecommender
from menu_nlp_analyzer import MenuNLPAnalyzer
from fare_regression import FareRegressionModel, MatrixOps

class TestBanditRecommender(unittest.TestCase):
    def setUp(self):
        self.bandit = BanditRecommender(epsilon=0.20, decay=0.90)

    def test_arm_registration_and_priors(self):
        self.bandit.register_place("cafe_1", initial_rating=4.5)
        arm = self.bandit.arms["cafe_1"]
        self.assertGreater(arm["alpha"], arm["beta"])
        self.assertEqual(arm["pulls"], 0)
        self.assertAlmostEqual(arm["mean_reward"], 0.9, places=2)

    def test_thompson_selection(self):
        self.bandit.register_place("cafe_high", initial_rating=4.9)
        self.bandit.register_place("cafe_low", initial_rating=1.5)
        
        # Over 50 pulls, cafe_high should be sampled substantially more often
        counts = {"cafe_high": 0, "cafe_low": 0}
        for _ in range(50):
            chosen = self.bandit.select_arm_thompson(["cafe_high", "cafe_low"])
            counts[chosen] += 1
        
        self.assertGreater(counts["cafe_high"], counts["cafe_low"])

    def test_feedback_learning_update(self):
        self.bandit.register_place("c1", initial_rating=3.0)
        initial_alpha = self.bandit.arms["c1"]["alpha"]
        
        # Record positive reward
        self.bandit.update_feedback("c1", reward=1.0)
        self.assertEqual(self.bandit.arms["c1"]["pulls"], 1)
        self.assertAlmostEqual(self.bandit.arms["c1"]["alpha"], initial_alpha + 1.0)

    def test_rank_candidates(self):
        candidates = [
            {"id": "c1", "name": "Place 1", "rating": 4.8},
            {"id": "c2", "name": "Place 2", "rating": 3.0}
        ]
        ranked = self.bandit.rank_candidates(candidates, top_k=2)
        self.assertEqual(len(ranked), 2)
        self.assertIn("bandit_score", ranked[0])


class TestMenuNLPAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = MenuNLPAnalyzer()

    def test_category_extraction(self):
        cats_biryani = self.analyzer.extract_categories("Shahi Kacchi Biriyani with Mutton")
        self.assertIn("Biriyani", cats_biryani)

        cats_coffee = self.analyzer.extract_categories("Artisan Espresso with warm croissant")
        self.assertIn("Cafe", cats_coffee)

    def test_dietary_flag_detection(self):
        veg_dish = self.analyzer.detect_dietary_flags("Paneer Butter Masala", "Cottage cheese in rich tomato gravy")
        self.assertTrue(veg_dish["is_veg"])
        self.assertTrue(veg_dish["is_no_beef"])

        beef_dish = self.analyzer.detect_dietary_flags("Kala Bhuna Beef", "Slow cooked dark beef roast")
        self.assertFalse(beef_dish["is_no_beef"])

    def test_price_distribution_and_tiers(self):
        items = [
            {"name": "Chai", "price": 40},
            {"name": "Samosa", "price": 30},
            {"name": "Kabab", "price": 120},
            {"name": "Biryani", "price": 280}
        ]
        dist = self.analyzer.compute_price_distribution(items)
        self.assertEqual(dist["count"], 4)
        self.assertEqual(dist["min"], 30.0)
        self.assertEqual(dist["max"], 280.0)
        self.assertGreater(dist["avg"], 0)

        report = self.analyzer.analyze_restaurant_menu("Budget Corner", items)
        self.assertEqual(report["budget_tier"], 1)
        self.assertIn("top_cuisines", report)


class TestFareRegression(unittest.TestCase):
    def test_matrix_operations(self):
        a = [[1.0, 2.0], [3.0, 4.0]]
        b = [[2.0, 0.0], [1.0, 2.0]]
        mult = MatrixOps.matmul(a, b)
        self.assertEqual(mult[0][0], 4.0)
        self.assertEqual(mult[0][1], 4.0)
        self.assertEqual(mult[1][0], 10.0)
        self.assertEqual(mult[1][1], 8.0)

        inv_a = MatrixOps.invert_2x2(a)
        identity = MatrixOps.matmul(a, inv_a)
        self.assertAlmostEqual(identity[0][0], 1.0, places=4)
        self.assertAlmostEqual(identity[1][1], 1.0, places=4)
        self.assertAlmostEqual(identity[0][1], 0.0, places=4)

    def test_model_fit_and_prediction(self):
        model = FareRegressionModel("rickshaw")
        features, targets = FareRegressionModel.generate_synthetic_dhaka_fare_data("rickshaw", 100)
        model.fit(features, targets)
        
        self.assertTrue(model.is_fitted)
        self.assertGreater(model.r_squared, 0.80)
        self.assertLess(model.rmse, 15.0)

        # Longer distance in higher traffic should produce higher fare
        fare_short = model.predict(distance_km=1.0, traffic_index=1.0)
        fare_long = model.predict(distance_km=4.0, traffic_index=2.0)
        self.assertGreater(fare_long, fare_short)
        self.assertGreaterEqual(fare_short, 25.0) # Base fare minimum

if __name__ == "__main__":
    unittest.main()
