import { useEffect, useRef, useState } from 'react';
import { API_URL } from './api';

const soloNum = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');

export default function KioscoPublico() {
  const token = new URLSearchParams(window.location.search).get('k') || '';
  const [dni, setDni] = useState('');
  const [res, setRes] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, [res]);

  useEffect(() => {
    if (!res) return undefined;
    const t = setTimeout(() => setRes(null), 4000);
    return () => clearTimeout(t);
  }, [res]);

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
      setRes(await r.json());
    } catch (err) {
      setRes({ permitido: false, motivo: 'No hay conexión. Probá de nuevo.' });
    } finally {
      setDni('');
      setEnviando(false);
    }
  };

  return (
    <div className="checkin-wrap">
      <div className="checkin-card">
        <h1>Ingreso</h1>
        {!token ? (
          <p className="checkin-sub">Falta el enlace de ingreso. Pedile al gimnasio el enlace completo.</p>
        ) : (
          <form onSubmit={enviar}>
            <p className="checkin-sub">Escribí tu DNI y tocá Enter</p>
            <input ref={ref} className="campo" style={{ fontSize: 28, textAlign: 'center' }} inputMode="numeric" autoFocus placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value)} />
            <button className="btn-pri" type="submit" disabled={enviando}>{enviando ? 'Verificando...' : 'Ingresar'}</button>
          </form>
        )}
        {res && (
          <div className={'checkin-resultado ' + (res.permitido ? 'ok' : 'error')}>
            {res.permitido ? '¡Bienvenido/a, ' + res.nombre + '!' : res.motivo + (res.nombre ? ' (' + res.nombre + ')' : '')}
          </div>
        )}
      </div>
    </div>
  );
}
