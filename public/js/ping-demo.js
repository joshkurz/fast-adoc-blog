document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('ping-btn');
  const out = document.getElementById('ping-result');
  if (btn && out) {
    btn.addEventListener('click', async () => {
      out.textContent = 'Loading...';
      try {
        const res = await fetch('/api/ping');
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        out.textContent = JSON.stringify(data);
      } catch (err) {
        out.textContent = 'Error';
      }
    });
  }
});
