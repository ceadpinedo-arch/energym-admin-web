import { useEffect, useState } from 'react';
import { apiGet, apiPost } from './api';

export default function Cobros({ token }) {
  const [est, setEst] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('mp');
    if (q === 'ok') setOk('Mercado Pago conectado. Desde ahora las cuotas se cobran en tu cuenta.');
    if (q === 'error') setError('No se pudo conectar Mercado Pago. Probá de nuevo.');
    if (q) window.history.replaceState({}, '', window.location.pathname);
    apiGet('/api/mp/estado', token).then(setEst).catch(() => setError('No se pudo cargar el estado.'));
  }, [token]);

  const conectar = async () => {
    setError('');
    setOk('');
    try {
      const r = await apiPost('/api/mp/conectar', token, {});
      window.location.href = r.url;
    } catch (e) {
      setError('No se pudo iniciar la conexión con Mercado Pago.');
    }
  };

  const desconectar = async () => {
    setError('');
    setOk('');
    if (!window.confirm('Los socios dejarán de poder pagar con Mercado Pago hasta que lo vuelvas a conectar. ¿Continuar?')) return;
    try {
      await apiPost('/api/mp/desconectar', token, {});
      setEst({ conectado: false, cuenta: null });
      setOk('Mercado Pago desconectado.');
    } catch (e) {
      setError('No se pudo desconectar.');
    }
  };

  return (
    <section className="panel">
      <h2>Cobros</h2>
      <p>Mercado Pago: tus socios pagan la cuota online y el dinero llega directo a tu cuenta de Mercado Pago. Se confirma solo.</p>
      {ok && <p className="aviso-ok">{ok}</p>}
      {error && <p className="error">{error}</p>}
      {est && !est.conectado && (
        <button className="btn-pri" onClick={conectar}>Conectar Mercado Pago</button>
      )}
      {est && est.conectado && (
        <>
          <p><b>Estado:</b> conectado{est.cuenta ? ' (cuenta ' + est.cuenta + ')' : ''}</p>
          <button className="btn-sec" onClick={conectar}>Reconectar</button>
          <button className="btn-sec" onClick={desconectar}>Desconectar</button>
        </>
      )}
      <p>Transferencia con alias y CBU: se configura en la pestaña Gimnasio y sirve para cualquier billetera. Efectivo: lo registrás a mano desde el panel o la app.</p>
    </section>
  );
}
