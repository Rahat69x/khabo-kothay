import { state } from './state.js';

const MOODS = [
  { name: 'Something spicy', icon: '🌶️' },
  { name: 'Something light', icon: '🥗' },
  { name: 'Comfort food', icon: '🍲' },
  { name: 'Fast food', icon: '🍟' },
  { name: 'Healthy food', icon: '🥑' },
  { name: 'Something new', icon: '✨' },
  { name: 'Sweet', icon: '🍰' },
  { name: 'Coffee', icon: '☕' },
  { name: 'Fine dining', icon: '🥂' },
  { name: 'Budget friendly', icon: '৳' }
];

export function initMoodUI(containerId, onMoodSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = MOODS.map(m => `
    <button 
      type="button" 
      class="chip mood-chip ${state.mood === m.name ? 'active' : ''}" 
      data-mood="${m.name}"
      aria-pressed="${state.mood === m.name}"
    >
      <span class="chip-icon">${m.icon}</span>
      <span class="chip-label">${m.name}</span>
    </button>
  `).join('');

  container.querySelectorAll('.mood-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const moodName = btn.dataset.mood;
      const isActive = btn.classList.contains('active');

      container.querySelectorAll('.mood-chip').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });

      if (!isActive) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        state.setMood(moodName);
      } else {
        state.setMood(null);
      }

      if (onMoodSelect) onMoodSelect(state.mood);
    });
  });
}
