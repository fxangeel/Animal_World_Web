// Datos del negocio que pueden cambiar. Completar cuando estén definidos.
export const CONFIG = {
  brand: 'Animal World',
  // Número de WhatsApp en formato internacional sin "+" ni espacios (ej.: '584120000000').
  // Vacío = el mensaje se abre en WhatsApp para elegir el contacto manualmente.
  whatsapp: '',
  email: '',
  instagram: '',
  shipping: 3,
  cities: ['Maracay', 'Turmero', 'Cagua', 'La Victoria'],
  payments: ['Pago Móvil', 'Binance', 'Tarjeta (a coordinar)'],
  pets: ['Perros', 'Gatos', 'Aves', 'Peces', 'Pequeños', 'Reptiles'],
  categories: ['Alimentos', 'Juguetes', 'Accesorios', 'Higiene', 'Cuidado'],
  priceRanges: [['0-10', 'Hasta 10 $'], ['10.01-25', 'De 10 $ a 25 $'], ['25.01-', 'Más de 25 $']]
};

export const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
