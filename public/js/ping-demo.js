document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ping-btn');
  const out = document.getElementById('ping-result');
  if (btn && out) {
    btn.addEventListener('click', async () => {
      out.textContent = 'Loading...';
      try {
        const res = await fetch('/api/ping').then(r => r.json());
        out.textContent = JSON.stringify(res);
      } catch (err) {
        out.textContent = 'Error';
      }
    });
  }
});
