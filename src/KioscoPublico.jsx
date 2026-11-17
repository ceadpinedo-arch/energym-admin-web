import { useEffect, useRef, useState } from 'react';
import { API_URL } from './api';
import './KioscoPublico.css';

const soloNum = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');

// Avisa al agente de la notebook del gimnasio (solo escucha en 127.0.0.1).
// Dispara el pedido y sigue: no espera respuesta. El token es el mismo del enlace del kiosco.
function abrirPuerta(token) {
  try {
    fetch('http://127.0.0.1:8765/abrir?t=' + encodeURIComponent(token), { mode: 'no-cors' }).catch(function () {});
  } catch (e) {}
}

function Svg(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {props.children}
    </svg>
  );
}

const IconoSol = (
  <Svg>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
const IconoLuna = (
  <Svg>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
);
export default function KioscoPublico() {
  const token = new URLSearchParams(window.location.search).get('k') || '';
  const [dni, setDni] = useState('');
  const [res, setRes] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [info, setInfo] = useState(null);
  const [ahora, setAhora] = useState(new Date());
  const [claro, setClaro] = useState(() => {
    try {
      return localStorage.getItem('kp-tema') === 'claro';
    } catch (e) {
      return false;
    }
  });
  const ref = useRef(null);

  useEffect(() => {
    if (!token) return;
    fetch(API_URL + '/api/kiosco/info?k=' + encodeURIComponent(token))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setInfo(d);
          if (d.nombre) document.title = d.nombre + ' - Ingreso';
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, [res]);

  useEffect(() => {
    if (!res) return undefined;
    const t = setTimeout(() => setRes(null), 4000);
    return () => clearTimeout(t);
  }, [res]);

  const cambiarTema = () => {
    const nuevo = !claro;
    setClaro(nuevo);
    try {
      localStorage.setItem('kp-tema', nuevo ? 'claro' : 'oscuro');
    } catch (e) {}
  };

  // Los botones de arriba no le sacan el foco al campo del DNI
  const sinFoco = (e) => e.preventDefault();

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando || !dni) return;
    setEnviando(true);
    try {
      const r = await fetch(API_URL + '/api/kiosco/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, dni: soloNum(dni) }),
      });
      const data = await r.json();
      setRes(data);
      if (data && data.permitido && data.puertaFisica) abrirPuerta(token);
    } catch (err) {
      setRes({ permitido: false, motivo: 'No hay conexión. Probá de nuevo.' });
    } finally {
      setDni('');
      setEnviando(false);
    }
  };

  const nombreGym = info && info.nombre ? info.nombre : 'Ingreso';
  const logo = info && info.logoUrl ? info.logoUrl : null;
  const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const fecha = ahora.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={'kp-wrap' + (claro ? ' kp-claro' : '')}>
      <div className="kp-tools">
        <button type="button" className="kp-tema" onMouseDown={sinFoco} onClick={cambiarTema}>
          {claro ? IconoLuna : IconoSol}
          <span>{claro ? 'Modo oscuro' : 'Modo claro'}</span>
        </button>
      </div>

      <div className="kp-reloj">
        <div className="kp-hora">{hora}</div>
        <div className="kp-fecha">{fecha}</div>
      </div>

      <div className="kp-card">
        <div className="kp-logo">
          {logo ? <img src={logo} alt="" /> : <span>{nombreGym.trim().charAt(0).toUpperCase()}</span>}
        </div>
        <h1 className="kp-nombre">{nombreGym}</h1>
        {!token ? (
          <p className="kp-sub">Falta el enlace de ingreso. Pedile al gimnasio el enlace completo.</p>
        ) : (
          <form onSubmit={enviar}>
            <p className="kp-sub">Escribí tu DNI y tocá Enter</p>
            <input
              ref={ref}
              className="kp-input"
              inputMode="numeric"
              autoFocus
              placeholder="Tu DNI"
              value={dni}
              onChange={(e) => {
                setDni(soloNum(e.target.value));
                if (res) setRes(null);
              }}
            />
            <button className="kp-btn" type="submit" disabled={enviando}>
              {enviando ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        )}
        <p className="kp-pie">TuAccesoGym</p>
      </div>

      {res && (
        <div className={'kp-res ' + (res.permitido ? 'kp-ok' : 'kp-no')} onClick={() => setRes(null)}>
          <div className="kp-res-icono">{res.permitido ? '✓' : '✕'}</div>
          <div className="kp-res-titulo">
            {res.permitido ? '¡Bienvenido/a, ' + res.nombre + '!' : res.motivo || 'No se pudo ingresar'}
          </div>
          {res.permitido && <div className="kp-res-sub">¡Buen entrenamiento!</div>}
          {!res.permitido && res.nombre && <div className="kp-res-sub">{res.nombre}</div>}
          <div className="kp-barra"><span /></div>
        </div>
      )}
    </div>
  );
}
