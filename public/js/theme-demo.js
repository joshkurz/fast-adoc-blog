document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      document.body.setAttribute('data-theme', theme);
      const frame = document.querySelector('iframe.giscus-frame');
      if (frame) {
        frame.contentWindow.postMessage({
          giscus: { setConfig: { theme } }
        }, 'https://giscus.app');
      }
    });
  });
});
