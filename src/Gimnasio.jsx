import { useState } from 'react';
import { apiPatch } from './api';

export default function Gimnasio({ token, gimnasio, onUpdate }) {
  const [nombre, setNombre] = useState(gimnasio?.nombre || '');
  const [logoPreview, setLogoPreview] = useState(gimnasio?.logoUrl || null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const elegirLogo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setLogoBase64(reader.result);
    };
    reader.readAsDataURL(archivo);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const body = { nombre };
      if (logoBase64) body.logoBase64 = logoBase64;
      const data = await apiPatch('/api/gimnasio/me', token, body);
      onUpdate(data);
      setLogoBase64(null);
      alert('Guardado');
    } catch (e) {
      alert('No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="panel gimnasio-panel">
      <h2>Datos del gimnasio</h2>
      <div className="logo-wrap">
        {logoPreview ? (
          <img src={logoPreview} alt="Logo" className="logo-preview" />
        ) : (
          <div className="logo-preview logo-vacio">Sin logo</div>
        )}
        <label className="boton-archivo">
          Cambiar logo
          <input type="file" accept="image/*" onChange={elegirLogo} hidden />
        </label>
      </div>
      <label>Nombre del gimnasio</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
    </div>
  );
}
