import { esc } from './escape.js';
import { appStorage } from './storage.js';

export function initTasteUI() {
  const modal = document.getElementById('tasteModal');
  const openBtn = document.getElementById('openTasteBtn');
  const closeBtn = document.getElementById('closeTasteModalBtn');
  const resetBtn = document.getElementById('resetTasteBtn');
  const learningToggle = document.getElementById('learningToggle');
  const exportBtn = document.getElementById('exportDataBtn');
  const deleteBtn = document.getElementById('deleteDataBtn');
  const container = document.getElementById('tasteSlidersContainer');

  if (!modal || !openBtn) return;

  function renderTasteSliders() {
    const profile = appStorage.getTasteProfile();
    const isLearning = appStorage.isLearningEnabled();
    if (learningToggle) learningToggle.checked = isLearning;

    container.innerHTML = Object.entries(profile).map(([cuisine, score]) => `
      <div class="taste-item">
        <div class="taste-header">
          <span class="taste-name">${esc(cuisine)}</span>
          <span class="taste-value" id="val-${esc(cuisine)}">${esc(score)}%</span>
        </div>
        <div class="taste-bar-bg">
          <div class="taste-bar-fill" id="fill-${esc(cuisine)}" style="width: ${esc(score)}%;"></div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value="${esc(score)}" 
          class="taste-slider" 
          data-cuisine="${esc(cuisine)}"
          aria-label="${esc(cuisine)} preference score slider"
        />
      </div>
    `).join('');

    // Attach event listeners to sliders
    container.querySelectorAll('.taste-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const cuisine = e.target.dataset.cuisine;
        const val = parseInt(e.target.value, 10);
        const current = appStorage.getTasteProfile();
        current[cuisine] = val;
        appStorage.saveTasteProfile(current);

        const valElem = document.getElementById(`val-${cuisine}`);
        const fillElem = document.getElementById(`fill-${cuisine}`);
        if (valElem) valElem.textContent = `${val}%`;
        if (fillElem) fillElem.style.width = `${val}%`;
      });
    });
  }

  openBtn.addEventListener('click', () => {
    renderTasteSliders();
    modal.classList.add('open');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  if (learningToggle) {
    learningToggle.addEventListener('change', (e) => {
      appStorage.setLearningEnabled(e.target.checked);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset your Taste Profile back to neutral (50% for all)?')) {
        const defaultProfile = {
          Japanese: 50, Bangladeshi: 50, Indian: 50, Chinese: 50, Korean: 50,
          'Fast Food': 50, Cafe: 50, Kabab: 50, Biriyani: 50, Dessert: 50, Coffee: 50, Burger: 50
        };
        appStorage.saveTasteProfile(defaultProfile);
        renderTasteSliders();
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = appStorage.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gulshan-finder-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete all your preferences, favorites, search history and taste data? This cannot be undone.')) {
        appStorage.deleteAllData();
        renderTasteSliders();
        alert('All local data successfully deleted.');
        window.location.reload();
      }
    });
  }

  window.addEventListener('taste-profile-updated', () => {
    if (modal.classList.contains('open')) {
      renderTasteSliders();
    }
  });
}
