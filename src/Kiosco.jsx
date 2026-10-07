import { useEffect, useState } from 'react';
import { apiGet, apiPost } from './api';

export default function Kiosco({ token }) {
  const [est, setEst] = useState(null);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  const cargar = () => {
    apiGet('/api/kiosco/estado', token).then(setEst).catch(() => setError('No se pudo cargar.'));
  };

  useEffect(() => { cargar(); }, [token]);

  const accion = async (ruta, confirmar) => {
    setError('');
    setCopiado(false);
    if (confirmar && !window.confirm(confirmar)) return;
    try {
      setEst(await apiPost('/api/kiosco/' + ruta, token, {}));
    } catch (e) {
      setError('No se pudo completar la acción.');
    }
  };

  const enlace = est && est.token ? window.location.origin + '/kiosco?k=' + est.token : '';

  const copiar = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(enlace).then(() => setCopiado(true));
  };

  return (
    <section className="panel">
      <h2>Ingreso solo con DNI</h2>
      <p>Pensado para una PC o tablet en la recepción: el socio escribe su DNI con el teclado y se registra su entrada. Útil para quien se olvidó el celular. Si la cuota está vencida, no entra.</p>
      <p>Cualquiera que tenga el enlace y sepa el DNI de un socio puede registrar su entrada, así que dejalo abierto solo en el dispositivo del gimnasio y no lo compartas. Si se filtra, generá uno nuevo y el anterior deja de funcionar.</p>
      {error && <p className="error">{error}</p>}
      {est && !est.activo && (
        <button className="btn-pri" onClick={() => accion('activar')}>Activar ingreso con DNI</button>
      )}
      {est && est.activo && (
        <>
          <p><b>Estado:</b> activado</p>
          <input className="campo" readOnly value={enlace} onFocus={(e) => e.target.select()} />
          <button className="btn-pri" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar enlace'}</button>
          <button className="btn-sec" onClick={() => accion('activar', 'Se genera un enlace nuevo y el anterior deja de funcionar. ¿Continuar?')}>Generar enlace nuevo</button>
          <button className="btn-sec" onClick={() => accion('desactivar', 'El enlace actual deja de funcionar. ¿Desactivar el ingreso con DNI?')}>Desactivar</button>
        </>
      )}
    </section>
  );
}
