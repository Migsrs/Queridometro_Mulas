/**
 * Lista de participantes do BBB 26.
 *
 * Para adicionar fotos:
 *  1. Coloque os arquivos em: public/fotos/
 *     Ex: public/fotos/lucas.jpg
 *  2. Preencha o campo `photo` com o caminho relativo:
 *     Ex: photo: '/fotos/lucas.jpg'
 *
 * Enquanto `photo` for null, aparece um avatar com as iniciais do nome.
 */
export const participants = [
  { id: 1,  name: 'Isabelle',       photo: '/fotos/isabelle.jpg'       },
  { id: 2,  name: 'Miguel',         photo: '/fotos/miguel.jpg'         },
  { id: 3,  name: 'Carlos Eduardo', photo: '/fotos/carlos_eduardo.jpg' },
  { id: 4,  name: 'Erick',          photo: '/fotos/erick.jpg'          },
  { id: 5,  name: 'Lucas',          photo: '/fotos/lucas.jpg'          },
  { id: 6,  name: 'Roger',          photo: '/fotos/roger.jpg'          },
  { id: 7,  name: 'Thais Marques',  photo: '/fotos/thais_marques.jpg'  },
  { id: 8,  name: 'Yuri',           photo: '/fotos/yuri.jpg'           },
  { id: 9,  name: 'Thainá',         photo: '/fotos/thayna.jpg'         },
  { id: 10, name: 'Luan',           photo: '/fotos/luan.jpg'           },
  { id: 11, name: 'Lethissia',      photo: '/fotos/lethissia.jpg'      },
  { id: 12, name: 'Pastel',         photo: '/fotos/branquel.jpg'       },
]

/** 8 sentimentos do queridômetro BBB 26. */
export const sentiments = [
  { key: 'amo',       label: 'Amo',       emoji: '❤️',  color: '#ff4d8d' },
  { key: 'odeio',     label: 'Odeio',     emoji: '💔',  color: '#e63946' },
  { key: 'mentiroso', label: 'Mentiroso', emoji: '🤥',  color: '#ff8c00' },
  { key: 'mala',      label: 'Mala',      emoji: '🧳',  color: '#9c27b0' },
  { key: 'cobra',     label: 'Cobra',     emoji: '🐍',  color: '#4caf50' },
  { key: 'nojo',      label: 'Nojo',      emoji: '🤢',  color: '#8bc34a' },
  { key: 'planta',    label: 'Planta',    emoji: '🌱',  color: '#607d8b' },
  { key: 'bomba',     label: 'Bomba',     emoji: '💣',  color: '#ff5722' },
]

/** Retorna as iniciais de um nome (máx 2 letras). */
export function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

/** Cor de avatar gerada a partir do nome (determinística). */
const AVATAR_COLORS = [
  '#e63946', '#f5c518', '#4caf50', '#2196f3', '#9c27b0',
  '#ff5722', '#00bcd4', '#795548', '#607d8b', '#e91e63',
]
export function getAvatarColor(name) {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
