// Efecto ripple en todos los botones.
document.querySelectorAll('.btn').forEach((button) => {
  button.addEventListener('click', (event) => {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 600);
  });
});

// Inclinación 3D suave de las tarjetas al mover el mouse.
document.querySelectorAll('.js-tilt').forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Animación de los contadores cuando entran en pantalla.
const counters = document.querySelectorAll('[data-count]');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.count);
      const duration = 1100;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(element);
    });
  },
  { threshold: 0.6 },
);
counters.forEach((counter) => observer.observe(counter));
