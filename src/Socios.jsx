import { useState } from 'react';
import { apiPatch, apiPost, apiDelete, apiGet } from './api';

export default function Socios({ token, socios, onRefresh }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [altaDni, setAltaDni] = useState('');
  const [altaNombre, setAltaNombre] = useState('');
  const [altaEmail, setAltaEmail] = useState('');
  const [altaPassword, setAltaPassword] = useState('');
  const [altaError, setAltaError] = useState('');
  const [altaGuardando, setAltaGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [monto, setMonto] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const darAlta = async (e) => {
    e.preventDefault();
    setAltaError('');
    if (!altaDni || !altaNombre || !altaPassword) {
      setAltaError('DNI, nombre y contraseña son obligatorios');
      return;
    }
    setAltaGuardando(true);
    try {
      await apiPost('/api/socios', token, {
        dni: altaDni,
        nombre: altaNombre,
        email: altaEmail,
        password: altaPassword,
      });
      await onRefresh();
      setAltaDni('');
      setAltaNombre('');
      setAltaEmail('');
      setAltaPassword('');
      setMostrarAlta(false);
    } catch (err) {
      setAltaError('No se pudo dar de alta (¿DNI repetido?)');
    } finally {
      setAltaGuardando(false);
    }
  };

  const abrir = async (socio) => {
    setSeleccionado(socio);
    setNombre(socio.nombre);
    setEmail(socio.email || '');
    setPeriodo(new Date().toISOString().slice(0, 7));
    setMonto('');
    setDetalle(null);
    try {
      const d = await apiGet(`/api/socios/${socio.id}/detalle`, token);
      setDetalle(d);
    } catch (e) {
      console.error(e);
    }
  };

  const guardarDatos = async () => {
    setGuardando(true);
    try {
      await apiPatch(`/api/socios/${seleccionado.id}`, token, { nombre, email });
      await onRefresh();
      setSeleccionado(null);
    } catch (e) {
      alert('No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  const registrarPago = async () => {
    if (!monto) return alert('Ingresá un monto');
    setGuardando(true);
    try {
      await apiPost('/api/pagos/efectivo', token, {
        usuarioId: seleccionado.id,
        monto: Number(monto),
        periodo,
      });
      await onRefresh();
      const d = await apiGet(`/api/socios/${seleccionado.id}/detalle`, token);
      setDetalle(d);
      setMonto('');
      alert('Pago registrado');
    } catch (e) {
      alert('No se pudo registrar el pago');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm(`¿Dar de baja a ${seleccionado.nombre}? No se puede deshacer.`)) return;
    setGuardando(true);
    try {
      await apiDelete(`/api/socios/${seleccionado.id}`, token);
      await onRefresh();
      setSeleccionado(null);
    } catch (e) {
      alert('No se pudo dar de baja');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="socios-layout">
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Socios</h2>
          <button onClick={() => setMostrarAlta(!mostrarAlta)}>
            {mostrarAlta ? 'Cancelar' : '+ Nuevo socio'}
          </button>
        </div>

        {mostrarAlta && (
          <form className="alta-socio" onSubmit={darAlta}>
            <input placeholder="DNI" value={altaDni} onChange={(e) => setAltaDni(e.target.value)} />
            <input placeholder="Nombre" value={altaNombre} onChange={(e) => setAltaNombre(e.target.value)} />
            <input placeholder="Email (opcional)" value={altaEmail} onChange={(e) => setAltaEmail(e.target.value)} />
            <input placeholder="Contraseña" type="password" value={altaPassword} onChange={(e) => setAltaPassword(e.target.value)} />
            {altaError && <p className="error">{altaError}</p>}
            <button type="submit" disabled={altaGuardando}>{altaGuardando ? 'Creando...' : 'Crear socio'}</button>
          </form>
        )}

        <table>
          <thead><tr><th>Nombre</th><th>DNI</th><th>Estado</th></tr></thead>
          <tbody>
            {socios.map((s) => (
              <tr key={s.id} onClick={() => abrir(s)} className={seleccionado?.id === s.id ? 'fila-activa' : ''}>
                <td>{s.nombre}</td>
                <td>{s.dni}</td>
                <td><span className={`badge ${s.estadoPago === 'VENCIDO' ? 'badge-warn' : 'badge-ok'}`}>{s.estadoPago}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <div className="panel detalle">
          <h2>{seleccionado.nombre}</h2>

          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={guardarDatos} disabled={guardando}>Guardar datos</button>

          <hr />

          <h3>Registrar pago en efectivo</h3>
          <div className="row">
            <input placeholder="Monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
            <input placeholder="AAAA-MM" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            <button onClick={registrarPago} disabled={guardando}>Registrar</button>
          </div>

          <hr />

          <h3>Historial de pagos</h3>
          {detalle ? (
            <ul className="lista-pagos">
              {detalle.pagos?.length ? detalle.pagos.map((p) => (
                <li key={p.id}>{p.periodo} — ${p.monto.toLocaleString('es-AR')} — {p.metodo}</li>
              )) : <li>Sin pagos registrados</li>}
            </ul>
          ) : <p>Cargando...</p>}

          <hr />
          <button className="peligro" onClick={eliminar} disabled={guardando}>Dar de baja socio</button>
        </div>
      )}
    </div>
  );
}
