// app/config/presets.js

export const PRESET_DATA = {
  toyota: {
    name: 'Toyota',
    models: [
      {
        id: 'vitz',
        name: 'Vitz',
        bodyType: 'Hatchback',
        engine: '1.3L 4-Cylinder',
        years: {
          2021: { hdv: 785711, currency: 'JPY', origin: 'Japan' },
          2020: { hdv: 748297, currency: 'JPY', origin: 'Japan' },
          2019: { hdv: 1323825, currency: 'JPY', origin: 'Japan' },
          2018: { hdv: 1279058, currency: 'JPY', origin: 'Japan' },
          2017: { hdv: 1235805, currency: 'JPY', origin: 'Japan' },
          2016: { hdv: 1194014, currency: 'JPY', origin: 'Japan' },
          2015: { hdv: 1153637, currency: 'JPY', origin: 'Japan' },
          2014: { hdv: 1153637, currency: 'JPY', origin: 'Japan' },
          2013: { hdv: 1095955, currency: 'JPY', origin: 'Japan' },
          2012: { hdv: 815455,  currency: 'JPY', origin: 'Japan' },
          2011: { hdv: 989099,  currency: 'JPY', origin: 'Japan' },
          2010: { hdv: 824997,  currency: 'JPY', origin: 'Japan' },
          2009: { hdv: 785711,  currency: 'JPY', origin: 'Japan' }
        }
      },
      {
        id: 'corolla',
        name: 'Corolla',
        bodyType: 'Sedan',
        engine: '1.8L 4-Cylinder',
        years: {
          2024: { hdv: 22000, currency: 'USD', origin: 'USA' },
          2023: { hdv: 21500, currency: 'USD', origin: 'USA' },
          2022: { hdv: 20800, currency: 'USD', origin: 'USA' },
          2021: { hdv: 20000, currency: 'USD', origin: 'USA' },
          2020: { hdv: 19600, currency: 'USD', origin: 'USA' },
          2019: { hdv: 18700, currency: 'USD', origin: 'USA' },
          2018: { hdv: 17500, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'yaris',
        name: 'Yaris',
        bodyType: 'Hatchback',
        engine: '1.5L 4-Cylinder',
        years: {
          2023: { hdv: 16800, currency: 'USD', origin: 'USA' },
          2022: { hdv: 16300, currency: 'USD', origin: 'USA' },
          2021: { hdv: 15950, currency: 'USD', origin: 'USA' },
          2020: { hdv: 15600, currency: 'USD', origin: 'USA' },
          2019: { hdv: 15100, currency: 'USD', origin: 'USA' },
          2018: { hdv: 14500, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'landcruiserprado',
        name: 'Land Cruiser Prado',
        bodyType: 'SUV',
        engine: '2.7L 4-Cylinder',
        years: {
          2024: { hdv: 46000, currency: 'USD', origin: 'UAE' },
          2023: { hdv: 44500, currency: 'USD', origin: 'UAE' },
          2022: { hdv: 42000, currency: 'USD', origin: 'UAE' },
          2021: { hdv: 39500, currency: 'USD', origin: 'UAE' },
          2020: { hdv: 37000, currency: 'USD', origin: 'UAE' },
          2018: { hdv: 34000, currency: 'USD', origin: 'UAE' }
        }
      },
      {
        id: 'landcruiser',
        name: 'Land Cruiser',
        bodyType: 'SUV',
        engine: '4.5L V8 Diesel',
        years: {
          2024: { hdv: 82000, currency: 'USD', origin: 'UAE' },
          2023: { hdv: 79000, currency: 'USD', origin: 'UAE' },
          2022: { hdv: 75000, currency: 'USD', origin: 'UAE' },
          2021: { hdv: 68000, currency: 'USD', origin: 'UAE' },
          2020: { hdv: 62000, currency: 'USD', origin: 'UAE' },
          2018: { hdv: 55000, currency: 'USD', origin: 'UAE' }
        }
      },
      {
        id: 'voxy',
        name: 'Voxy',
        bodyType: 'Van / Minivan',
        engine: '2.0L 4-Cylinder',
        years: {
          2023: { hdv: 2900000, currency: 'JPY', origin: 'Japan' },
          2022: { hdv: 2750000, currency: 'JPY', origin: 'Japan' },
          2021: { hdv: 2500000, currency: 'JPY', origin: 'Japan' },
          2020: { hdv: 2300000, currency: 'JPY', origin: 'Japan' },
          2019: { hdv: 2100000, currency: 'JPY', origin: 'Japan' },
          2018: { hdv: 1950000, currency: 'JPY', origin: 'Japan' }
        }
      },
      {
        id: 'camry',
        name: 'Camry',
        bodyType: 'Sedan',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 26400, currency: 'USD', origin: 'USA' },
          2023: { hdv: 25900, currency: 'USD', origin: 'USA' },
          2022: { hdv: 25200, currency: 'USD', origin: 'USA' },
          2021: { hdv: 24500, currency: 'USD', origin: 'USA' },
          2020: { hdv: 23800, currency: 'USD', origin: 'USA' },
          2018: { hdv: 22000, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'highlander',
        name: 'Highlander',
        bodyType: 'SUV',
        engine: '3.5L V6',
        years: {
          2024: { hdv: 39000, currency: 'USD', origin: 'USA' },
          2023: { hdv: 37500, currency: 'USD', origin: 'USA' },
          2022: { hdv: 36000, currency: 'USD', origin: 'USA' },
          2021: { hdv: 34800, currency: 'USD', origin: 'USA' },
          2020: { hdv: 33500, currency: 'USD', origin: 'USA' },
          2018: { hdv: 31000, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'rav4',
        name: 'RAV4',
        bodyType: 'SUV',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 28500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 27900, currency: 'USD', origin: 'USA' },
          2022: { hdv: 26800, currency: 'USD', origin: 'USA' },
          2021: { hdv: 26000, currency: 'USD', origin: 'USA' },
          2020: { hdv: 25200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 23500, currency: 'USD', origin: 'USA' }
        }
      }
    ]
  },
  honda: {
    name: 'Honda',
    models: [
      {
        id: 'crv',
        name: 'CR-V',
        bodyType: 'SUV',
        engine: '1.5L Turbo',
        years: {
          2024: { hdv: 29500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 28400, currency: 'USD', origin: 'USA' },
          2022: { hdv: 26900, currency: 'USD', origin: 'USA' },
          2021: { hdv: 25800, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24800, currency: 'USD', origin: 'USA' },
          2018: { hdv: 23000, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'hrv',
        name: 'HR-V',
        bodyType: 'SUV',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 24100, currency: 'USD', origin: 'USA' },
          2023: { hdv: 23600, currency: 'USD', origin: 'USA' },
          2022: { hdv: 22400, currency: 'USD', origin: 'USA' },
          2021: { hdv: 21500, currency: 'USD', origin: 'USA' },
          2020: { hdv: 20800, currency: 'USD', origin: 'USA' },
          2018: { hdv: 19200, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'accord',
        name: 'Accord',
        bodyType: 'Sedan',
        engine: '2.0L Turbo',
        years: {
          2024: { hdv: 27800, currency: 'USD', origin: 'USA' },
          2023: { hdv: 26900, currency: 'USD', origin: 'USA' },
          2022: { hdv: 26200, currency: 'USD', origin: 'USA' },
          2021: { hdv: 25100, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 22800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'civic',
        name: 'Civic',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 23900, currency: 'USD', origin: 'USA' },
          2023: { hdv: 23200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 22500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 21400, currency: 'USD', origin: 'USA' },
          2020: { hdv: 20600, currency: 'USD', origin: 'USA' },
          2018: { hdv: 19400, currency: 'USD', origin: 'USA' }
        }
      }
    ]
  },
  nissan: {
    name: 'Nissan',
    models: [
      {
        id: 'maxima',
        name: 'Maxima',
        bodyType: 'Sedan',
        engine: '3.5L V6',
        years: {
          2023: { hdv: 38200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 37400, currency: 'USD', origin: 'USA' },
          2021: { hdv: 36100, currency: 'USD', origin: 'USA' },
          2020: { hdv: 34500, currency: 'USD', origin: 'USA' },
          2019: { hdv: 33200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 31800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'pathfinder',
        name: 'Pathfinder',
        bodyType: 'SUV',
        engine: '3.5L V6',
        years: {
          2024: { hdv: 36000, currency: 'USD', origin: 'USA' },
          2023: { hdv: 35200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 33900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 31600, currency: 'USD', origin: 'USA' },
          2018: { hdv: 29800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'altima',
        name: 'Altima',
        bodyType: 'Sedan',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 25700, currency: 'USD', origin: 'USA' },
          2023: { hdv: 25200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 24500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 23900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 23100, currency: 'USD', origin: 'USA' },
          2018: { hdv: 21800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'hardbody_np300',
        name: 'Hardbody NP300',
        bodyType: 'Pickup Truck',
        engine: '2.5L 4-Cylinder',
        years: {
          2018: { hdv: 19000, currency: 'USD', origin: 'UAE' },
          2012: { hdv: 17400, currency: 'USD', origin: 'UAE' },
          2010: { hdv: 16986, currency: 'USD', origin: 'UAE' }
        }
      },
      {
        id: 'rogue',
        name: 'Rogue',
        bodyType: 'SUV',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 27900, currency: 'USD', origin: 'USA' },
          2023: { hdv: 27300, currency: 'USD', origin: 'USA' },
          2022: { hdv: 26400, currency: 'USD', origin: 'USA' },
          2021: { hdv: 25600, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24800, currency: 'USD', origin: 'USA' },
          2018: { hdv: 23200, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'sentra',
        name: 'Sentra',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 20800, currency: 'USD', origin: 'USA' },
          2023: { hdv: 20200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 19500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 18900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 18200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 16900, currency: 'USD', origin: 'USA' }
        }
      }
    ]
  },
  ford: {
    name: 'Ford',
    models: [
      {
        id: 'ranger',
        name: 'Ranger',
        bodyType: 'Pickup Truck',
        engine: '2.3L EcoBoost',
        years: {
          2024: { hdv: 32500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 27400, currency: 'USD', origin: 'USA' },
          2022: { hdv: 25900, currency: 'USD', origin: 'USA' },
          2021: { hdv: 24800, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24000, currency: 'USD', origin: 'USA' },
          2019: { hdv: 23200, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'fiesta',
        name: 'Fiesta',
        bodyType: 'Hatchback',
        engine: '1.6L 4-Cylinder',
        years: {
          2019: { hdv: 15400, currency: 'USD', origin: 'USA' },
          2018: { hdv: 14200, currency: 'USD', origin: 'USA' },
          2017: { hdv: 13600, currency: 'USD', origin: 'USA' },
          2016: { hdv: 13000, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'explorer',
        name: 'Explorer',
        bodyType: 'SUV',
        engine: '2.3L EcoBoost',
        years: {
          2024: { hdv: 36800, currency: 'USD', origin: 'USA' },
          2023: { hdv: 35900, currency: 'USD', origin: 'USA' },
          2022: { hdv: 34500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 32600, currency: 'USD', origin: 'USA' },
          2020: { hdv: 31500, currency: 'USD', origin: 'USA' },
          2018: { hdv: 29800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'escape',
        name: 'Escape',
        bodyType: 'SUV',
        engine: '1.5L EcoBoost',
        years: {
          2024: { hdv: 29500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 28000, currency: 'USD', origin: 'USA' },
          2022: { hdv: 26500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 25300, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24400, currency: 'USD', origin: 'USA' },
          2018: { hdv: 23100, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'f150',
        name: 'F-150',
        bodyType: 'Pickup Truck',
        engine: '2.7L EcoBoost',
        years: {
          2024: { hdv: 36500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 34200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 32000, currency: 'USD', origin: 'USA' },
          2021: { hdv: 29900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 28700, currency: 'USD', origin: 'USA' },
          2018: { hdv: 27100, currency: 'USD', origin: 'USA' }
        }
      }
    ]
  },
  kia: {
    name: 'Kia',
    models: [
      {
        id: 'optima',
        name: 'Optima / K5',
        bodyType: 'Sedan',
        engine: '2.4L 4-Cylinder',
        years: {
          2024: { hdv: 25500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 25000, currency: 'USD', origin: 'USA' },
          2022: { hdv: 23800, currency: 'USD', origin: 'USA' },
          2021: { hdv: 23200, currency: 'USD', origin: 'USA' },
          2020: { hdv: 22500, currency: 'USD', origin: 'USA' },
          2018: { hdv: 21300, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'sportage',
        name: 'Sportage',
        bodyType: 'SUV',
        engine: '2.4L 4-Cylinder',
        years: {
          2024: { hdv: 27100, currency: 'USD', origin: 'USA' },
          2023: { hdv: 26200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 24300, currency: 'USD', origin: 'USA' },
          2021: { hdv: 23600, currency: 'USD', origin: 'USA' },
          2020: { hdv: 22900, currency: 'USD', origin: 'USA' },
          2018: { hdv: 21400, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'forte',
        name: 'Forte',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 19900, currency: 'USD', origin: 'USA' },
          2023: { hdv: 19400, currency: 'USD', origin: 'USA' },
          2022: { hdv: 18700, currency: 'USD', origin: 'USA' },
          2021: { hdv: 17800, currency: 'USD', origin: 'USA' },
          2020: { hdv: 17200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 16300, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'sorento',
        name: 'Sorento',
        bodyType: 'SUV',
        engine: '3.3L V6',
        years: {
          2024: { hdv: 31900, currency: 'USD', origin: 'USA' },
          2023: { hdv: 30200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 29500, currency: 'USD', origin: 'USA' },
          2021: { hdv: 28700, currency: 'USD', origin: 'USA' },
          2020: { hdv: 27300, currency: 'USD', origin: 'USA' },
          2018: { hdv: 25900, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'morning',
        name: 'Morning / Picanto',
        bodyType: 'Hatchback',
        engine: '1.0L 3-Cylinder',
        years: {
          2024: { hdv: 12500000, currency: 'KRW', origin: 'South Korea' },
          2023: { hdv: 11800000, currency: 'KRW', origin: 'South Korea' },
          2022: { hdv: 11200000, currency: 'KRW', origin: 'South Korea' },
          2021: { hdv: 10500000, currency: 'KRW', origin: 'South Korea' },
          2020: { hdv: 9800000,  currency: 'KRW', origin: 'South Korea' },
          2018: { hdv: 8900000,   currency: 'KRW', origin: 'South Korea' }
        }
      }
    ]
  },
  mercedes_benz: {
    name: 'Mercedes-Benz',
    models: [
      {
        id: 'gla',
        name: 'GLA-Class',
        bodyType: 'SUV',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 39500, currency: 'EUR', origin: 'Germany' },
          2023: { hdv: 37800, currency: 'EUR', origin: 'Germany' },
          2022: { hdv: 35400, currency: 'EUR', origin: 'Germany' },
          2021: { hdv: 33800, currency: 'EUR', origin: 'Germany' },
          2020: { hdv: 31200, currency: 'EUR', origin: 'Germany' },
          2018: { hdv: 28500, currency: 'EUR', origin: 'Germany' }
        }
      },
      {
        id: 'gle',
        name: 'GLE-Class',
        bodyType: 'SUV',
        engine: '3.0L 6-Cylinder',
        years: {
          2024: { hdv: 68000, currency: 'EUR', origin: 'Germany' },
          2023: { hdv: 64500, currency: 'EUR', origin: 'Germany' },
          2022: { hdv: 61000, currency: 'EUR', origin: 'Germany' },
          2021: { hdv: 57500, currency: 'EUR', origin: 'Germany' },
          2020: { hdv: 54000, currency: 'EUR', origin: 'Germany' },
          2018: { hdv: 48000, currency: 'EUR', origin: 'Germany' }
        }
      },
      {
        id: 'glc',
        name: 'GLC-Class',
        bodyType: 'SUV',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 47500, currency: 'EUR', origin: 'Germany' },
          2023: { hdv: 45000, currency: 'EUR', origin: 'Germany' },
          2022: { hdv: 42800, currency: 'EUR', origin: 'Germany' },
          2021: { hdv: 40500, currency: 'EUR', origin: 'Germany' },
          2020: { hdv: 38200, currency: 'EUR', origin: 'Germany' },
          2018: { hdv: 34500, currency: 'EUR', origin: 'Germany' }
        }
      },
      {
        id: 'c250',
        name: 'C250 Avantgarde',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2021: { hdv: 38000, currency: 'EUR', origin: 'Germany' },
          2020: { hdv: 36200, currency: 'EUR', origin: 'Germany' },
          2019: { hdv: 34500, currency: 'EUR', origin: 'Germany' },
          2018: { hdv: 32000, currency: 'EUR', origin: 'Germany' },
          2017: { hdv: 29800, currency: 'EUR', origin: 'Germany' }
        }
      },
      {
        id: 'c300',
        name: 'C300 AMG Line',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 45800, currency: 'EUR', origin: 'Germany' },
          2023: { hdv: 43900, currency: 'EUR', origin: 'Germany' },
          2022: { hdv: 41500, currency: 'EUR', origin: 'Germany' },
          2021: { hdv: 39800, currency: 'EUR', origin: 'Germany' },
          2020: { hdv: 37600, currency: 'EUR', origin: 'Germany' },
          2018: { hdv: 34000, currency: 'EUR', origin: 'Germany' }
        }
      }
    ]
  },
  hyundai: {
    name: 'Hyundai',
    models: [
      {
        id: 'accent',
        name: 'Accent',
        bodyType: 'Sedan',
        engine: '1.6L 4-Cylinder',
        years: {
          2024: { hdv: 18900, currency: 'USD', origin: 'USA' },
          2023: { hdv: 18200, currency: 'USD', origin: 'USA' },
          2022: { hdv: 17650, currency: 'USD', origin: 'USA' },
          2021: { hdv: 16900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 16200, currency: 'USD', origin: 'USA' },
          2018: { hdv: 15100, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'sonata',
        name: 'Sonata',
        bodyType: 'Sedan',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 27500, currency: 'USD', origin: 'USA' },
          2023: { hdv: 26400, currency: 'USD', origin: 'USA' },
          2022: { hdv: 25300, currency: 'USD', origin: 'USA' },
          2021: { hdv: 24600, currency: 'USD', origin: 'USA' },
          2020: { hdv: 23900, currency: 'USD', origin: 'USA' },
          2018: { hdv: 22400, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'tucson',
        name: 'Tucson',
        bodyType: 'SUV',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 27200, currency: 'USD', origin: 'USA' },
          2023: { hdv: 26500, currency: 'USD', origin: 'USA' },
          2022: { hdv: 25800, currency: 'USD', origin: 'USA' },
          2021: { hdv: 24900, currency: 'USD', origin: 'USA' },
          2020: { hdv: 24100, currency: 'USD', origin: 'USA' },
          2018: { hdv: 22800, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'santafe',
        name: 'Santa Fe',
        bodyType: 'SUV',
        engine: '2.5L 4-Cylinder',
        years: {
          2024: { hdv: 33950, currency: 'USD', origin: 'USA' },
          2023: { hdv: 28750, currency: 'USD', origin: 'USA' },
          2022: { hdv: 27400, currency: 'USD', origin: 'USA' },
          2021: { hdv: 26800, currency: 'USD', origin: 'USA' },
          2020: { hdv: 25900, currency: 'USD', origin: 'USA' },
          2018: { hdv: 24600, currency: 'USD', origin: 'USA' }
        }
      },
      {
        id: 'elantra',
        name: 'Elantra',
        bodyType: 'Sedan',
        engine: '2.0L 4-Cylinder',
        years: {
          2024: { hdv: 21400, currency: 'USD', origin: 'USA' },
          2023: { hdv: 20900, currency: 'USD', origin: 'USA' },
          2022: { hdv: 20200, currency: 'USD', origin: 'USA' },
          2021: { hdv: 19600, currency: 'USD', origin: 'USA' },
          2020: { hdv: 18950, currency: 'USD', origin: 'USA' },
          2018: { hdv: 17850, currency: 'USD', origin: 'USA' }
        }
      }
    ]
  }
};