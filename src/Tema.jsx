import { useState } from 'react';

const CLAVE = 'energym-tema';

function inicial() {
  try {
    const g = localStorage.getItem(CLAVE);
    if (g === 'dark' || g === 'light') return g;
  } catch (e) {}
  const oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return oscuro ? 'dark' : 'light';
}

function aplicar(t) {
  document.documentElement.setAttribute('data-theme', t);
}

aplicar(inicial());

export default function BotonTema() {
  const [tema, setTema] = useState(inicial());
  function cambiar() {
    const n = tema === 'dark' ? 'light' : 'dark';
    setTema(n);
    aplicar(n);
    try { localStorage.setItem(CLAVE, n); } catch (e) {}
  }
  return (
    <button onClick={cambiar} title="Cambiar tema">
      {tema === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}
