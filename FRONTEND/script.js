// Camply Web UI Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  console.log('Camply UI loaded successfully.');

  // Smooth scroll for nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href').startsWith('#')) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
});

// Filter Cabin Cards by Category
function setFilter(buttonEl, category) {
  // Update active tab styling
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  buttonEl.classList.add('active');

  const cards = document.querySelectorAll('.cabin-card');
  cards.forEach(card => {
    if (category === 'all' || card.getAttribute('data-category') === category) {
      card.style.display = 'block';
      card.style.animation = 'fadeIn 0.4s ease';
    } else {
      card.style.display = 'none';
    }
  });
}

// Toggle Favorite Heart Button
function toggleFavorite(btn) {
  const svg = btn.querySelector('svg');
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
    svg.setAttribute('fill', 'none');
    svg.style.color = 'currentColor';
  } else {
    btn.classList.add('active');
    svg.setAttribute('fill', '#EF4444');
    svg.style.color = '#EF4444';
  }
}

// Modal Popup Handlers
function openModal(title, description) {
  const modal = document.getElementById('action-modal');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-desc');

  if (title) titleEl.innerText = title;
  if (description) descEl.innerText = description;

  modal.classList.add('active');
}

function closeModal(event) {
  const modal = document.getElementById('action-modal');
  modal.classList.remove('active');
}

// Filter Search Handler
function filterCabins() {
  const location = document.getElementById('input-location').value;
  openModal(`Searching Cabins in ${location || 'Selected Area'}`, 'Filtering available verified cabins with optimal availability and amenities.');
}
