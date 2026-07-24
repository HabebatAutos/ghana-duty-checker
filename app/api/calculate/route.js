import Anthropic from '@anthropic-ai/sdk'
import { checkEligibility } from '@/lib/dutyCalculator'
import { get, set, TTL } from '@/lib/cache'
import fs from 'fs/promises'
import path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key' })

const MSRP_PROMPT = `You are an expert vehicle valuation assistant specializing in international automotive markets.
Your task is to provide a comprehensive list of standard factory trim packages and model variations for a specified vehicle model year.
Return ONLY a valid JSON array of objects. Do not wrap the response in markdown code blocks or include conversational text.`;

const MARKET_CONFIG = {
  'USA':          { currency: 'USD', code: 'US' },
  'US':           { currency: 'USD', code: 'US' },
  'Canada':       { currency: 'CAD', code: 'CA' },
  'CA':           { currency: 'CAD', code: 'CA' },
  'UAE':          { currency: 'AED', code: 'AE' },
  'AE':           { currency: 'AED', code: 'AE' },
  'Japan':        { currency: 'JPY', code: 'JP' },
  'JP':           { currency: 'JPY', code: 'JP' },
  'China':        { currency: 'CNY', code: 'CN' },
  'CN':           { currency: 'CNY', code: 'CN' },
  'Germany':      { currency: 'EUR', code: 'DE' },
  'DE':           { currency: 'EUR', code: 'DE' },
  'Belgium':      { currency: 'EUR', code: 'BE' },
  'BE':           { currency: 'EUR', code: 'BE' },
  'Netherlands': { currency: 'EUR', code: 'NL' },
  'NL':           { currency: 'EUR', code: 'NL' },
  'UK':           { currency: 'GBP', code: 'GB' },
  'GB':           { currency: 'GBP', code: 'GB' },
  'South Korea': { currency: 'KRW', code: 'KR' },
  'Korea':        { currency: 'KRW', code: 'KR' },
  'KR':           { currency: 'KRW', code: 'KR' },
};

const SANITY = {
  USD: { min: 3000,    max: 500000    },
  CAD: { min: 3000,    max: 500000    },
  AED: { min: 10000,   max: 2000000   },
  JPY: { min: 300000,  max: 50000000  },
  CNY: { min: 30000,   max: 5000000   },
  EUR: { min: 3000,    max: 400000    },
  GBP: { min: 3000,    max: 400000    },
  KRW: { min: 5000000, max: 500000000 },
};

// Helper to normalize country names and codes into clean 2-letter codes
function normalizeOriginCode(rawVal) {
  if (!rawVal) return '';
  const str = String(rawVal).trim().toUpperCase();
  if (str === 'CN' || str === 'CHINA') return 'CN';
  if (str === 'US' || str === 'USA' || str === 'UNITED STATES') return 'US';
  if (str === 'CA' || str === 'CANADA') return 'CA';
  if (str === 'JP' || str === 'JAPAN') return 'JP';
  if (str === 'KR' || str === 'KOREA' || str === 'SOUTH KOREA') return 'KR';
  if (str === 'AE' || str === 'UAE' || str === 'UNITED ARAB EMIRATES') return 'AE';
  if (str === 'DE' || str === 'GERMANY') return 'DE';
  if (str === 'BE' || str === 'BELGIUM') return 'BE';
  if (str === 'NL' || str === 'NETHERLANDS') return 'NL';
  if (str === 'GB' || str === 'UK' || str === 'UNITED KINGDOM') return 'GB';
  if (str === 'ES' || str === 'SPAIN') return 'ES';
  if (str === 'MX' || str === 'MEXICO') return 'MX';
  return str;
}

// Legacy dictionary kept strictly as an emergency fallback channel
const PRESET_FILENAME_MAP = {
  'acura-mdx': 'acura_mdx.json',
  'acura-rdx': 'acura_rdx.json',
  'acura-tlx': 'acura_tlx.json',
  'acuramdx': 'acura_mdx.json',
  'acurardx': 'acura_rdx.json',
  'acuratlx': 'acura_tlx.json',
  'bmw-320i': 'bmw_320i.json',
  'bmw-328i': 'bmw_328i.json',
  'bmw-330i': 'bmw_330i.json',
  'bmw-335i': 'bmw_335i.json',
  'bmw-3series': 'bmw_3_series.json',
  'bmw-530i': 'bmw_530i.json',
  'bmw-535i': 'bmw_535i.json',
  'bmw-550i': 'bmw_550i.json',
  'bmw-5series': 'bmw_5_series.json',
  'bmw-7series': 'bmw_7_series.json',
  'bmw-m5': 'bmw_m5.json',
  'bmw-x1': 'bmw_x1.json',
  'bmw-x3': 'bmw_x3.json',
  'bmw-x4': 'bmw_x4.json',
  'bmw-x5': 'bmw_x5.json',
  'bmw-x6': 'bmw_x6.json',
  'bmw-x7': 'bmw_x7.json',
  'bmw320i': 'bmw_320i.json',
  'bmw328i': 'bmw_328i.json',
  'bmw330i': 'bmw_330i.json',
  'bmw335i': 'bmw_335i.json',
  'bmw3series': 'bmw_3_series.json',
  'bmw530i': 'bmw_530i.json',
  'bmw535i': 'bmw_535i.json',
  'bmw550i': 'bmw_550i.json',
  'bmw5series': 'bmw_5_series.json',
  'bmw7series': 'bmw_7_series.json',
  'bmwm5': 'bmw_m5.json',
  'bmwx1': 'bmw_x1.json',
  'bmwx3': 'bmw_x3.json',
  'bmwx4': 'bmw_x4.json',
  'bmwx5': 'bmw_x5.json',
  'bmwx6': 'bmw_x6.json',
  'bmwx7': 'bmw_x7.json',
  'chevrolet-aveo': 'chevrolet_aveo.json',
  'chevrolet-corvette': 'chevrolet_corvette.json',
  'chevrolet-cruze': 'chevrolet_cruze.json',
  'chevrolet-equinox': 'chevrolet_equinox.json',
  'chevrolet-malibu': 'chevrolet_malibu.json',
  'chevrolet-sonic': 'chevrolet_sonic.json',
  'chevrolet-spark': 'chevrolet_spark.json',
  'chevrolet-suburban': 'chevrolet_suburban.json',
  'chevrolet-traverse': 'chevrolet_traverse.json',
  'chevrolet-trax': 'chevrolet_trax.json',
  'chevroletaveo': 'chevrolet_aveo.json',
  'chevroletcorvette': 'chevrolet_corvette.json',
  'chevroletcruze': 'chevrolet_cruze.json',
  'chevroletequinox': 'chevrolet_equinox.json',
  'chevroletmalibu': 'chevrolet_malibu.json',
  'chevroletsonic': 'chevrolet_sonic.json',
  'chevroletspark': 'chevrolet_spark.json',
  'chevroletsuburban': 'chevrolet_suburban.json',
  'chevrolettraverse': 'chevrolet_traverse.json',
  'chevrolettrax': 'chevrolet_trax.json',
  'ford-bronco': 'ford_bronco.json',
  'ford-edge': 'ford_edge.json',
  'ford-escape': 'ford_escape.json',
  'ford-expedition': 'ford_expedition.json',
  'ford-explorer': 'ford_explorer.json',
  'ford-f150': 'ford_f150.json',
  'ford-f250': 'ford_f_250.json',
  'ford-fiesta': 'ford_fiesta.json',
  'ford-focus': 'ford_focus.json',
  'ford-fusion': 'ford_fusion.json',
  'ford-maverick': 'ford_maverick.json',
  'ford-mondeo': 'ford_mondeo.json',
  'ford-mustang': 'ford_mustang.json',
  'ford-ranger': 'ford_ranger.json',
  'ford-transit': 'ford_transit.json',
  'fordbronco': 'ford_bronco.json',
  'fordedge': 'ford_edge.json',
  'fordescape': 'ford_escape.json',
  'fordexpedition': 'ford_expedition.json',
  'fordexplorer': 'ford_explorer.json',
  'fordf150': 'ford_f150.json',
  'fordf250': 'ford_f_250.json',
  'fordfiesta': 'ford_fiesta.json',
  'fordfocus': 'ford_focus.json',
  'fordfusion': 'ford_fusion.json',
  'fordmaverick': 'ford_maverick.json',
  'fordmondeo': 'ford_mondeo.json',
  'fordmustang': 'ford_mustang.json',
  'fordranger': 'ford_ranger.json',
  'fordtransit': 'ford_transit.json',
  'honda-accord': 'honda_accord.json',
  'honda-accordex': 'honda_accord_ex.json',
  'honda-city': 'honda_city.json',
  'honda-civic': 'Honda_Civic.json',
  'honda-crv': 'HondaCRv_Dataset.json',
  'honda-crvhybrid': 'honda_crv_hybrid.json',
  'honda-fits': 'honda_fits.json',
  'honda-hrv': 'honda_hrv.json',
  'honda-insight': 'honda_insight.json',
  'honda-jazz': 'honda_jazz.json',
  'honda-odyssey': 'honda_odyssey.json',
  'honda-passport': 'honda_passport.json',
  'honda-pilot': 'honda_pilot.json',
  'honda-ridgeline': 'honda_ridgeline.json',
  'honda-vezel': 'honda_vezel.json',
  'hondaaccord': 'honda_accord.json',
  'hondaaccordex': 'honda_accord_ex.json',
  'hondacity': 'honda_city.json',
  'hondacivic': 'Honda_Civic.json',
  'hondacrv': 'HondaCRv_Dataset.json',
  'hondacrvhybrid': 'honda_crv_hybrid.json',
  'hondafits': 'honda_fits.json',
  'hondahrv': 'honda_hrv.json',
  'hondainsight': 'honda_insight.json',
  'hondajazz': 'honda_jazz.json',
  'hondaodyssey': 'honda_odyssey.json',
  'hondapassport': 'honda_passport.json',
  'hondapilot': 'honda_pilot.json',
  'hondaridgeline': 'honda_ridgeline.json',
  'hondavezel': 'honda_vezel.json',
  'hyundai-accent': 'hyundai_accent.json',
  'hyundai-avantemd': 'hyundai_avantemd.json',
  'hyundai-drandeur': 'hyundai_drandeur.json',
  'hyundai-elantra': 'hyundai_elantra.json',
  'hyundai-genesis': 'hyundai_genesis.json',
  'hyundai-getz': 'hyundai_getz.json',
  'hyundai-grandeur': 'hyundai_grandeur.json',
  'hyundai-h1': 'hyundai_h1.json',
  'hyundai-i10': 'hyundai_i10.json',
  'hyundai-i20': 'hyundai_i20.json',
  'hyundai-ix35': 'hyundai_ix35.json',
  'hyundai-kona': 'hyundai_kona.json',
  'hyundai-palisade': 'hyundai_palisade.json',
  'hyundai-santacruz': 'hyundai_santacruz.json',
  'hyundai-santafe': 'hyundai_santafe.json',
  'hyundai-sonata': 'hyundai_sonata.json',
  'hyundai-tucson': 'hyundai_tucson.json',
  'hyundai-veloster': 'hyundai_veloster.json',
  'hyundaiaccent': 'hyundai_accent.json',
  'hyundaiavantemd': 'hyundai_avantemd.json',
  'hyundaidrandeur': 'hyundai_drandeur.json',
  'hyundaielantra': 'hyundai_elantra.json',
  'hyundaigenesis': 'hyundai_genesis.json',
  'hyundaigetz': 'hyundai_getz.json',
  'hyundaigrandeur': 'hyundai_grandeur.json',
  'hyundaih1': 'hyundai_h1.json',
  'hyundaii10': 'hyundai_i10.json',
  'hyundaii20': 'hyundai_i20.json',
  'hyundaiix35': 'hyundai_ix35.json',
  'hyundaikona': 'hyundai_kona.json',
  'hyundaipalisade': 'hyundai_palisade.json',
  'hyundaisantacruz': 'hyundaisantacruz.json',
  'hyundaisantafe': 'hyundai_santafe.json',
  'hyundaisonata': 'hyundai_sonata.json',
  'hyundaitucson': 'hyundai_tucson.json',
  'hyundaiveloster': 'hyundai_veloster.json',
  'kia-carens': 'kia_carens.json',
  'kia-carnival': 'kia_carnival.json',
  'kia-ceed': 'kia_cee_d.json',
  'kia-cerato': 'kia_cerato.json',
  'kia-forte': 'kia_forte.json',
  'kia-k5': 'kia_k5.json',
  'kia-morning': 'kia_morning.json',
  'kia-niro': 'kia_niro.json',
  'kia-optima': 'kia_optima.json',
  'kia-pride': 'kia_pride.json',
  'kia-rio': 'kia_rio.json',
  'kia-sedona': 'kia_sedona.json',
  'kia-seltos': 'kia_seltos.json',
  'kia-sorento': 'kia_sorento.json',
  'kia-soul': 'kia_soul.json',
  'kia-sportage': 'kia_sportage.json',
  'kia-telluride': 'kia_telluride.json',
  'kiacarens': 'kia_carens.json',
  'kiacarnival': 'kia_carnival.json',
  'kiaceed': 'kia_cee_d.json',
  'kiacerato': 'kia_cerato.json',
  'kiaforte': 'kia_forte.json',
  'kiak5': 'kia_k5.json',
  'kiamorning': 'kia_morning.json',
  'kiamorningpicanto': 'kia_morning.json',
  'kianiro': 'kia_niro.json',
  'kiaoptima': 'kia_opt_json',
  'kiaoptimak5': 'kia_optima.json',
  'kiapride': 'kia_pride.json',
  'kiario': 'kia_rio.json',
  'kiasedona': 'kia_sedona.json',
  'kiaseltos': 'kia_seltos.json',
  'kiasorento': 'kia_sorento.json',
  'kiasoul': 'kia_soul.json',
  'kiasportage': 'kia_sportage.json',
  'kiatelluride': 'kia_telluride.json',
  'landrover-defender': 'landrover_defender.json',
  'landrover-discovery': 'landrover_discovery.json',
  'landrover-discoverysport': 'landrover_discovery_sport.json',
  'landrover-evoque': 'landrover_evoque.json',
  'landrover-rangerover': 'landrover_range_rover.json',
  'landrover-rangeroverevoque': 'landrover_range_rover_evoque.json',
  'landrover-rangeroversport': 'landrover_range_rover_sport.json',
  'landrover-rangerovervelar': 'landrover_range_rover_velar.json',
  'landroverdefender': 'landrover_defender.json',
  'landroverdiscovery': 'landrover_discovery.json',
  'landroverdiscoverysport': 'landrover_discovery_sport.json',
  'landroverevoque': 'landrover_evoque.json',
  'landroverrangerover': 'landrover_range_rover.json',
  'landroverrangeroverevoque': 'landrover_range_rover_evoque.json',
  'landroverrangeroversport': 'landrover_range_rover_sport.json',
  'landroverrangerovervelar': 'landrover_range_rover_velar.json',
  'mercedes-benzgclass': 'mercedes_benz_g_class.json',
  'mercedes-benzglsclass': 'mercedes_benz_gls_class.json',
  'mercedes-benzs-class': 'mercedes_benz_s-class.json',
  'mercedes-sprinter': 'mercedes_sprinter.json',
  'mercedes_benz-gla': 'mercedes_benz_gla.json',
  'mercedes_benz-glc': 'mercedes_benz_glc.json',
  'mercedes_benz-gle': 'mercedes_benz_gle.json',
  'mercedes_benz-c250': 'mercedes_benz_c250.json',
  'mercedes_benz-c300': 'mercedes_benz_c300.json',
  'mercedesbenzc250': 'mercedes_benz_c250.json',
  'mercedesbenzc300': 'mercedes_benz_c300.json',
  'mercedesbenzgclass': 'mercedes_benz_g_class.json',
  'mercedesbenzgla': 'mercedes_benz_gla.json',
  'mercedesbenzglc': 'mercedes_benz_glc.json',
  'mercedesbenzgle': 'mercedes_benz_gle.json',
  'mercedesbenzglsclass': 'mercedes_benz_gls_class.json',
  'mercedesbenzs-class': 'mercedes_benz_s-class.json',
  'mercedessprinter': 'mercedes_sprinter.json',
  'mitsubishi-asx': 'mitsubishi_asx.json',
  'mitsubishi-colt': 'mitsubishi_colt.json',
  'mitsubishi-eclipse': 'mitsubishi_eclipse.json',
  'mitsubishi-eclipsecross': 'mitsubishi_eclipse_cross.json',
  'mitsubishi-l200': 'mitsubishi_l200.json',
  'mitsubishi-lancer': 'mitsubishi_lancer.json',
  'mitsubishi-mirage': 'mitsubishi_mirage.json',
  'mitsubishi-montero': 'mitsubishi_montero.json',
  'mitsubishi-monterosport': 'mitsubishi_montero_sport.json',
  'mitsubishi-outlander': 'mitsubishi_outlander.json',
  'mitsubishi-outlanderphev': 'mitsubishi_outlander_phev.json',
  'mitsubishi-outlandersport': 'mitsubishi_outlander_sport.json',
  'mitsubishi-pajero': 'mitsubishi_pajero.json',
  'mitsubishi-pajerosport': 'mitsubishi_pajero_sport.json',
  'mitsubishi-rvr': 'mitsubishi_rvr.json',
  'mitsubishiasx': 'mitsubishi_asx.json',
  'mitsubishicolt': 'mitsubishi_colt.json',
  'mitsubishieclipse': 'mitsubishi_eclipse.json',
  'mitsubishieclipsecross': 'mitsubishi_eclipse_cross.json',
  'mitsubishil200': 'mitsubishi_l200.json',
  'mitsubishilancer': 'mitsubishi_lancer.json',
  'mitsubishimirage': 'mitsubishi_mirage.json',
  'mitsubishimontero': 'mitsubishi_montero.json',
  'mitsubishimonterosport': 'mitsubishi_montero_sport.json',
  'mitsubishioutlander': 'mitsubishi_outlander.json',
  'mitsubishioutlanderphev': 'mitsubishi_outlander_phev.json',
  'mitsubishioutlandersport': 'mitsubishi_outlander_sport.json',
  'mitsubishipajero': 'mitsubishi_pajero.json',
  'mitsubishipajerosport': 'mitsubishi_pajero_sport.json',
  'mitsubishirvr': 'mitsubishi_rvr.json',
  'nissan-altima': 'nissan_altima.json',
  'nissan-caravan': 'nissan_caravan.json',
  'nissan-frontier': 'nissan_frontier.json',
  'nissan-hardbody_np300': 'nissan_hardbody_np300.json',
  'nissan-hardbodynp300': 'nissan_hardbody_np300.json',
  'nissan-juke': 'nissan_juke.json',
  'nissan-kicks': 'nissan_kicks.json',
  'nissan-march': 'nissan_march.json',
  'nissan-maxima': 'nissam_maxima.json',
  'nissan-micra': 'nissan_micra.json',
  'nissan-navara': 'nissan_navara.json',
  'nissan-note': 'nissan_note.json',
  'nissan-pathfinder': 'nissan_pathfinder.json',
  'nissan-patrol': 'nissan_patrol.json',
  'nissan-pickup': 'nissan_pickup.json',
  'nissan-qashqai': 'nissan_qashqai.json',
  'nissan-quest': 'nissan_quest.json',
  'nissan-rogue': 'nissan_rogue.json',
  'nissan-sentra': 'nissan_sentra.json',
  'nissan-vehicles': 'nissan_vehicles.json',
  'nissan-versa': 'nissan_versa.json',
  'nissan-xtrail': 'nissan_x_trail.json',
  'nissanaltima': 'nissan_altima.json',
  'nissancaravan': 'nissan_caravan.json',
  'nissanfrontier': 'nissan_frontier.json',
  'nissanhardbodynp300': 'nissan_hardbody_np300.json',
  'nissanjuke': 'nissan_juke.json',
  'nissankicks': 'nissan_kicks.json',
  'nissanmarch': 'nissan_march.json',
  'nissanmaxima': 'nissam_maxima.json',
  'nissanmicra': 'nissan_micra.json',
  'nissannavara': 'nissan_navara.json',
  'nissannote': 'nissan_note.json',
  'nissannp300': 'nissan_hardbody_np300.json',
  'nissanpathfinder': 'nissan_pathfinder.json',
  'nissanpatrol': 'nissan_patrol.json',
  'nissanpickup': 'nissan_pickup.json',
  'nissanqashqai': 'nissan_qashqai.json',
  'nissanquest': 'nissan_quest.json',
  'nissanrogue': 'nissan_rogue.json',
  'nissansentra': 'nissan_sentra.json',
  'nissanvehicles': 'nissan_vehicles.json',
  'nissanversa': 'nissan_versa.json',
  'nissanxtrail': 'nissan_x_trail.json',
  'toyota-4runner': 'toyota_4_runner.json',
  'toyota-avalon': 'toyota_avalon.json',
  'toyota-avensis': 'toyota_avensis.json',
  'toyota-belta': 'toyota_belta.json',
  'toyota-c-hr': 'toyota_c-hr.json',
  'toyota-camry': 'toyota_camry.json',
  'toyota-corolla': 'toyota_corolla.json',
  'toyota-corollaaxio': 'toyota_corolla_axio.json',
  'toyota-corollacross': 'toyota_corolla_cross.json',
  'toyota-crown': 'toyota_crown.json',
  'toyota-fortuner': 'toyota_fortuner.json',
  'toyota-grandhighlander': 'toyota_grand_highlander.json',
  'toyota-harrier': 'toyota_harrier.json',
  'toyota-hiace': 'toyota_hiace.json',
  'toyota-highlander': 'toyota_highlander.json',
  'toyota-hilux': 'toyota_hilux.json',
  'toyota-landcruiser': 'toyota_landCruiser.json',
  'toyota-landcruiserprado': 'toyota_landcruiserprado.json',
  'toyota-matrix': 'toyota_matrix.json',
  'toyota-noah': 'toyota_noah.json',
  'toyota-premio': 'toyota_premio.json',
  'toyota-rav4': 'toyota_rav4.json',
  'toyota-sienna': 'toyota_sienna.json',
  'toyota-sienta': 'toyota_sienta.json',
  'toyota-tacoma': 'toyota_tacoma.json',
  'toyota-tundra': 'toyota_tundra.json',
  'toyota-venza': 'toyota_venza.json',
  'toyota-vios': 'toyota_vios.json',
  'toyota-vitz': 'toyota_vitz.json',
  'toyota-voxy': 'toyota_voxy.json',
  'toyota-yaris': 'Toyota_yaris.json',
  'toyota4runner': 'toyota_4_runner.json',
  'toyotaavalon': 'toyota_avalon.json',
  'toyotaavensis': 'toyota_avensis.json',
  'toyotabelta': 'toyota_belta.json',
  'toyotac-hr': 'toyota_c-hr.json',
  'toyotacamry': 'toyota_camry.json',
  'toyotacorolla': 'toyota_corolla.json',
  'toyotacorollaaxio': 'toyota_corolla_axio.json',
  'toyotacorollacross': 'toyota_corolla_cross.json',
  'toyotacrown': 'toyota_crown.json',
  'toyotafortuner': 'toyota_fortuner.json',
  'toyotagrandhighlander': 'toyota_grand_highlander.json',
  'toyotaharrier': 'toyota_harrier.json',
  'toyotahiace': 'toyota_hiace.json',
  'toyotahighlander': 'toyota_highlander.json',
  'toyotahilux': 'toyota_hilux.json',
  'toyotalandcruiser': 'toyotalandcruiser.json',
  'toyotalandcruiserprado': 'toyotalandcruiserprado.json',
  'toyotamatrix': 'toyota_matrix.json',
  'toyotanoah': 'toyota_noah.json',
  'toyotapremio': 'toyota_premio.json',
  'toyotarav4': 'toyota_rav4.json',
  'toyotasienna': 'toyota_sienna.json',
  'toyotasienta': 'toyota_sienta.json',
  'toyotatacoma': 'toyota_tacoma.json',
  'toyotatundra': 'toyota_tundra.json',
  'toyotavenza': 'toyota_venza.json',
  'toyotavios': 'toyota_vios.json',
  'toyotavitz': 'toyota_vitz.json',
  'toyotavoxy': 'toyota_voxy.json',
  'toyotayaris': 'Toyota_yaris.json',
};

const DYNAMIC_CACHE_FILE = path.join(process.cwd(), 'data', 'dynamic_cache.json');

async function readDynamicFileCache() {
  try {
    const rawData = await fs.readFile(DYNAMIC_CACHE_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch { return {}; }
}

async function writeToDynamicFileCache(key, catalogData) {
  try {
    const currentCache = await readDynamicFileCache();
    currentCache[key] = { lineup: catalogData, cachedAt: new Date().toISOString() };
    await fs.mkdir(path.dirname(DYNAMIC_CACHE_FILE), { recursive: true });
    await fs.writeFile(DYNAMIC_CACHE_FILE, JSON.stringify(currentCache, null, 2), 'utf-8');
  } catch (err) { console.error('[CACHE FILE WRITE ERROR]', err.message); }
}

function normalizeLineupProperties(array, userEngine = '', userBodyType = '', targetCurrency = 'USD') {
  if (!Array.isArray(array)) return [];
  return array.map(item => {
    const cleanPrice = item.price ?? item.msrp ?? item.base_price ?? item.hdv ?? item.HDV ?? item.value;
    const cleanCurrency = item.currency || item.Currency || targetCurrency;
    const sanity = SANITY[cleanCurrency] || SANITY.USD;
    
    let verifiedPrice = parseFloat(cleanPrice);
    if (isNaN(verifiedPrice) || verifiedPrice < sanity.min || verifiedPrice > sanity.max) {
      const fallbacks = { USD: 22000, CAD: 28000, AED: 80000, JPY: 2200000, CNY: 150000, EUR: 20000, GBP: 17000, KRW: 25000000 };
      verifiedPrice = fallbacks[cleanCurrency] || 22000;
    }

    let resolvedTrim = 'Base / Standard';
    if (item.trim !== undefined && item.trim !== null && String(item.trim).trim() !== 'NIL') resolvedTrim = item.trim;
    else if (item['Trim Level'] !== undefined && item['Trim Level'] !== null && String(item['Trim Level']).trim() !== 'NIL') resolvedTrim = item['Trim Level'];
    else if (item['Trim'] !== undefined && item['Trim'] !== null && String(item['Trim']).trim() !== 'NIL') resolvedTrim = item['Trim'];

    return {
      trim: String(resolvedTrim).trim(),
      body_style: userBodyType || item.body_style || item['Body Style'] || 'Sedan',
      engine: userEngine || item.engine || item.Engine || 'Standard Spec',
      fuel_type: item.fuel_type || item['Fuel Type'] || 'Gasoline',
      price: verifiedPrice,
      currency: cleanCurrency,
      originCode: normalizeOriginCode(item.originCode || item.origin || item['Origin Code']) || '',
      isFallback: item.isFallback || false,
      source: item.source || 'Verified Technical Specification Baseline',
      notes: item.notes || ''
    };
  });
}

async function fetchMsrpLineup(year, make, model, origin, userEngine = '', userBodyType = '', isBackgroundSync = false, originCode = '') {
  const cleanMake = make.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanModel = model.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const market = MARKET_CONFIG[origin] || MARKET_CONFIG[originCode] || MARKET_CONFIG['USA'];
  const targetCurrency = market.currency;
  const targetCode = normalizeOriginCode(originCode || market.code || 'US');
  
  const engineToken = userEngine ? userEngine.toLowerCase().replace(/[^a-z0-9]/g, '') : 'default';
  const fileCacheKey = `${year}-${cleanMake}-${cleanModel}-${targetCode}-${engineToken}`;

  // 1. AUTOMATED LOCAL SPREADSHEET SCANNER FILTERED BY ORIGIN CODE & YEAR
  try {
    const dataDirPath = path.join(process.cwd(), 'data');
    const files = await fs.readdir(dataDirPath);
    
    const normMake = make.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normModel = model.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Primary Filter: Find filenames matching both Make and Model
    let matchedFiles = files.filter(file => {
      if (!file.endsWith('.json') || file === 'dynamic_cache.json') return false;
      const fileLow = file.toLowerCase().replace(/[^a-z0-9]/g, '');
      return fileLow.includes(normMake) && fileLow.includes(normModel);
    });

    // Fallback Filter: Match Model alone if Make+Model didn't match
    if (matchedFiles.length === 0) {
      matchedFiles = files.filter(file => {
        if (!file.endsWith('.json') || file === 'dynamic_cache.json') return false;
        const fileLow = file.toLowerCase().replace(/[^a-z0-9]/g, '');
        return fileLow.includes(normModel);
      });
    }

    let targetPresetFile = null;
    if (matchedFiles.length > 0) {
      matchedFiles.sort((a, b) => a.length - b.length);
      targetPresetFile = matchedFiles[0];
    }
    
    // Safety Net: Fall back to legacy dictionary maps
    if (!targetPresetFile) {
      let carKey = `${cleanMake}-${cleanModel}`;
      if (!PRESET_FILENAME_MAP[carKey]) carKey = `${cleanMake}${cleanModel}`;
      targetPresetFile = PRESET_FILENAME_MAP[carKey];
    }

    if (targetPresetFile) {
      const filePath = path.join(dataDirPath, targetPresetFile);
      const rawData = await fs.readFile(filePath, 'utf-8');
      const repairedRawData = rawData.replace(/:\s*NaN\b/gi, ': null');
      const parsedData = JSON.parse(repairedRawData);

      // 🛡️ Bulletproof check: extract array whether root is an array or an object wrapper
      const records = Array.isArray(parsedData) 
        ? parsedData 
        : (parsedData.data || parsedData.records || Object.values(parsedData).find(v => Array.isArray(v)) || []);

      // Filter 1: Match Year
      const yearMatches = records.filter(row => {
        const rowYear = row.year ?? row['Year of Manufacture'] ?? row['Year'];
        return String(rowYear) === String(year);
      });

      // Extract distinct origin codes available for this year
      const rawAvailableCodes = yearMatches.map(row => {
        const rawOrigin = row['Origin Code'] ?? row['origin_code'] ?? row['Origin'] ?? row['origin'] ?? '';
        return normalizeOriginCode(rawOrigin);
      }).filter(Boolean);
      const availableOrigins = Array.from(new Set(rawAvailableCodes)).sort();

      // Filter 2: Match Specific Origin Code
      let matches = yearMatches.filter(row => {
        const rawOrigin = row['Origin Code'] ?? row['origin_code'] ?? row['Origin'] ?? row['origin'] ?? '';
        const rowCode = normalizeOriginCode(rawOrigin);
        return rowCode === targetCode || (targetCode === 'US' && (rowCode === 'USA' || rowCode === ''));
      });

      let isFallbackOrigin = false;
      if (matches.length === 0 && yearMatches.length > 0) {
        matches = yearMatches;
        isFallbackOrigin = true;
      }

      if (matches.length > 0) {
        const uniqueVariants = {};
        
        matches.forEach(row => {
          let rawTrim = 'Base / Standard';
          if (row.trim !== undefined && row.trim !== null) rawTrim = row.trim;
          else if (row['Trim Level'] !== undefined && row['Trim Level'] !== null) rawTrim = row['Trim Level'];
          else if (row['Trim'] !== undefined && row['Trim'] !== null) rawTrim = row['Trim'];

          const cleanTrim = String(rawTrim).toUpperCase().trim();
          const hdv = parseFloat(row.hdv ?? row['HDV'] ?? row['price'] ?? row['MSRP'] ?? 0);
          const rowCurrency = row.currency ?? row['Currency'] ?? targetCurrency;
          
          const rawRowOrigin = row['Origin Code'] ?? row['origin_code'] ?? row['Origin'] ?? row['origin'] ?? targetCode;
          const rowOriginCode = normalizeOriginCode(rawRowOrigin) || targetCode;

          if (cleanTrim === 'NIL' || cleanTrim === 'NAN' || isNaN(hdv) || hdv === 0) return;

          if (!uniqueVariants[cleanTrim]) {
            uniqueVariants[cleanTrim] = { 
              counts: {}, 
              currency: rowCurrency,
              originCode: rowOriginCode,
              fuelType: row.fuel_type || row['Fuel Type'] || 'Gasoline',
              bodyStyle: row.body_style || row['Body Style'] || ''
            };
          }
          uniqueVariants[cleanTrim].counts[hdv] = (uniqueVariants[cleanTrim].counts[hdv] || 0) + 1;
        });

        const compiledPresetLineup = Object.keys(uniqueVariants).map(trimName => {
          const variant = uniqueVariants[trimName];
          const topPrice = Object.keys(variant.counts).reduce((a, b) => 
            variant.counts[a] > variant.counts[b] ? a : b, '0'
          );

          let adjustedTrim = trimName;
          if (userEngine) {
            const cleanEngine = userEngine.toUpperCase().trim();
            adjustedTrim = adjustedTrim.replace(/\b\d+\.\d+\s*L\b/gi, cleanEngine);
            adjustedTrim = adjustedTrim.replace(/\b\d+L\b/gi, cleanEngine);
            adjustedTrim = adjustedTrim.replace(/\b\d{1,2},?\d{2,3}\s*cc\b/gi, cleanEngine);
          }

          const finalTrimLabel = adjustedTrim.toUpperCase().includes(model.toUpperCase())
            ? adjustedTrim
            : `${model.toUpperCase()} ${adjustedTrim}`;

          return {
            trim: finalTrimLabel === `${model.toUpperCase()} NIL` ? `${model.toUpperCase()} Base` : finalTrimLabel,
            body_style: userBodyType || variant.bodyStyle || 'Sedan',
            engine: userEngine || 'Standard Spec',
            fuel_type: variant.fuelType,
            price: parseFloat(topPrice) || 0,
            currency: variant.currency || targetCurrency,
            originCode: variant.originCode || targetCode,
            isFallback: isFallbackOrigin,
            source: isFallbackOrigin ? 'GRA Customs Appraisal Record (Alternative Origin)' : 'GRA Customs Appraisal Terminal Record',
            notes: isFallbackOrigin 
              ? `Note: General market valuation applied (No direct ${targetCode} records found for ${year}).` 
              : `Verified GRA record for origin [${targetCode}].`
          };
        }).sort((a, b) => a.price - b.price);

        if (compiledPresetLineup.length > 0) {
          return {
            lineup: normalizeLineupProperties(compiledPresetLineup, userEngine, userBodyType, targetCurrency),
            isFallback: isFallbackOrigin,
            availableOrigins: availableOrigins,
            requestedOrigin: targetCode
          };
        }
      }
    }
  } catch (fileErr) {
    console.error(`[PRESET INTERCEPT ERROR]`, fileErr.message);
  }

  // 2. FILE DYNAMIC CACHE INTERCEPTION
  const dynamicCache = await readDynamicFileCache();
  if (dynamicCache[fileCacheKey]) {
    return {
      lineup: normalizeLineupProperties(dynamicCache[fileCacheKey].lineup, userEngine, userBodyType, targetCurrency),
      isFallback: false,
      availableOrigins: [targetCode],
      requestedOrigin: targetCode
    };
  }

  // 3. MEMORY CACHE INTERCEPTION
  const cKey = `lineup:${year}:${make}:${model}:${targetCode}:${engineToken}:${targetCurrency}`.toLowerCase().replace(/\s+/g, ':');
  const cachedMemory = get(cKey);
  if (cachedMemory) {
    return {
      lineup: normalizeLineupProperties(cachedMemory, userEngine, userBodyType, targetCurrency),
      isFallback: false,
      availableOrigins: [targetCode],
      requestedOrigin: targetCode
    };
  }

  // BUDGET PROTECTOR SHIELD: Immediately abort and return empty arrays if background sync checks run
  if (isBackgroundSync) {
    return {
      lineup: [],
      isFallback: false,
      availableOrigins: [],
      requestedOrigin: targetCode
    };
  }

  // 4. LIVE LLM HOOK (Only executes if a car completely fails to exist within local data blocks)
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'mock-key') {
    try {
      console.log(`[EXTERNAL CLAUDE QUERY CALL] Authorized spending request for: ${year} ${make} ${model} (${targetCode})`);
      const query = `Provide the complete breakdown list of standard factory trim variations, engines, and original MSRP values for a ${year} ${make} ${model} with an engine capacity size of ${userEngine || 'standard'} within the ${origin || targetCode} market.`;
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: [{ type: 'text', text: MSRP_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: query }]
      });

      const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const clean = jsonMatch ? jsonMatch[0] : text.trim();
      const lineup = JSON.parse(clean);
      const normalized = normalizeLineupProperties(lineup, userEngine, userBodyType, targetCurrency);
      
      set(cKey, normalized, TTL.MSRP);
      await writeToDynamicFileCache(fileCacheKey, normalized);

      return {
        lineup: normalized,
        isFallback: false,
        availableOrigins: [targetCode],
        requestedOrigin: targetCode
      };
    } catch (aiErr) {
      console.error('[AI STREAM FAIL]', aiErr.message);
    }
  }

  const basePriceValue = targetCurrency === 'USD' ? 24500 : (targetCurrency === 'CAD' ? 31000 : 2800000);
  const genericLineup = [
    { trim: `${model.toUpperCase()} Base Metric`, price: basePriceValue, currency: targetCurrency, originCode: targetCode, isFallback: true, source: 'GRA Administrative Estimation Baseline' },
    { trim: `${model.toUpperCase()} Luxury Edition`, price: basePriceValue * 1.3, currency: targetCurrency, originCode: targetCode, isFallback: true, source: 'GRA Administrative Estimation Baseline' }
  ];

  return {
    lineup: normalizeLineupProperties(genericLineup, userEngine, userBodyType, targetCurrency),
    isFallback: true,
    availableOrigins: [targetCode],
    requestedOrigin: targetCode
  };
}

async function fetchRates(origin) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cediduty.com';
    const res = await fetch(`${baseUrl}/api/exchange-rate?origin=${encodeURIComponent(origin)}`);
    if (!res.ok) throw new Error('FX endpoint failed');
    return await res.json();
  } catch (err) {
    return {
      currency_code: 'USD', currency_symbol: '$', rate_to_ghs: 11.77, usd_to_ghs: 11.77,
      all_rates: { USD: 11.77, CAD: 8.65, AED: 3.20, JPY: 0.0782, CNY: 1.623, EUR: 13.21, GBP: 15.54, KRW: 0.00855 },
      date: new Date().toISOString().split('T')[0], source: 'Bank of Ghana (cached)', label: '1 USD = GHC 11.77',
    };
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    let { year, make, model, trim, engine, bodyType, origin, originCode, purchasePrice, freight, vin, condition, customPurchasePriceUsd, isBackgroundSync } = body
    let extendedNhtsaData = null

    if (vin && vin.trim().length === 17) {
      try {
        const nhtsaRes = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin.trim()}?format=json`)
        if (nhtsaRes.ok) {
          const nhtsaData = await nhtsaRes.json()
          const vehicle = nhtsaData?.Results?.[0]
          if (vehicle && (vehicle.ErrorCode === "0" || vehicle.ErrorCode === "1")) {
            year = year || vehicle.ModelYear
            make = make || vehicle.Make
            model = model || vehicle.Model
            trim = trim || vehicle.Trim
            engine = engine || (vehicle.DisplacementL ? `${vehicle.DisplacementL}L` : (vehicle.DisplacementCC ? `${parseFloat(vehicle.DisplacementCC)/1000}L` : ''))
            bodyType = bodyType || vehicle.BodyClass
            
            const plant = vehicle.PlantCountry?.toLowerCase() || '';
            if (plant.includes('canada') || vin.trim().startsWith('2')) { origin = 'Canada'; originCode = 'CA'; }
            else if (plant.includes('japan') || vin.trim().startsWith('J')) { origin = 'Japan'; originCode = 'JP'; }
            else if (plant.includes('korea') || vin.trim().startsWith('K')) { origin = 'South Korea'; originCode = 'KR'; }
            else if (plant.includes('germany') || vin.trim().startsWith('W')) { origin = 'Germany'; originCode = 'DE'; }
            else if (plant.includes('belgium')) { origin = 'Belgium'; originCode = 'BE'; }
            else { origin = origin || 'USA'; originCode = originCode || 'US'; }
          }
        }
      } catch (vinErr) { console.error('[VIN PASSTHROUGH FAILED]', vinErr.message) }
    }

    if (!year || !make || !model) {
      return Response.json({ success: true, isLineup: true, lineup: [], isFallback: false, requestedOrigin: 'US', availableOrigins: [], exchange_rates: {} });
    }

    const eligibility = checkEligibility({ vehicleYear: parseInt(year), origin, bodyType })
    const structuralIneligibility = eligibility.errors?.some(
      err => !err.toLowerCase().includes('year') && !err.toLowerCase().includes('age') && !err.toLowerCase().includes('old')
    );
    if (!eligibility.eligible && structuralIneligibility) {
      return Response.json({ success: false, error: 'Vehicle ineligible for port entry', errors: eligibility.errors });
    }

    const freightUsd = parseFloat(freight) || 1500

    const [lineupData, fxData] = await Promise.all([
      fetchMsrpLineup(year, make, model, origin, engine, bodyType, isBackgroundSync, originCode),
      fetchRates(origin),
    ]);

    const lineup = lineupData?.lineup || (Array.isArray(lineupData) ? lineupData : []);
    const isFallback = lineupData?.isFallback || false;
    const availableOrigins = lineupData?.availableOrigins || [];
    const market = MARKET_CONFIG[origin] || MARKET_CONFIG[originCode] || MARKET_CONFIG['USA'];
    const requestedOrigin = lineupData?.requestedOrigin || normalizeOriginCode(originCode || market?.code || 'US');

    const activePrice = body.selectedPrice ? parseFloat(body.selectedPrice) : null;
    const activeCurrency = body.selectedCurrency || (lineup[0]?.currency || 'USD');
    const activeSource = body.selectedSource || (lineup[0]?.source || 'Estimated Baseline');
    const activeTrimLabel = body.selectedTrim || null;

    const rateToGhs = fxData.all_rates?.[activeCurrency] || fxData.rate_to_ghs;
    const usdToGhs  = fxData.usd_to_ghs || fxData.rate_to_ghs;

    if (activePrice !== null) {
      let finalPurchasePriceUsd = 0;
      if (condition === 'used' && customPurchasePriceUsd) {
        finalPurchasePriceUsd = parseFloat(customPurchasePriceUsd);
      } else {
        const purchasePriceNative = parseFloat(purchasePrice) || 0;
        finalPurchasePriceUsd = activeCurrency === 'USD' ? purchasePriceNative : (purchasePriceNative * rateToGhs) / usdToGhs;
      }

      // Compute calculations cleanly
      const usdToOrigin = activeCurrency === 'USD' ? 1 : usdToGhs / rateToGhs;
      const freightNative = freightUsd * usdToOrigin;
      const age = 2026 - parseInt(year);
      const depRate = age <= 2 ? 0 : age <= 4 ? 0.30 : 0.50;
      const depreciatedNative = activePrice * (1 - depRate);
      const insuranceNative = depreciatedNative * 0.01;
      const cifNative = depreciatedNative + freightNative + insuranceNative;
      const cifGhs = cifNative * rateToGhs;
      const cifUsd = cifGhs / usdToGhs;

      let overagePenaltyRate = 0;
      if (age === 11 || age === 12) overagePenaltyRate = 0.05;
      else if (age >= 13 && age <= 15) overagePenaltyRate = 0.20;
      else if (age >= 16) overagePenaltyRate = 0.50;
      const overagePenaltyGhs = cifGhs * overagePenaltyRate;

      const importDuty   = cifGhs * 0.10;
      const nhil          = cifGhs * 0.025;
      const getfund       = cifGhs * 0.025;
      const importVat    = cifGhs * 0.15;
      const ecowas       = cifGhs * 0.005;
      const examFee      = cifGhs * 0.01;
      const network      = cifGhs * 0.004;
      const specialLevy  = cifGhs * 0.02;
      const eximLevy     = cifGhs * 0.0075;
      const auLevy       = cifGhs * 0.002;
      const disinfection = 35 * usdToGhs;

      const totalDutyGhs = importDuty + nhil + getfund + importVat + ecowas + examFee + network + specialLevy + eximLevy + auLevy + 14.50 + disinfection + overagePenaltyGhs;
      const dynamicExchangeLabel = `1 ${activeCurrency} = GHC ${rateToGhs.toLocaleString('en-US', { minimumFractionDigits: 4 })}`;

      return Response.json({
        success: true, isLineup: false, extendedSpecifications: extendedNhtsaData,
        result: {
          vehicle_label: [year, make, model, activeTrimLabel || trim].filter(Boolean).join(' '),
          msrp_source: activeSource, exchange_rate: rateToGhs, exchange_rate_usd: usdToGhs,
          exchange_label: dynamicExchangeLabel, currency_code: activeCurrency,
          vehicle_age: age, depreciation_pct: depRate * 100, hdv_origin: Math.round(activePrice), hdv_currency: activeCurrency,
          hdv_formatted: `${Math.round(activePrice).toLocaleString()} ${activeCurrency}`, depreciated_value_origin: Math.round(depreciatedNative),
          freight_origin: Math.round(freightNative), insurance_origin: Math.round(insuranceNative), cif_origin: Math.round(cifNative),
          cif_ghs: parseFloat(cifGhs.toFixed(2)), cif_usd: parseFloat(cifUsd.toFixed(2)), overage_rate_label: overagePenaltyRate > 0 ? `${overagePenaltyRate * 100}%` : '0%',
          duties: {
            import_duty: importDuty, nhil, getfund, import_vat: importVat, ecowas, exam_fee: examFee, network_charges: network,
            network_nhil: network * 0.025, network_getfund: network * 0.025, network_vat: network * 0.15, special_import_levy: specialLevy,
            exim_levy: eximLevy, au_levy: auLevy, cert_fee: 0.50, shippers_fee: 9.00, moti_fee: 5.00, disinfection_fee: disinfection, overage_penalty: overagePenaltyGhs
          },
          total_duty_ghs: parseFloat(totalDutyGhs.toFixed(2)), total_duty_usd: parseFloat((totalDutyGhs / usdToGhs).toFixed(2)),
          landed_cost_usd: parseFloat((finalPurchasePriceUsd + freightUsd + (insuranceNative / usdToOrigin) + (totalDutyGhs / usdToGhs)).toFixed(2)),
          landed_cost_ghs: parseFloat(((finalPurchasePriceUsd + freightUsd + (insuranceNative / usdToOrigin) + (totalDutyGhs / usdToGhs)) * usdToGhs).toFixed(2)),
          purchase_price_usd: finalPurchasePriceUsd, freight_usd: freightUsd, insurance_usd: (insuranceNative / usdToOrigin)
        }
      });
    }

    return Response.json({
      success: true, 
      isLineup: true, 
      lineup, 
      isFallback,
      requestedOrigin,
      availableOrigins,
      extendedSpecifications: extendedNhtsaData, 
      exchange_rates: fxData.all_rates
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message, lineup: [], isLineup: true, isFallback: false, availableOrigins: [] });
  }
}