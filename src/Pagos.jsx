import { useEffect, useState } from 'react';
import { apiGet } from './api';

const pesos = (n) => `$${(n || 0).toLocaleString('es-AR')}`;
const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const etiquetaMetodo = (m) => ({ EFECTIVO: 'Efectivo', MERCADO_PAGO: 'Mercado Pago' }[m] || m);
const mesActual = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).slice(0, 7);
const nombreMes = (mes) => new Date(`${mes}-01T12:00:00`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
const seguro = (t) => (/^[=+\-@]/.test(String(t)) ? `'${t}` : t);

const telefonoValido = (t) => String(t || '').split('').filter((c) => c >= '0' && c <= '9').length >= 8;
const waLink = (tel, texto) => {
  let n = String(tel).split('').filter((c) => c >= '0' && c <= '9').join('');
  while (n.startsWith('0')) n = n.slice(1);
  if (n.startsWith('54') && !n.startsWith('549')) n = '549' + n.slice(2);
  if (!n.startsWith('54')) n = '549' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
};

export default function Pagos({ token }) {
  const [mes, setMes] = useState(mesActual());
  const [metodo, setMetodo] = useState('');
  const [data, setData] = useState(null);
  const [morosos, setMorosos] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    const q = '/api/pagos/historial?mes=' + mes + (metodo ? '&metodo=' + metodo : '');
    apiGet(q, token).then(setData).catch(() => setError('No se pudo cargar el historial.'));
  }, [token, mes, metodo]);

  useEffect(() => {
    apiGet('/api/pagos/morosos', token).then(setMorosos).catch(console.error);
  }, [token]);

  const mover = (delta) => {
    const [a, m] = mes.split('-').map(Number);
    const d = new Date(Date.UTC(a, m - 1 + delta, 1));
    setMes(`d.getUTCFullYear()-{String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const exportarCSV = () => {
    if (!data?.pagos?.length) return;
    const filas = [['Fecha', 'Socio', 'DNI', 'Período', 'Método', 'Monto']];
    data.pagos.forEach((p) => filas.push([
      fechaCorta(p.pagadoEn), seguro(p.usuario?.nombre || ''), p.usuario?.dni || '',
      p.periodo, etiquetaMetodo(p.metodo), p.monto,
    ]));
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mensaje = (s) => {
    const g = morosos && morosos.gimnasio;
    const cuando = s.vencimiento ? ' venció el ' + fechaCorta(s.vencimiento) : ' está vencida';
    const valor = g && g.cuota ? ' El valor es ' + pesos(g.cuota) + '.' : '';
    const lugar = g && g.nombre ? g.nombre : 'el gimnasio';
    return 'Hola ' + s.nombre + ', te escribimos de ' + lugar + '. Tu cuota' + cuando + '.' + valor + ' Cualquier duda avisanos. ¡Gracias!';
  };

  const copiar = async (s) => {
    try {
      await navigator.clipboard.writeText(mensaje(s));
      setCopiado(s.id);
      setTimeout(() => setCopiado(''), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="filtros">
        <button onClick={() => mover(-1)}>←</button>
        <strong style={{ textTransform: 'capitalize' }}>{nombreMes(mes)}</strong>
        <button onClick={() => mover(1)} disabled={mes >= mesActual()}>→</button>
        <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option value="">Todos los métodos</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="MERCADO_PAGO">Mercado Pago</option>
        </select>
        <button onClick={exportarCSV} disabled={!data?.pagos?.length}>Exportar CSV</button>
      </div>

      <section className="stats">
        <div className="stat-card">
          <span>Total del período</span>
          <strong>{pesos(data?.total)}</strong>
          <small>{data?.cantidad ?? 0} pagos</small>
        </div>
      </section>

      <section className="panel">
        <h3>Historial</h3>
        {error && <p className="error">{error}</p>}
        {!error && !data && <p className="vacio">Cargando...</p>}
        {data && !data.pagos.length && <p className="vacio">No hay pagos en este período.</p>}
        {data && data.pagos.length > 0 && (
          <ul className="lista">
            {data.pagos.map((p) => (
              <li key={p.id}>
                <span>{p.usuario?.nombre}<small> · {etiquetaMetodo(p.metodo)} · {fechaCorta(p.pagadoEn)}</small></span>
                <span>{pesos(p.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h3>Morosos{morosos ? ` (${morosos.socios.length})` : ''}</h3>
        {!morosos && <p className="vacio">Cargando...</p>}
        {morosos && !morosos.socios.length && <p className="vacio">No hay cuotas vencidas.</p>}
        {morosos && morosos.socios.length > 0 && (
          <ul className="lista">
            {morosos.socios.map((s) => (
              <li key={s.id}>
                <span>{s.nombre}<small> · {s.dni}{s.vencimiento ? ` · venció ${fechaCorta(s.vencimiento)}` : ''}</small></span>
                <span className="acciones">
                  {telefonoValido(s.telefono) && (
                    <a className="btn-wa" href={waLink(s.telefono, mensaje(s))} target="_blank" rel="noreferrer">WhatsApp</a>
                  )}
                  <button onClick={() => copiar(s)}>{copiado === s.id ? '¡Copiado!' : 'Copiar mensaje'}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
