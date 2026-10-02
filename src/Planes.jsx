import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from './api';

const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-AR');
const soloNum = (v) => String(v || '').split('').filter((c) => c >= '0' && c <= '9').join('');
const vacio = { nombre: '', precio: '', meses: '1' };

export default function Planes({ token }) {
  const [planes, setPlanes] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => {
    apiGet('/api/admin/planes', token).then(setPlanes).catch(() => setError('No se pudieron cargar los planes.'));
  };

  useEffect(() => { cargar(); }, [token]);

  const guardar = async () => {
    setError('');
    const precio = Number(soloNum(form.precio));
    const meses = parseInt(form.meses, 10);
    if (!form.nombre.trim() || !precio || !meses || meses < 1 || meses > 24) {
      setError('Completá nombre, precio y meses (entre 1 y 24).');
      return;
    }
    const body = { nombre: form.nombre.trim(), precio, meses };
    try {
      if (editId) await apiPut('/api/admin/planes/' + editId, token, body);
      else await apiPost('/api/admin/planes', token, body);
      setForm(vacio);
      setEditId(null);
      cargar();
    } catch (e) {
      setError('No se pudo guardar el plan.');
    }
  };

  const editar = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, precio: String(p.precio), meses: String(p.meses) });
  };

  const cancelar = () => { setEditId(null); setForm(vacio); setError(''); };

  const borrar = async (p) => {
    const n = p._count ? p._count.usuarios : 0;
    const aviso = n > 0
      ? '"' + p.nombre + '" lo tienen ' + n + ' socio(s). Si lo borrás, vuelven a la cuota general del gimnasio. ¿Borrar?'
      : '¿Borrar el plan "' + p.nombre + '"?';
    if (!window.confirm(aviso)) return;
    try {
      await apiDelete('/api/admin/planes/' + p.id, token);
      cargar();
    } catch (e) {
      setError('No se pudo borrar el plan.');
    }
  };

  return (
    <div className="panel">
      <h2>Planes de cuota</h2>
      <p className="chico">Los socios sin plan usan la cuota general del gimnasio. Con plan, el monto y el vencimiento salen de él.</p>
      <div className="form-ej">
        <input className="campo" placeholder="Nombre (ej: Trimestral)" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input className="campo" inputMode="numeric" placeholder="Precio ($)" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
        <input className="campo" inputMode="numeric" placeholder="Duración en meses" value={form.meses} onChange={(e) => setForm({ ...form, meses: e.target.value })} />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="acciones" style={{ marginBottom: 14 }}>
        <button className="btn-pri" onClick={guardar}>{editId ? 'Guardar cambios' : 'Agregar plan'}</button>
        {editId && <button className="btn-sec" onClick={cancelar}>Cancelar</button>}
      </div>
      {planes.length === 0 ? (
        <p>Todavía no hay planes.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr><th>Plan</th><th>Precio</th><th>Duración</th><th>Socios</th><th></th></tr>
            </thead>
            <tbody>
              {planes.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{pesos(p.precio)}</td>
                  <td>{p.meses} {p.meses === 1 ? 'mes' : 'meses'}</td>
                  <td>{p._count ? p._count.usuarios : 0}</td>
                  <td>
                    <div className="acciones">
                      <button className="btn-sec" onClick={() => editar(p)}>Editar</button>
                      <button className="btn-sec" onClick={() => borrar(p)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
