import { useState } from 'react';
import { apiPatch } from './api';

export default function Gimnasio({ token, gimnasio, onUpdate }) {
  const [nombre, setNombre] = useState(gimnasio?.nombre || '');
  const [logoPreview, setLogoPreview] = useState(gimnasio?.logoUrl || null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cuota, setCuota] = useState(gimnasio?.cuota ? String(gimnasio.cuota) : '');
  const [whatsapp, setWhatsapp] = useState(gimnasio?.whatsapp || '');
  const [instagram, setInstagram] = useState(gimnasio?.instagram || '');
  const [alias, setAlias] = useState(gimnasio?.alias || '');
  const [cbu, setCbu] = useState(gimnasio?.cbu || '');
  const [linkApp, setLinkApp] = useState(gimnasio?.linkApp || '');
  const [mensajeBienvenida, setMensajeBienvenida] = useState(gimnasio?.mensajeBienvenida || '');

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
      const cuotaNum = Number(String(cuota).replace(/\D/g, ''));
      if (!cuotaNum) { alert('Ingresá una cuota válida'); return; }
      const cbuLimpio = String(cbu).replace(/\D/g, '');
  if (cbuLimpio && cbuLimpio.length !== 22) { alert('El CBU debe tener 22 dígitos'); return; }
  const body = { nombre, cuota: cuotaNum, whatsapp, instagram, alias, cbu, linkApp, mensajeBienvenida };
      if (logoBase64) body.logoBase64 = logoBase64;
      const data = await apiPatch('/api/gimnasio/me', token, body);
      onUpdate(data);
  setWhatsapp(data.whatsapp || '');
  setInstagram(data.instagram || '');
  setAlias(data.alias || '');
  setCbu(data.cbu || '');
  setLinkApp(data.linkApp || '');
  setMensajeBienvenida(data.mensajeBienvenida || '');
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
        <label>Cuota mensual ($)</label>
        <input inputMode="numeric" value={cuota} onChange={(e) => setCuota(e.target.value)} />
    <label>WhatsApp (con código de país, ej. 5493511234567)</label>
    <input inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
    <label>Instagram (usuario o link)</label>
    <input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
    <label>Alias para transferencias</label>
    <input value={alias} onChange={(e) => setAlias(e.target.value)} />
    <label>CBU (22 dígitos)</label>
    <input inputMode="numeric" value={cbu} onChange={(e) => setCbu(e.target.value)} />
    <label>Enlace de Play Store (se agrega cuando la app esté publicada)</label>
    <input value={linkApp} placeholder="https://play.google.com/store/apps/details?id=..." onChange={(e) => setLinkApp(e.target.value)} />
    <label>Mensaje de bienvenida (variables: {'{nombre}'}, {'{gimnasio}'}, {'{link}'})</label>
    <textarea rows={5} value={mensajeBienvenida} placeholder="Si lo dejás vacío se usa el mensaje por defecto" onChange={(e) => setMensajeBienvenida(e.target.value)} />
      <button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
    </div>
  );
}
