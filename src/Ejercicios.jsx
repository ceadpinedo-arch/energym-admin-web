import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from './api';

const vacio = { nombre: '', grupoMuscular: '', descripcion: '', imagenUrl: '' };
const etiqueta = (g) => String(g).charAt(0) + String(g).slice(1).toLowerCase().split('_').join(' ');

export default function Ejercicios({ token }) {
  const [lista, setLista] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState('');
  const [form, setForm] = useState(vacio);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => {
    apiGet('/api/admin/ejercicios', token).then(setLista).catch(() => setError('No se pudieron cargar los ejercicios.'));
  };

  useEffect(() => {
    cargar();
    apiGet('/api/admin/grupos', token).then(setGrupos).catch(console.error);
  }, [token]);

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim() || !form.grupoMuscular) {
      setError('Poné el nombre y el grupo muscular.');
      return;
    }
    const body = {
      nombre: form.nombre.trim(),
      grupoMuscular: form.grupoMuscular,
      descripcion: form.descripcion.trim() || null,
      imagenUrl: form.imagenUrl.trim() || null,
    };
    try {
      if (editId) await apiPut('/api/admin/ejercicios/' + editId, token, body);
      else await apiPost('/api/admin/ejercicios', token, body);
      setForm(vacio);
      setEditId(null);
      cargar();
    } catch (e) {
      setError('No se pudo guardar el ejercicio.');
    }
  };

  const editar = (e) => {
    setEditId(e.id);
    setForm({ nombre: e.nombre, grupoMuscular: e.grupoMuscular, descripcion: e.descripcion || '', imagenUrl: e.imagenUrl || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setEditId(null);
    setForm(vacio);
    setError('');
  };

  const borrar = async (e) => {
    if (!window.confirm('¿Borrar "' + e.nombre + '"? También se quita de las rutinas que lo usan.')) return;
    try {
      await apiDelete('/api/admin/ejercicios/' + e.id, token);
      cargar();
    } catch (err) {
      setError('No se pudo borrar el ejercicio.');
    }
  };

  const visibles = lista.filter((e) => (!grupo || e.grupoMuscular === grupo) && e.nombre.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <section className="panel">
        <h3>{editId ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h3>
        <div className="form-ej">
          <input className="campo" placeholder="Nombre (ej: Press de banca)" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <select className="campo" value={form.grupoMuscular} onChange={(e) => setForm({ ...form, grupoMuscular: e.target.value })}>
            <option value="">Grupo muscular…</option>
            {grupos.map((g) => <option key={g} value={g}>{etiqueta(g)}</option>)}
          </select>
          <input className="campo" placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <input className="campo" placeholder="URL de la imagen (opcional)" value={form.imagenUrl} onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })} />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="acciones">
          <button className="btn-pri" onClick={guardar}>{editId ? 'Guardar cambios' : 'Agregar ejercicio'}</button>
          {editId && <button className="btn-sec" onClick={cancelar}>Cancelar</button>}
        </div>
      </section>

      <section className="panel">
        <div className="acciones" style={{ marginBottom: 12 }}>
          <input className="campo" style={{ maxWidth: 260 }} placeholder="Buscar ejercicio…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="campo" style={{ maxWidth: 200 }} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos los grupos</option>
            {grupos.map((g) => <option key={g} value={g}>{etiqueta(g)}</option>)}
          </select>
        </div>
        {lista.length === 0 ? (
          <p>Todavía no hay ejercicios. Agregá el primero arriba.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th></th><th>Ejercicio</th><th>Grupo</th><th>Descripción</th><th></th></tr>
              </thead>
              <tbody>
                {visibles.map((e) => (
                  <tr key={e.id}>
                    <td>{e.imagenUrl ? <img className="ej-thumb" src={e.imagenUrl} alt="" /> : null}</td>
                    <td>{e.nombre}</td>
                    <td>{etiqueta(e.grupoMuscular)}</td>
                    <td>{e.descripcion || ''}</td>
                    <td>
                      <div className="acciones">
                        <button className="btn-sec" onClick={() => editar(e)}>Editar</button>
                        <button className="btn-sec" onClick={() => borrar(e)}>Borrar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
