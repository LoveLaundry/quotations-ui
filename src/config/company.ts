export const COMPANY = {
  name: 'Love Laundry',
  tagline: 'and dry cleaning experts',
  registrationNo: '40-3064',
  address: {
    line1: 'Medagama, Panirendawa',
    line2: 'Chilaw, Puttalam, Sri Lanka',
  },
  phone: {
    primary: '077-2400919',
    secondary: '071-2978922',
  },
  email: 'lovelaundry01@gmail.com',
  whatsapp: 'https://wa.me/94772400919',
  facebook: 'https://www.facebook.com/lovelaundrylk',
  googleMaps: 'https://maps.app.goo.gl/LoveLaundryLocation',
} as const

export const QUOTATION_CONDITIONS = [
  'Prices are valid for 30 days from the date of quotation.',
  'Quotation is subject to change without prior notice.',
  'All items are subject to availability at time of order.',
  'Payment terms: 50% advance, balance on delivery.',
  'Any disputes are subject to Colombo jurisdiction.',
] as const