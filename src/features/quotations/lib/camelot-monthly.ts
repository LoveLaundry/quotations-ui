/**
 * Monthly inventory source data from `camelot 2026 complete.ods`.
 * Generated from the workbook — day cells are indexed 0..30 for days 1..31.
 * Blank cells are `null`; spreadsheet error cells are `null` with a note.
 * The November sheet heading still says OCTOBER; the tab name is used here.
 */

export type CamelotMonthId = 'october' | 'november'

export interface CamelotMonthlyItem {
  name: string
  /** 31 entries — daily counts for days 1..31. */
  daily: Array<number | null>
  total: number | null
  rate: number | null
  cost: number | null
  note?: string
}

export interface CamelotMonthlySection {
  id: string
  title: string
  items: CamelotMonthlyItem[]
}

export interface CamelotMonthlySheet {
  id: CamelotMonthId
  label: string
  sections: CamelotMonthlySection[]
}

export const CAMELOT_MONTHLY_SHEETS: CamelotMonthlySheet[] = [
  {
    id: "october",
    label: "October",
    sections: [
      {
        id: "uniform",
        title: "Uniform Inventory",
        items: [
          { name: "Kitchen Coat", daily: [15, 14, 13, 20, 18, 9, 14, 17, 13, 10, 24, 19, 12, 12, 16, 13, 18, 23, 15, 20, 16, 12, 14, 11, 23, 16, 12, 11, 12, 15, 11], total: 468, rate: 80, cost: 37440, },
          { name: "Kitchen Apron", daily: [5, 2, 5, 5, 9, 2, 3, 8, 5, 7, 4, 8, 4, 2, 4, 2, 2, 7, 4, 7, 4, 6, 4, 4, 3, 9, 2, 5, 5, 2, 1], total: 140, rate: 35, cost: 4900, },
          { name: "Kitchen Duster", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 0, rate: 25, cost: 0, },
          { name: "Kitchen Trouser", daily: [6, 8, 4, 10, 6, 4, 5, 10, 4, 4, 11, 7, 9, 4, 9, 4, 7, 10, 7, 8, 9, 6, 6, 6, 8, 9, 6, 2, 6, 6, 4], total: 205, rate: 75, cost: 15375, },
          { name: "Black Trouser", daily: [13, 7, 13, 9, 14, 8, 8, 9, 11, 10, 11, 13, 8, 8, 8, 12, 11, 14, 10, 9, 9, 9, 10, 8, 8, 12, 6, 11, 5, 8, 8], total: 300, rate: 75, cost: 22500, },
          { name: "Kit Blue Trouser", daily: [8, 4, 6, 3, 3, 4, 5, 4, 4, 5, 4, 4, 2, 4, 3, 6, 6, 8, 7, 5, 5, 5, 3, 3, 9, 6, 6, 6, 5, 4, 5], total: 152, rate: 75, cost: 11400, },
          { name: "Kit .Blue T - Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Kit Blue Shirts", daily: [8, 4, 6, 3, 3, 4, 5, 4, 4, 5, 4, 4, 3, 4, 3, 6, 6, 8, 7, 6, 5, 5, 3, 3, 9, 6, 6, 6, 5, 4, 5], total: 154, rate: 80, cost: 12320, },
          { name: "Garden Trouser", daily: [3, 4, 3, 3, 3, 3, 2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 3, 4], total: 79, rate: 75, cost: 5925, },
          { name: "Garden Shirts", daily: [3, 4, 3, 3, 3, 3, 2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 3, 3, 3, 4], total: 79, rate: 80, cost: 6320, },
          { name: "Eng Trouser Brown", daily: [5, 6, 5, 6, 6, 5, 7, 6, 8, 5, 9, 9, 6, 9, 7, 5, 7, 9, 5, 6, 7, 6, 6, 8, 6, 6, 7, 6, 6, 6, 6], total: 201, rate: 75, cost: 15075, },
          { name: "Eng Shirts Brown", daily: [5, 6, 5, 6, 6, 5, 7, 6, 8, 5, 9, 9, 6, 9, 7, 5, 7, 9, 5, 6, 7, 6, 5, 8, 6, 6, 7, 6, 6, 6, 6], total: 200, rate: 80, cost: 16000, },
          { name: "H.K.L Blue Shirts", daily: [8, 9, 11, 8, 8, 8, 10, 8, 11, 6, 9, 9, 8, 8, 7, 11, 10, 10, 9, 8, 8, 8, 7, 8, 6, 9, 7, 7, 6, 7, 7], total: 256, rate: 80, cost: 20480, },
          { name: "H.K.L.Blue T-Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Red T-Shirts", daily: [3, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1, null, null, 2, 1, 1, 1, 2, 1, 6, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0], total: 34, rate: 65, cost: 2210, },
          { name: "Red Shirts", daily: [1, 2, 1, 1, 1, 1, null, 1, 1, 1, 1, 2, 2, null, 1, null, 1, 1, 1, 1, 1, null, 1, 1, 0, 1, 1, 1, 0, 2, 0], total: 28, rate: 80, cost: 2240, },
          { name: "Grey Shirts", daily: [1, 1, 1, 2, 2, 3, 1, 2, 1, 1, 3, 1, 4, null, 1, 4, 4, 4, 4, 3, 1, 2, 1, 1, 4, 4, 4, 2, 4, 2, 2], total: 70, rate: 80, cost: 5600, },
          { name: "Orange Shirts", daily: [2, 1, 2, 2, 2, 2, 2, 2, 2, 4, 3, 2, 3, 2, 2, 2, 8, 5, 3, 6, 2, 3, 1, 1, 8, 3, 3, 3, 2, 2, 0], total: 85, rate: 80, cost: 6800, },
          { name: "F/O Shirts Brown", daily: [1, 1, 3, 2, 2, 2, 2, 3, 3, 6, 1, null, 1, 5, 1, 1, 2, 6, 3, 2, 1, 1, 0, 1, 5, 1, 4, 2, 1, 2, 1], total: 66, rate: 80, cost: 5280, },
          { name: "Pool T-Shirts", daily: [5, 6, 7, 7, 4, 5, 7, 4, 3, 1, 4, 6, 4, 4, 7, 6, 4, 9, 5, 4, 5, 6, 6, 5, 5, 4, 5, 7, 6, 6, 5], total: 162, rate: 65, cost: 10530, },
          { name: "Pool Shorts", daily: [3, 3, 3, 4, 3, 3, 3, 2, 2, 2, 3, 3, 2, 3, 3, 3, 3, 4, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2], total: 89, rate: 60, cost: 5340, },
          { name: "White Shirts", daily: [3, null, 1, 2, 1, null, null, 2, 1, 1, 4, 2, null, 1, null, 1, 1, 3, 1, 1, 2, 2, 1, 0, 2, 2, 1, 2, 2, 2, 0], total: 41, rate: 80, cost: 3280, },
          { name: "Acc Shirts", daily: [3, 3, 6, 3, 4, 4, 3, 4, 4, 2, 3, 2, 3, 5, 3, 4, 5, 2, 3, 3, 3, 2, 4, 3, 4, 2, 4, 2, 2, 4, 4], total: 103, rate: 80, cost: 8240, },
          { name: "Duck Blue T-Shirt", daily: [4, 1, 1, 4, 3, null, null, 4, null, 2, 1, 2, 1, null, null, null, 1, 2, 5, 3, null, null, 0, 1, 2, 1, 0, 0, 0, 0, 2], total: 40, rate: 65, cost: 2600, },
          { name: "Orange T-Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Exec Trouser Cream", daily: [10, 7, 8, 9, 8, 4, 4, 6, 8, 7, 6, 9, 5, 8, 6, 7, 10, 9, 7, 4, 7, 6, 6, 6, 8, 8, 6, 7, 6, 6, 7], total: 215, rate: 75, cost: 16125, },
          { name: "Exec Shirts L Blue", daily: [8, 7, 7, 6, 7, 5, 4, 5, 10, 6, 5, 8, 7, 7, 6, 9, 9, 6, 8, 4, 7, 6, 8, 6, 7, 6, 8, 7, 7, 6, 9], total: 211, rate: 80, cost: 16880, },
          { name: "Exec Shirts D Blue", daily: [null, null, null, null, null, null, null, null, null, 1, null, null, null, null, null, null, null, null, 1, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 2, rate: 80, cost: 160, },
          { name: "Exec Shirts Maroon", daily: [2, 1, 1, 3, 3, 2, 1, 3, 1, 2, 4, 2, null, 1, null, 2, 2, null, 4, 1, 2, 1, 2, 1, 2, 2, 3, 0, 1, 0, 4], total: 53, rate: 80, cost: 4240, },
          { name: "Wraparound", daily: [null, 1, null, 1, null, 1, null, null, null, null, 1, 1, 1, 1, null, 2, null, 2, null, 2, 2, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 15, rate: 75, cost: 1125, },
          { name: "Blouse", daily: [1, 1, 1, 1, 1, 1, null, null, null, null, 2, 1, 2, 1, 1, 2, null, 2, 1, 3, 2, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 23, rate: 65, cost: 1495, },
          { name: "Cap", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 5, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 5, rate: 60, cost: 300, },
          { name: "Sarong", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 0, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
          { name: "Vest", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 0, rate: 40, cost: 0, },
          { name: "Saree", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 320, cost: 0, },
          { name: "Resturant Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 80, cost: 0, },
          { name: "Bottom", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 1, rate: 75, cost: 75, },
          { name: "Jersey", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
        ],
      },
      {
        id: "housekeeping",
        title: "Housekeeping Linen",
        items: [
          { name: "Bed Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Chair Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Balcony Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "H/K Duster", daily: [null, 21, 10, null, null, null, 43, null, 11, null, 32, 10, null, 16, null, null, null, 1, 32, null, null, null, null, null, 30, null, null, null, 11, null, null], total: 217, rate: 19, cost: 4123, },
          { name: "Mop Cloth", daily: [null, 2, 1, null, null, null, null, null, null, null, 2, null, null, null, null, null, null, 2, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 7, rate: 25, cost: 175, },
          { name: "Flags", daily: [0, 23, 11, 0, null, 0, 43, 0, 11, 0, 34, 10, 0, 16, 0, 0, 0, 3, 32, 0, 0, 0, 0, 0, 30, 0, 0, 0, 11, 0, null], total: 224, rate: 60, cost: 13440, },
          { name: "Pillows", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 70, cost: 0, },
          { name: "Curtain", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 350, cost: 0, },
        ],
      },
      {
        id: "room-linen",
        title: "Room Linen",
        items: [
          { name: "Bed Sheet (S)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Bed Sheet (D)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Duvet Cover (S)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 110, cost: 0, },
          { name: "Duvet Cover (D)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 110, cost: 0, },
          { name: "Pillow Case", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 35, cost: 0, },
          { name: "Face Towel", daily: [null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null], total: 0, rate: 45, cost: 0, },
          { name: "Bath Towel", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 70, cost: 0, },
          { name: "Bath Mat", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 45, cost: 0, },
        ],
      },
      {
        id: "fb",
        title: "F & B Linen Inventory",
        items: [
          { name: "Table Cloth", daily: [20, 5, 1, 15, 28, null, 221, null, 4, null, 17, 28, null, 2, null, null, null, 77, 20, null, 6, null, null, null, 61, null, null, 24, 57, null, null], total: 586, rate: 62, cost: 36332, },
          { name: "Serviette", daily: [null, null, 322, 71, null, null, null, null, 96, null, 464, null, null, 276, null, null, null, 530, 3, null, 439, null, null, null, 462, null, null, 469, 115, null, null], total: 3247, rate: 21, cost: 68187, },
          { name: "Chair Cover (White)", daily: [null, 33, null, 23, null, null, null, null, null, null, null, null, null, null, null, null, null, 36, null, null, null, null, null, null, 1, null, null, null, 45, null, null], total: 138, rate: 35, cost: 4830, },
          { name: "Chair Band", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 17, cost: 0, },
          { name: "Cushion Chair Cover", daily: [null, null, null, null, 23, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 23, rate: 150, cost: 3450, },
          { name: "Duster F&B", daily: [null, null, 14, null, 2, null, 10, null, 8, null, 11, null, null, 5, null, null, null, 10, null, null, null, null, null, null, 18, null, null, 15, null, null, null], total: 93, rate: 19, cost: 1767, },
          { name: "Glass Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 25, cost: 0, },
          { name: "Frill Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 150, cost: 0, },
          { name: "Satin Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 100, cost: 0, },
          { name: "Table Runner", daily: [null, null, null, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, 2, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 3, rate: 60, cost: 180, },
          { name: "Curtain (Romantic)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 350, cost: 0, },
          { name: "Table Cloth Rexing Black", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: null, rate: 150, cost: null, note: "Source errors: Err:522 in 1, Err:522 in 2, Err:522 in 3, Err:522 in 4, Err:522 in 5, Err:522 in 6, Err:522 in 7, Err:522 in 8, Err:522 in 9, Err:522 in 10, Err:522 in 11, Err:522 in 12, Err:522 in 13, Err:522 in 14, Err:522 in 15, Err:522 in 16, Err:522 in 17, Err:522 in 18, Err:522 in 19, Err:522 in 20, Err:522 in 21, Err:522 in 22, Err:522 in 23, Err:522 in 24, Err:522 in 25, Err:522 in 26, Err:522 in 27, Err:522 in 28, Err:522 in 29, Err:522 in 30, Err:522 in 31, Err:522 in Total, Err:522 in Cost", },
          { name: "Tray Mat", daily: [null, null, 3, null, null, null, null, null, 1, null, null, null, null, 8, null, null, null, 2, null, null, 1, null, null, null, null, null, null, null, null, null, null], total: 15, rate: 27, cost: 405, },
          { name: "Slip Cloth", daily: [3, null, null, null, 12, null, null, null, 1, null, 4, 3, null, null, null, null, null, 16, null, null, null, null, null, null, 3, null, null, 1, 5, null, null], total: 48, rate: 40, cost: 1920, },
          { name: "Water Bottle Bags", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
        ],
      },
      {
        id: "pressing",
        title: "Pressing Only",
        items: [
          { name: "Table Cloth ( Pressing Only )", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 40, cost: 0, },
          { name: "Table Runner ( Pressing Only )", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 20, cost: 0, },
        ],
      },
    ],
  },
  {
    id: "november",
    label: "November",
    sections: [
      {
        id: "uniform",
        title: "Uniform Inventory",
        items: [
          { name: "Kitchen Coat", daily: [22, 21, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 43, rate: 80, cost: 3440, },
          { name: "Kitchen Apron", daily: [6, 9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 15, rate: 35, cost: 525, },
          { name: "Kitchen Duster", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 25, cost: 0, },
          { name: "Kitchen Trouser", daily: [12, 11, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 23, rate: 75, cost: 1725, },
          { name: "Black Trouser", daily: [12, 11, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 23, rate: 75, cost: 1725, },
          { name: "Kit Blue Trouser", daily: [7, 6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 13, rate: 75, cost: 975, },
          { name: "Kit .Blue T - Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Kit Blue Shirts", daily: [7, 6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 13, rate: 80, cost: 1040, },
          { name: "Garden Trouser", daily: [3, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 8, rate: 75, cost: 600, },
          { name: "Garden Shirts", daily: [4, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 9, rate: 80, cost: 720, },
          { name: "Eng Trouser Brown", daily: [8, 8, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 16, rate: 75, cost: 1200, },
          { name: "Eng Shirts Brown", daily: [8, 9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 17, rate: 80, cost: 1360, },
          { name: "H.K.L Blue Shirts", daily: [9, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 19, rate: 80, cost: 1520, },
          { name: "H.K.L.Blue T-Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Red T-Shirts", daily: [1, 1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: 65, cost: 130, },
          { name: "Red Shirts", daily: [1, 2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 3, rate: 80, cost: 240, },
          { name: "Grey Shirts", daily: [9, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 12, rate: 80, cost: 960, },
          { name: "Orange Shirts", daily: [8, 4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 12, rate: 80, cost: 960, },
          { name: "F/O Shirts Brown", daily: [4, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 7, rate: 80, cost: 560, },
          { name: "Pool T-Shirts", daily: [7, 7, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 14, rate: 65, cost: 910, },
          { name: "Pool Shorts", daily: [4, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 7, rate: 60, cost: 420, },
          { name: "White Shirts", daily: [2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: 80, cost: 160, },
          { name: "Acc Shirts", daily: [2, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 7, rate: 80, cost: 560, },
          { name: "Duck Blue T-Shirt", daily: [null, 2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: 65, cost: 130, },
          { name: "Orange T-Shirt", daily: [2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: 65, cost: 130, },
          { name: "Exec Trouser Cream", daily: [9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 9, rate: 75, cost: 675, },
          { name: "Exec Shirts L Blue", daily: [8, 6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 14, rate: 80, cost: 1120, },
          { name: "Exec Shirts D Blue", daily: [1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 1, rate: 80, cost: 80, },
          { name: "Exec Shirts Maroon", daily: [3, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 6, rate: 80, cost: 480, },
          { name: "Wraparound", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 75, cost: 0, },
          { name: "Blouse", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 65, cost: 0, },
          { name: "Cap", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 60, cost: 0, },
          { name: "Sarong", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
          { name: "Vest", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 40, cost: 0, },
          { name: "Saree", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 320, cost: 0, },
          { name: "Resturant Shirt", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 80, cost: 0, },
          { name: "Bottom", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 75, cost: 0, },
          { name: "Jersey", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
        ],
      },
      {
        id: "housekeeping",
        title: "Housekeeping Linen",
        items: [
          { name: "Bed Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Chair Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Balcony Cushion Cover", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "H/K Duster", daily: [null, 25, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 25, rate: 19, cost: 475, },
          { name: "Mop Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 25, cost: 0, },
          { name: "Flags", daily: [0, 25, 0, 0, null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null], total: 25, rate: 60, cost: 1500, },
          { name: "Pillows", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 70, cost: 0, },
          { name: "Curtain", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 350, cost: 0, },
        ],
      },
      {
        id: "room-linen",
        title: "Room Linen",
        items: [
          { name: "Bed Sheet (S)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Bed Sheet (D)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 90, cost: 0, },
          { name: "Duvet Cover (S)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 110, cost: 0, },
          { name: "Duvet Cover (D)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 110, cost: 0, },
          { name: "Pillow Case", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 35, cost: 0, },
          { name: "Face Towel", daily: [null, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null], total: 0, rate: 45, cost: 0, },
          { name: "Bath Towel", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 70, cost: 0, },
          { name: "Bath Mat", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 45, cost: 0, },
        ],
      },
      {
        id: "fb",
        title: "F & B Linen Inventory",
        items: [
          { name: "Table Cloth", daily: [null, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 10, rate: 62, cost: 620, },
          { name: "Serviette", daily: [null, 384, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 384, rate: 21, cost: 8064, },
          { name: "Chair Cover (White)", daily: [null, 13, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 13, rate: 35, cost: 455, },
          { name: "Chair Band", daily: [null, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 3, rate: 17, cost: 51, },
          { name: "Cushion Chair Cover", daily: [null, 12, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 12, rate: 150, cost: 1800, },
          { name: "Duster F&B", daily: [null, 6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 6, rate: 19, cost: 114, },
          { name: "Glass Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 25, cost: 0, },
          { name: "Frill Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 150, cost: 0, },
          { name: "Satin Cloth", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 100, cost: 0, },
          { name: "Table Runner", daily: [null, 3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 3, rate: 60, cost: 180, },
          { name: "Curtain (Romantic)", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 350, cost: 0, },
          { name: "Table Cloth Rexing Black", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: null, rate: 150, cost: null, note: "Source errors: Err:522 in 1, Err:522 in 2, Err:522 in 3, Err:522 in 4, Err:522 in 5, Err:522 in 6, Err:522 in 7, Err:522 in 8, Err:522 in 9, Err:522 in 10, Err:522 in 11, Err:522 in 12, Err:522 in 13, Err:522 in 14, Err:522 in 15, Err:522 in 16, Err:522 in 17, Err:522 in 18, Err:522 in 19, Err:522 in 20, Err:522 in 21, Err:522 in 22, Err:522 in 23, Err:522 in 24, Err:522 in 25, Err:522 in 26, Err:522 in 27, Err:522 in 28, Err:522 in 29, Err:522 in 30, Err:522 in 31, Err:522 in Total, Err:522 in Cost", },
          { name: "Tray Mat", daily: [null, null, 3, null, null, null, null, null, 1, null, null, null, null, 8, null, null, null, 2, null, null, 1, null, null, null, null, null, null, null, null, null, null], total: 15, rate: 27, cost: 405, },
          { name: "Slip Cloth", daily: [3, null, null, null, 12, null, null, null, 1, null, 4, 3, null, null, null, null, null, 16, null, null, null, null, null, null, 3, null, null, 1, 5, null, null], total: 48, rate: 40, cost: 1920, },
          { name: "Water Bottle Bags", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, 1, null, null, null, 1, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 2, rate: null, cost: 0, note: "Rate not supplied in source sheet", },
        ],
      },
      {
        id: "pressing",
        title: "Pressing Only",
        items: [
          { name: "Table Cloth ( Pressing Only )", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 40, cost: 0, },
          { name: "Table Runner ( Pressing Only )", daily: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], total: 0, rate: 20, cost: 0, },
        ],
      },
    ],
  },
]

export const CAMELOT_MONTH_IDS: CamelotMonthId[] = ['october', 'november']

/** Stable edit key for one daily cell. */
export function camelotCellKey(
  month: CamelotMonthId,
  sectionId: string,
  rowIndex: number,
  dayIndex: number,
): string {
  return `${month}:${sectionId}:${rowIndex}:${dayIndex}`
}

/** Stable edit key for one rate cell. */
export function camelotRateKey(
  month: CamelotMonthId,
  sectionId: string,
  rowIndex: number,
): string {
  return `${month}:${sectionId}:${rowIndex}:rate`
}

/** Values used to initialise the editable grid from the source workbook. */
export function camelotInitialEdits(month: CamelotMonthId): Record<string, string> {
  const edits: Record<string, string> = {}
  const sheet = CAMELOT_MONTHLY_SHEETS.find((entry) => entry.id === month)
  for (const section of sheet?.sections ?? []) {
    section.items.forEach((item, rowIndex) => {
      item.daily.forEach((value, dayIndex) => {
        if (value !== null) {
          edits[camelotCellKey(month, section.id, rowIndex, dayIndex)] = String(value)
        }
      })
      if (item.rate !== null) {
        edits[camelotRateKey(month, section.id, rowIndex)] = String(item.rate)
      }
    })
  }
  return edits
}

export interface CamelotComputedRow {
  total: number
  rate: number
  cost: number
}

/** Recalculate an inventory row from the current grid edits. */
export function camelotComputeRow(
  item: CamelotMonthlyItem,
  month: CamelotMonthId,
  sectionId: string,
  rowIndex: number,
  edits: Record<string, string>,
): CamelotComputedRow {
  let total = 0
  for (let dayIndex = 0; dayIndex < 31; dayIndex += 1) {
    const raw = edits[camelotCellKey(month, sectionId, rowIndex, dayIndex)]
    const value = Number(raw)
    if (raw !== undefined && raw.trim() !== '' && Number.isFinite(value)) total += value
  }
  const rateRaw = edits[camelotRateKey(month, sectionId, rowIndex)]
  const rate = rateRaw !== undefined && rateRaw.trim() !== '' && Number.isFinite(Number(rateRaw))
    ? Number(rateRaw)
    : (item.rate ?? 0)
  return { total, rate, cost: Math.round(total * rate * 100) / 100 }
}

export function camelotSheetItemCount(month: CamelotMonthId): number {
  const sheet = CAMELOT_MONTHLY_SHEETS.find((entry) => entry.id === month)
  return sheet?.sections.reduce((sum, section) => sum + section.items.length, 0) ?? 0
}
