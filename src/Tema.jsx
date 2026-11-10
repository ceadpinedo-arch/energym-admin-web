import { useEffect, useRef, useState } from 'react';

const K_TEMA = 'energym-tema';
const K_PAL = 'energym-paleta';
const K_EST = 'energym-estilo';

const PALETAS = [
  { id: 'violeta', nombre: 'Violeta', h: 245, s: 43, l: 50 },
  { id: 'azul', nombre: 'Azul', h: 215, s: 62, l: 46 },
  { id: 'turquesa', nombre: 'Turquesa', h: 180, s: 80, l: 33 },
  { id: 'verde', nombre: 'Verde', h: 150, s: 60, l: 34 },
  { id: 'naranja', nombre: 'Naranja', h: 22, s: 86, l: 44 },
  { id: 'rojo', nombre: 'Rojo', h: 355, s: 65, l: 46 },
  { id: 'rosa', nombre: 'Rosa', h: 320, s: 60, l: 46 },
];
const ESTILOS = [
  { id: 'suave', nombre: 'Suave' },
  { id: 'cuadrado', nombre: 'Cuadrado' },
  { id: 'pildora', nombre: 'Píldora' },
];

function leer(clave, validos, def) {
  try {
    const v = localStorage.getItem(clave);
    if (v && validos.indexOf(v) >= 0) return v;
  } catch (e) {}
  return def;
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch (e) {}
}
function temaInicial() {
  const g = leer(K_TEMA, ['light', 'dark'], '');
  if (g) return g;
  const oscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return oscuro ? 'dark' : 'light';
}
const palInicial = () => leer(K_PAL, PALETAS.map((p) => p.id), 'violeta');
const estInicial = () => leer(K_EST, ESTILOS.map((e) => e.id), 'suave');

function aplicarTema(t) {
  document.documentElement.setAttribute('data-theme', t);
}
function aplicarPal(id) {
  const p = PALETAS.filter((x) => x.id === id)[0] || PALETAS[0];
  const st = document.documentElement.style;
  st.setProperty('--h', String(p.h));
  st.setProperty('--s', p.s + '%');
  st.setProperty('--l', p.l + '%');
}
function aplicarEst(id) {
  document.documentElement.setAttribute('data-estilo', id);
}

aplicarTema(temaInicial());
aplicarPal(palInicial());
aplicarEst(estInicial());

export default function BotonTema() {
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState(temaInicial());
  const [pal, setPal] = useState(palInicial());
  const [est, setEst] = useState(estInicial());
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  const cambiarTema = (t) => { setTema(t); aplicarTema(t); guardar(K_TEMA, t); };
  const cambiarPal = (id) => { setPal(id); aplicarPal(id); guardar(K_PAL, id); };
  const cambiarEst = (id) => { setEst(id); aplicarEst(id); guardar(K_EST, id); };
  const restablecer = () => { cambiarPal('violeta'); cambiarEst('suave'); };

  return (
    <div className="apar" ref={ref}>
      <button onClick={() => setAbierto(!abierto)} title="Apariencia">🎨 Apariencia</button>
      {abierto ? (
        <div className="apar-pop">
          <div className="apar-t">Modo</div>
          <div className="apar-fila">
            <button className={'apar-op' + (tema === 'light' ? ' on' : '')} onClick={() => cambiarTema('light')}>☀️ Claro</button>
            <button className={'apar-op' + (tema === 'dark' ? ' on' : '')} onClick={() => cambiarTema('dark')}>🌙 Oscuro</button>
          </div>
          <div className="apar-t">Color</div>
          <div className="apar-fila">
            {PALETAS.map((p) => (
              <button
                key={p.id}
                title={p.nombre}
                className={'apar-sw' + (pal === p.id ? ' on' : '')}
                style={{ background: 'hsl(' + p.h + ',' + p.s + '%,' + p.l + '%)' }}
                onClick={() => cambiarPal(p.id)}
              />
            ))}
          </div>
          <div className="apar-t">Estilo</div>
          <div className="apar-fila">
            {ESTILOS.map((e) => (
              <button key={e.id} className={'apar-op' + (est === e.id ? ' on' : '')} onClick={() => cambiarEst(e.id)}>{e.nombre}</button>
            ))}
          </div>
          <button className="apar-reset" onClick={restablecer}>Restablecer</button>
        </div>
      ) : null}
    </div>
  );
}
