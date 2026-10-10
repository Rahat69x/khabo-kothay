"""
Khabo Kothay - Python Machine Learning Pipeline
Multi-Armed Bandit (MAB) Recommendation Engine with Thompson Sampling & Epsilon-Greedy Exploration
"""

import math
import random
from typing import Dict, List, Tuple, Any

class BanditRecommender:
    """
    Online multi-armed bandit recommender for balancing exploration of new restaurants
    with exploitation of established high-rated community favorites.
    """

    def __init__(self, epsilon: float = 0.15, decay: float = 0.995):
        self.epsilon = epsilon
        self.decay = decay
        # Arms: restaurant_id -> {'successes': int, 'failures': int, 'pulls': int, 'est_reward': float}
        self.arms: Dict[str, Dict[str, Any]] = {}

    def register_place(self, place_id: str, initial_rating: float = 4.0):
        """Initializes a restaurant arm with Bayesian prior based on community rating."""
        if place_id not in self.arms:
            alpha = max(1.0, initial_rating * 2.0)
            beta = max(1.0, (5.0 - initial_rating) * 2.0)
            self.arms[place_id] = {
                'alpha': alpha,
                'beta': beta,
                'pulls': 0,
                'total_reward': 0.0,
                'mean_reward': initial_rating / 5.0
            }

    def select_arm_thompson(self, candidate_ids: List[str]) -> str:
        """Selects best candidate using Thompson Sampling (Bayesian Beta-Bernoulli)."""
        best_place = None
        highest_sample = -1.0

        for pid in candidate_ids:
            if pid not in self.arms:
                self.register_place(pid)
            
            arm = self.arms[pid]
            # Beta distribution random sample
            sample = random.betavariate(arm['alpha'], arm['beta'])
            if sample > highest_sample:
                highest_sample = sample
                best_place = pid

        return best_place or candidate_ids[0]

    def select_arm_epsilon_greedy(self, candidate_ids: List[str]) -> Tuple[str, bool]:
        """Selects arm using epsilon-greedy strategy. Returns (place_id, is_explored)."""
        for pid in candidate_ids:
            if pid not in self.arms:
                self.register_place(pid)

        # Exploration step
        if random.random() < self.epsilon:
            return random.choice(candidate_ids), True

        # Exploitation step
        best_place = max(candidate_ids, key=lambda pid: self.arms[pid]['mean_reward'])
        return best_place, False

    def update_feedback(self, place_id: str, reward: float):
        """
        Updates bandit arms after a user action (e.g., click=0.5, bookmark=0.8, visit=1.0, dismiss=0.0).
        """
        if place_id not in self.arms:
            self.register_place(place_id)

        arm = self.arms[place_id]
        arm['pulls'] += 1
        arm['total_reward'] += reward
        arm['mean_reward'] = arm['total_reward'] / arm['pulls']

        # Update Bayesian Beta parameters
        if reward >= 0.5:
            arm['alpha'] += reward
        else:
            arm['beta'] += (1.0 - reward)

        # Decay epsilon over time to shift from exploration to exploitation
        self.epsilon = max(0.02, self.epsilon * self.decay)

    def rank_candidates(self, candidates: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """Ranks a list of candidate restaurants by composite score of bandit reward + travel score."""
        for c in candidates:
            self.register_place(c['id'], c.get('rating', 4.0))

        scored = []
        for c in candidates:
            arm = self.arms[c['id']]
            thompson_sample = random.betavariate(arm['alpha'], arm['beta'])
            rating_score = (c.get('rating', 4.0) / 5.0)
            composite = 0.6 * thompson_sample + 0.4 * rating_score

            scored.append({
                **c,
                'bandit_score': round(composite, 4),
                'pull_count': arm['pulls']
            })

        scored.sort(key=lambda x: x['bandit_score'], reverse=True)
        return scored[:top_k]
