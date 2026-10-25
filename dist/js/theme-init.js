// Se ejecuta antes de pintar para que el modo oscuro no parpadee. Preferencia guardada o la del sistema.
try {
  const saved = localStorage.getItem('animalworld-theme');
  const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch { /* sin almacenamiento: queda el tema claro */ }
