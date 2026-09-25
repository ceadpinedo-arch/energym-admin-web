import { useState } from 'react';
import { API_URL } from './api';

export default function CheckIn() {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setResultado(null);
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/api/asistencias/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, password }),
      });
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ permitido: false, motivo: 'Error de conexión' });
    } finally {
      setEnviando(false);
      setPassword('');
    }
  };

  return (
    <div className="checkin-wrap">
      <form className="checkin-card" onSubmit={enviar}>
        <h1>Energym</h1>
        <p className="checkin-sub">Ingresá tu DNI y contraseña para entrar</p>
        <input placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value)} inputMode="numeric" />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={enviando}>{enviando ? 'Verificando...' : 'Entrar'}</button>

        {resultado && (
          <div className={`checkin-resultado ${resultado.permitido ? 'ok' : 'error'}`}>
            {resultado.permitido
              ? `✔ Bienvenido, ${resultado.nombre}`
              : `✖ ${resultado.motivo}`}
          </div>
        )}
      </form>
    </div>
  );
}
