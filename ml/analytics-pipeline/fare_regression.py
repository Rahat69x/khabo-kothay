"""
Khabo Kothay - Python Machine Learning Pipeline
Ordinary Least Squares (OLS) & Polynomial Regression for Dhaka Transport Fare Modeling
"""

import math
from typing import List, Tuple, Dict, Any, Optional

class MatrixOps:
    """Lightweight 2D matrix operations using pure Python standard library."""

    @staticmethod
    def transpose(matrix: List[List[float]]) -> List[List[float]]:
        rows = len(matrix)
        cols = len(matrix[0])
        return [[matrix[r][c] for r in range(rows)] for c in range(cols)]

    @staticmethod
    def matmul(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
        rows_a, cols_a = len(a), len(a[0])
        rows_b, cols_b = len(b), len(b[0])
        if cols_a != rows_b:
            raise ValueError(f"Matrix dimension mismatch: ({rows_a}x{cols_a}) and ({rows_b}x{cols_b})")
        
        result = [[0.0 for _ in range(cols_b)] for _ in range(rows_a)]
        for i in range(rows_a):
            for k in range(cols_a):
                r_ik = a[i][k]
                for j in range(cols_b):
                    result[i][j] += r_ik * b[k][j]
        return result

    @staticmethod
    def invert_2x2(m: List[List[float]]) -> List[List[float]]:
        det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
        if abs(det) < 1e-12:
            raise ValueError("Singular matrix cannot be inverted.")
        inv_det = 1.0 / det
        return [
            [m[1][1] * inv_det, -m[0][1] * inv_det],
            [-m[1][0] * inv_det, m[0][0] * inv_det]
        ]

    @staticmethod
    def invert_3x3(m: List[List[float]]) -> List[List[float]]:
        det = (
            m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
            m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
            m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
        )
        if abs(det) < 1e-12:
            raise ValueError("Singular 3x3 matrix cannot be inverted.")
        inv_det = 1.0 / det
        
        return [
            [
                (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * inv_det,
                (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * inv_det,
                (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * inv_det
            ],
            [
                (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * inv_det,
                (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * inv_det,
                (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * inv_det
            ],
            [
                (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * inv_det,
                (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * inv_det,
                (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * inv_det
            ]
        ]


class FareRegressionModel:
    """
    Multivariate linear regression model calibrated for Dhaka transportation modes.
    Features: [1 (bias), distance_km, traffic_congestion_index]
    Target: estimated fare in BDT
    """

    def __init__(self, mode_name: str = "rickshaw"):
        self.mode_name = mode_name.lower()
        self.weights: List[float] = [] # [bias, w_dist, w_traffic]
        self.is_fitted = False
        self.rmse = 0.0
        self.r_squared = 0.0

    def fit(self, features: List[Tuple[float, float]], targets: List[float]):
        """
        Fits weights via analytical Normal Equation: beta = (X^T * X)^(-1) * X^T * y
        features: list of (distance_km, traffic_index)
        targets: list of actual fare in BDT
        """
        n = len(features)
        if n < 3:
            raise ValueError("At least 3 observations are required for 3-parameter multivariate fit.")

        # Construct Design Matrix X (n x 3)
        X = [[1.0, feat[0], feat[1]] for feat in features]
        # Construct Target Vector Y (n x 1)
        Y = [[t] for t in targets]

        X_T = MatrixOps.transpose(X)
        XTX = MatrixOps.matmul(X_T, X)
        XTX_inv = MatrixOps.invert_3x3(XTX)
        XTY = MatrixOps.matmul(X_T, Y)
        beta = MatrixOps.matmul(XTX_inv, XTY)

        self.weights = [beta[i][0] for i in range(3)]
        self.is_fitted = True

        # Calculate metrics
        y_mean = sum(targets) / n
        ss_tot = sum((y - y_mean) ** 2 for y in targets)
        ss_res = 0.0

        for i in range(n):
            pred = self.predict(features[i][0], features[i][1])
            ss_res += (targets[i] - pred) ** 2

        self.rmse = math.sqrt(ss_res / n)
        self.r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-9 else 1.0

    def predict(self, distance_km: float, traffic_index: float) -> float:
        """Predicts expected fare in BDT for a given distance and congestion factor."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before running predictions.")
        raw_val = self.weights[0] + self.weights[1] * distance_km + self.weights[2] * traffic_index
        # Fare cannot drop below base minimum fare in Dhaka
        base_min = 25.0 if self.mode_name == "rickshaw" else (60.0 if self.mode_name == "cng" else 100.0)
        return max(base_min, round(raw_val, 1))

    def evaluate(self, test_features: List[Tuple[float, float]], test_targets: List[float]) -> Dict[str, float]:
        """Evaluates model performance on a test validation dataset."""
        n = len(test_features)
        if n == 0:
            return {"rmse": 0.0, "mae": 0.0, "r_squared": 0.0}

        errors = []
        abs_errors = []
        for feat, target in zip(test_features, test_targets):
            pred = self.predict(feat[0], feat[1])
            err = pred - target
            errors.append(err ** 2)
            abs_errors.append(abs(err))

        mse = sum(errors) / n
        mae = sum(abs_errors) / n
        return {
            "rmse": round(math.sqrt(mse), 2),
            "mae": round(mae, 2),
            "r_squared": round(self.r_squared, 4)
        }

    @staticmethod
    def generate_synthetic_dhaka_fare_data(mode: str, num_samples: int = 100) -> Tuple[List[Tuple[float, float]], List[float]]:
        """
        Generates calibrated benchmark samples representative of Gulshan/Banani/Dhanmondi transit:
        - Rickshaw: base ~ 30 BDT, ~25 BDT/km, + 15 BDT * traffic
        - CNG: base ~ 60 BDT, ~40 BDT/km, + 35 BDT * traffic
        - Car: base ~ 120 BDT, ~55 BDT/km, + 50 BDT * traffic
        """
        import random
        random.seed(42) # Deterministic calibration

        if mode == "rickshaw":
            b_true, w_d_true, w_t_true = 30.0, 25.0, 15.0
            dist_range = (0.5, 4.5)
        elif mode == "cng":
            b_true, w_d_true, w_t_true = 65.0, 42.0, 32.0
            dist_range = (1.5, 12.0)
        else: # car
            b_true, w_d_true, w_t_true = 120.0, 58.0, 48.0
            dist_range = (2.0, 20.0)

        features = []
        targets = []

        for _ in range(num_samples):
            dist = round(random.uniform(*dist_range), 2)
            # Traffic index 1.0 = clear, 2.5 = peak Gulshan circle jam
            traffic = round(random.uniform(1.0, 2.5), 2)
            # Add Gaussian noise
            noise = random.gauss(0.0, 3.5 if mode == "rickshaw" else 8.0)
            fare = b_true + (w_d_true * dist) + (w_t_true * traffic) + noise
            features.append((dist, traffic))
            targets.append(round(max(25.0, fare), 1))

        return features, targets
