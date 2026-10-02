export const MENSAJE_POR_DEFECTO = 'Hola {nombre}! Te damos la bienvenida a {gimnasio} 💪 Desde nuestra app vas a poder ver tus rutinas, tus pagos y registrar tu asistencia.\n{link}';

export function armarBienvenida(gimnasio, nombreSocio) {
  const base = (gimnasio && gimnasio.mensajeBienvenida) || MENSAJE_POR_DEFECTO;
  const primero = String(nombreSocio || '').trim().split(' ')[0];
  const enlace = gimnasio && gimnasio.linkApp ? gimnasio.linkApp : '';
  const bloqueLink = enlace ? 'Descargala acá: ' + enlace : '';
  let t = base.split('{nombre}').join(primero).split('{gimnasio}').join((gimnasio && gimnasio.nombre) || 'el gimnasio');
  if (t.indexOf('{link}') >= 0) t = t.split('{link}').join(bloqueLink);
  else if (bloqueLink) t = t + '\n' + bloqueLink;
  return t.trim();
}
