export const telefonoValido = (t) => String(t || '').split('').filter((c) => c >= '0' && c <= '9').length >= 8;

export function waLink(tel, texto) {
  let n = String(tel).split('').filter((c) => c >= '0' && c <= '9').join('');
  while (n.startsWith('0')) n = n.slice(1);
  if (n.startsWith('54') && !n.startsWith('549')) n = '549' + n.slice(2);
  if (!n.startsWith('54')) n = '549' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
}
