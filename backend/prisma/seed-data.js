/**
 * Seed catalogue with authentic INR pricing.
 * Cities and activities are reference data — users pick from this list.
 *
 * cost_index: 1 = very cheap, 5 = very expensive.
 * Image URLs are seeded picsum links so nothing renders as a broken image.
 */

const img = (seed) => `https://picsum.photos/seed/${seed}/800/600`;

export const cities = [
  {
    name: 'Paris', country: 'France', region: 'Western Europe', costIndex: 4, popularity: 98,
    latitude: 48.8566, longitude: 2.3522, imageUrl: img('paris'),
    activities: [
      ['Louvre Museum', 'culture', 2000, 180, 'Home of the Mona Lisa and 35,000 other works.'],
      ['Eiffel Tower summit', 'sightseeing', 2800, 120, 'Lift to the top level for the city panorama.'],
      ['Le Marais food tour', 'food', 7500, 180, 'Guided tasting walk through the old Jewish quarter.'],
      ['Seine evening cruise', 'sightseeing', 1600, 60, 'One-hour boat loop past the illuminated monuments.'],
      ['Musee d\'Orsay', 'culture', 1500, 120, 'Impressionist collection inside a converted railway station.'],
      ['Montmartre walking tour', 'sightseeing', 0, 90, 'Free self-guided climb to Sacre-Coeur.'],
    ],
  },
  {
    name: 'Rome', country: 'Italy', region: 'Southern Europe', costIndex: 3, popularity: 95,
    latitude: 41.9028, longitude: 12.4964, imageUrl: img('rome'),
    activities: [
      ['Colosseum & Forum', 'sightseeing', 2200, 180, 'Combined ticket for the arena and Roman Forum.'],
      ['Vatican Museums', 'culture', 2500, 210, 'Ends at the Sistine Chapel; book a timed slot.'],
      ['Trastevere food crawl', 'food', 6500, 180, 'Cacio e pepe, supplì and tiramisu across four stops.'],
      ['Pasta making class', 'food', 5800, 150, 'Hands-on class with a local nonna.'],
      ['Borghese Gallery', 'culture', 1400, 120, 'Bernini sculptures in a former cardinal\'s villa.'],
      ['Appian Way bike ride', 'outdoor', 1800, 180, 'Cycle the original Roman road past the catacombs.'],
    ],
  },
  {
    name: 'Tokyo', country: 'Japan', region: 'East Asia', costIndex: 4, popularity: 97,
    latitude: 35.6762, longitude: 139.6503, imageUrl: img('tokyo'),
    activities: [
      ['Tsukiji outer market', 'food', 2800, 120, 'Breakfast crawl through the surviving outer market.'],
      ['teamLab digital museum', 'culture', 2400, 150, 'Immersive light and projection installations.'],
      ['Shibuya & Harajuku walk', 'sightseeing', 0, 120, 'The famous crossing, then Takeshita Street.'],
      ['Sushi omakase dinner', 'food', 11000, 90, 'Chef\'s counter, roughly fifteen courses.'],
      ['Meiji Shrine', 'culture', 0, 90, 'Forest shrine a few minutes from Harajuku station.'],
      ['Golden Gai bar hop', 'nightlife', 4000, 180, 'Six-seat bars packed into a handful of alleys.'],
    ],
  },
  {
    name: 'Bali', country: 'Indonesia', region: 'Southeast Asia', costIndex: 2, popularity: 93,
    latitude: -8.3405, longitude: 115.0920, imageUrl: img('bali'),
    activities: [
      ['Tegallalang rice terraces', 'outdoor', 500, 120, 'Terraced valley walk just north of Ubud.'],
      ['Mount Batur sunrise trek', 'outdoor', 4000, 300, 'Pre-dawn volcano hike with a summit breakfast.'],
      ['Uluwatu temple & kecak', 'culture', 1100, 150, 'Clifftop temple plus the fire dance at sunset.'],
      ['Balinese cooking class', 'food', 3200, 240, 'Market visit followed by a six-dish class.'],
      ['Surf lesson in Canggu', 'outdoor', 2800, 120, 'Beginner lesson including board hire.'],
      ['Ubud monkey forest', 'outdoor', 600, 90, 'Sanctuary with 1,200 long-tailed macaques.'],
    ],
  },
  {
    name: 'New York', country: 'United States', region: 'North America', costIndex: 5, popularity: 96,
    latitude: 40.7128, longitude: -74.0060, imageUrl: img('newyork'),
    activities: [
      ['Metropolitan Museum', 'culture', 2800, 180, 'Two million works across every continent.'],
      ['Broadway show', 'nightlife', 12000, 150, 'Mid-week orchestra seat for a long-running musical.'],
      ['Central Park bike loop', 'outdoor', 2200, 120, 'Six-mile loop with rental included.'],
      ['Brooklyn pizza tour', 'food', 5500, 180, 'Coal-oven classics across three neighbourhoods.'],
      ['Statue of Liberty ferry', 'sightseeing', 2200, 240, 'Ferry plus Ellis Island immigration museum.'],
      ['Top of the Rock', 'sightseeing', 3600, 90, 'Observation deck facing the Empire State Building.'],
    ],
  },
  {
    name: 'Barcelona', country: 'Spain', region: 'Southern Europe', costIndex: 3, popularity: 91,
    latitude: 41.3874, longitude: 2.1686, imageUrl: img('barcelona'),
    activities: [
      ['Sagrada Familia', 'sightseeing', 2400, 120, 'Gaudi\'s basilica, still unfinished after 140 years.'],
      ['Park Guell', 'outdoor', 900, 120, 'Mosaic terraces above the city.'],
      ['Tapas crawl in El Born', 'food', 5000, 180, 'Five bars, one dish and one drink at each.'],
      ['Picasso Museum', 'culture', 1100, 90, 'The artist\'s early work, in five medieval palaces.'],
      ['Barceloneta beach day', 'outdoor', 0, 180, 'City beach with a boardwalk running its length.'],
    ],
  },
  {
    name: 'London', country: 'United Kingdom', region: 'Western Europe', costIndex: 5, popularity: 94,
    latitude: 51.5074, longitude: -0.1278, imageUrl: img('london'),
    activities: [
      ['British Museum', 'culture', 0, 180, 'Free entry; the Rosetta Stone is in room 4.'],
      ['Tower of London', 'sightseeing', 3200, 180, 'Crown Jewels and a Yeoman Warder tour.'],
      ['West End theatre', 'nightlife', 7000, 150, 'Same-day tickets from the Leicester Square booth.'],
      ['Borough Market lunch', 'food', 2200, 90, 'Cheese toasties, oysters and salt beef.'],
      ['Thames river bus', 'sightseeing', 1100, 60, 'Commuter clipper from Westminster to Greenwich.'],
    ],
  },
  {
    name: 'Bangkok', country: 'Thailand', region: 'Southeast Asia', costIndex: 2, popularity: 90,
    latitude: 13.7563, longitude: 100.5018, imageUrl: img('bangkok'),
    activities: [
      ['Grand Palace & Wat Phra Kaew', 'culture', 1500, 180, 'Royal compound and the Emerald Buddha.'],
      ['Chinatown street food walk', 'food', 1800, 180, 'Yaowarat Road after dark.'],
      ['Chao Phraya longtail boat', 'sightseeing', 1400, 120, 'Canal tour of the Thonburi side.'],
      ['Thai cooking class', 'food', 2800, 240, 'Market tour then four dishes.'],
      ['Chatuchak weekend market', 'shopping', 0, 180, 'Fifteen thousand stalls; weekends only.'],
    ],
  },
  {
    name: 'Istanbul', country: 'Turkey', region: 'Western Asia', costIndex: 2, popularity: 88,
    latitude: 41.0082, longitude: 28.9784, imageUrl: img('istanbul'),
    activities: [
      ['Hagia Sophia', 'culture', 2200, 90, 'Byzantine cathedral, then mosque, then museum, now mosque.'],
      ['Grand Bazaar', 'shopping', 0, 120, 'Four thousand shops under one roof.'],
      ['Bosphorus ferry', 'sightseeing', 750, 120, 'Public ferry between two continents.'],
      ['Turkish bath (hammam)', 'culture', 4000, 90, 'Scrub and foam wash in a 16th-century bathhouse.'],
      ['Meze dinner in Karakoy', 'food', 3200, 120, 'Small plates and raki by the water.'],
    ],
  },
  {
    name: 'Dubai', country: 'United Arab Emirates', region: 'Western Asia', costIndex: 4, popularity: 87,
    latitude: 25.2048, longitude: 55.2708, imageUrl: img('dubai'),
    activities: [
      ['Burj Khalifa observation deck', 'sightseeing', 4200, 90, 'Levels 124 and 125 of the tallest building on earth.'],
      ['Desert safari with dinner', 'outdoor', 7000, 360, 'Dune drive, camels and a barbecue camp.'],
      ['Dubai Mall & fountain show', 'shopping', 0, 150, 'Free fountain show every half hour after sunset.'],
      ['Old Dubai souk & abra', 'culture', 500, 120, 'Gold and spice souks either side of the creek.'],
    ],
  },
  {
    name: 'Singapore', country: 'Singapore', region: 'Southeast Asia', costIndex: 4, popularity: 86,
    latitude: 1.3521, longitude: 103.8198, imageUrl: img('singapore'),
    activities: [
      ['Gardens by the Bay', 'outdoor', 1800, 150, 'Cloud Forest dome and the Supertree light show.'],
      ['Hawker centre dinner', 'food', 900, 60, 'Chicken rice and chilli crab at Maxwell or Lau Pa Sat.'],
      ['Sentosa island day', 'outdoor', 3600, 300, 'Beaches, cable car and the luge.'],
      ['Marina Bay Sands SkyPark', 'sightseeing', 2400, 60, 'Observation deck 57 floors up.'],
    ],
  },
  {
    name: 'Amsterdam', country: 'Netherlands', region: 'Western Europe', costIndex: 4, popularity: 85,
    latitude: 52.3676, longitude: 4.9041, imageUrl: img('amsterdam'),
    activities: [
      ['Rijksmuseum', 'culture', 2100, 150, 'Rembrandt\'s Night Watch and the Dutch Golden Age.'],
      ['Anne Frank House', 'culture', 1500, 90, 'Timed entry only, released two months ahead.'],
      ['Canal bike tour', 'outdoor', 2800, 180, 'Guided ride through the Jordaan and the Nine Streets.'],
      ['Van Gogh Museum', 'culture', 2000, 120, 'The largest collection of his work anywhere.'],
    ],
  },
  {
    name: 'Prague', country: 'Czechia', region: 'Central Europe', costIndex: 2, popularity: 84,
    latitude: 50.0755, longitude: 14.4378, imageUrl: img('prague'),
    activities: [
      ['Prague Castle complex', 'sightseeing', 1600, 180, 'Cathedral, old palace and Golden Lane.'],
      ['Charles Bridge at sunrise', 'sightseeing', 0, 60, 'Go before 7am or share it with a thousand people.'],
      ['Beer hall dinner', 'food', 1800, 120, 'Goulash and unfiltered lager.'],
      ['Old Town astronomical clock', 'culture', 0, 45, 'Hourly procession of the apostles.'],
    ],
  },
  {
    name: 'Lisbon', country: 'Portugal', region: 'Southern Europe', costIndex: 2, popularity: 83,
    latitude: 38.7223, longitude: -9.1393, imageUrl: img('lisbon'),
    activities: [
      ['Tram 28 route', 'sightseeing', 400, 60, 'The classic yellow tram through Alfama.'],
      ['Belem Tower & pasteis', 'sightseeing', 1100, 150, 'Riverside tower and the original custard tarts.'],
      ['Fado dinner show', 'nightlife', 4000, 150, 'Portuguese blues in a small Alfama venue.'],
      ['Sintra day trip', 'outdoor', 2200, 360, 'Pena Palace and the Moorish castle by train.'],
    ],
  },
  {
    name: 'Kyoto', country: 'Japan', region: 'East Asia', costIndex: 3, popularity: 89,
    latitude: 35.0116, longitude: 135.7681, imageUrl: img('kyoto'),
    activities: [
      ['Fushimi Inari shrine', 'culture', 0, 150, 'Ten thousand vermilion gates up the mountain.'],
      ['Arashiyama bamboo grove', 'outdoor', 0, 90, 'Best before 8am; add the monkey park.'],
      ['Tea ceremony', 'culture', 3600, 90, 'Formal matcha service with an explanation in English.'],
      ['Kinkaku-ji golden pavilion', 'sightseeing', 500, 60, 'Gold-leaf temple over a reflecting pond.'],
      ['Nishiki Market food walk', 'food', 2200, 120, 'Five blocks of pickles, tofu and skewers.'],
    ],
  },
  {
    name: 'Sydney', country: 'Australia', region: 'Oceania', costIndex: 4, popularity: 85,
    latitude: -33.8688, longitude: 151.2093, imageUrl: img('sydney'),
    activities: [
      ['Opera House tour', 'culture', 3800, 60, 'Behind the scenes of the concert halls.'],
      ['Bondi to Coogee walk', 'outdoor', 0, 120, 'Six kilometres of clifftop coast path.'],
      ['Harbour Bridge climb', 'outdoor', 16000, 210, 'Summit climb over the harbour.'],
      ['Manly ferry & beach', 'outdoor', 750, 240, 'Public ferry with the best free harbour views.'],
    ],
  },
  {
    name: 'Cape Town', country: 'South Africa', region: 'Africa', costIndex: 2, popularity: 82,
    latitude: -33.9249, longitude: 18.4241, imageUrl: img('capetown'),
    activities: [
      ['Table Mountain cableway', 'outdoor', 2200, 180, 'Rotating cable car to the plateau.'],
      ['Cape Peninsula drive', 'outdoor', 5500, 480, 'Chapman\'s Peak, Boulders penguins and the Cape Point.'],
      ['Robben Island tour', 'culture', 3000, 240, 'Ferry and prison tour led by former inmates.'],
      ['Winelands tasting', 'food', 5000, 300, 'Stellenbosch and Franschhoek estates.'],
    ],
  },
  {
    name: 'Marrakesh', country: 'Morocco', region: 'Africa', costIndex: 2, popularity: 80,
    latitude: 31.6295, longitude: -7.9811, imageUrl: img('marrakesh'),
    activities: [
      ['Jemaa el-Fnaa at night', 'sightseeing', 0, 120, 'Food stalls, storytellers and snake charmers.'],
      ['Bahia Palace', 'culture', 750, 90, 'Nineteenth-century courtyards and painted ceilings.'],
      ['Souk shopping walk', 'shopping', 0, 150, 'Leather, lanterns and spices; haggling expected.'],
      ['Atlas Mountains day trip', 'outdoor', 5000, 480, 'Berber villages and the Ourika valley.'],
    ],
  },
  {
    name: 'Reykjavik', country: 'Iceland', region: 'Northern Europe', costIndex: 5, popularity: 79,
    latitude: 64.1466, longitude: -21.9426, imageUrl: img('reykjavik'),
    activities: [
      ['Golden Circle tour', 'outdoor', 8000, 480, 'Thingvellir, Geysir and Gullfoss in one loop.'],
      ['Blue Lagoon', 'outdoor', 7000, 180, 'Geothermal spa; book a slot well ahead.'],
      ['Northern lights hunt', 'outdoor', 6500, 240, 'September to March, weather permitting.'],
      ['Whale watching', 'outdoor', 8500, 180, 'Old harbour departure, humpbacks and minke.'],
    ],
  },
  {
    name: 'Vienna', country: 'Austria', region: 'Central Europe', costIndex: 3, popularity: 81,
    latitude: 48.2082, longitude: 16.3738, imageUrl: img('vienna'),
    activities: [
      ['Schonbrunn Palace', 'sightseeing', 2400, 180, 'Habsburg summer palace and its gardens.'],
      ['Classical concert', 'nightlife', 5000, 120, 'Mozart and Strauss in a period hall.'],
      ['Naschmarkt food walk', 'food', 2800, 120, 'A kilometre and a half of stalls.'],
      ['Belvedere & The Kiss', 'culture', 1600, 120, 'Klimt\'s best-known painting.'],
    ],
  },
  {
    name: 'Budapest', country: 'Hungary', region: 'Central Europe', costIndex: 2, popularity: 80,
    latitude: 47.4979, longitude: 19.0402, imageUrl: img('budapest'),
    activities: [
      ['Szechenyi thermal baths', 'outdoor', 2200, 180, 'Eighteen pools in a neo-baroque complex.'],
      ['Parliament building tour', 'sightseeing', 1400, 60, 'Book ahead; English tours sell out.'],
      ['Ruin bar evening', 'nightlife', 2200, 180, 'Szimpla Kert and the Jewish quarter.'],
      ['Danube night cruise', 'sightseeing', 1800, 90, 'The lit Parliament from the water.'],
    ],
  },
  {
    name: 'Athens', country: 'Greece', region: 'Southern Europe', costIndex: 2, popularity: 82,
    latitude: 37.9838, longitude: 23.7275, imageUrl: img('athens'),
    activities: [
      ['Acropolis & Parthenon', 'sightseeing', 1800, 150, 'Go at opening or an hour before close.'],
      ['Acropolis Museum', 'culture', 900, 120, 'Glass-floored galleries over an excavated quarter.'],
      ['Plaka food tour', 'food', 5500, 180, 'Souvlaki, loukoumades and a distillery stop.'],
      ['Cape Sounion sunset', 'sightseeing', 3200, 300, 'Temple of Poseidon on the coast.'],
    ],
  },
  {
    name: 'Berlin', country: 'Germany', region: 'Central Europe', costIndex: 3, popularity: 83,
    latitude: 52.5200, longitude: 13.4050, imageUrl: img('berlin'),
    activities: [
      ['East Side Gallery', 'culture', 0, 60, 'The longest surviving stretch of the Wall.'],
      ['Museum Island pass', 'culture', 2200, 240, 'Five museums including the Pergamon.'],
      ['Third Reich walking tour', 'culture', 1800, 180, 'Bunker site, memorial and Topography of Terror.'],
      ['Street food at Markthalle Neun', 'food', 1800, 90, 'Thursday night is the one to aim for.'],
    ],
  },
  {
    name: 'Hanoi', country: 'Vietnam', region: 'Southeast Asia', costIndex: 1, popularity: 78,
    latitude: 21.0278, longitude: 105.8342, imageUrl: img('hanoi'),
    activities: [
      ['Old Quarter street food tour', 'food', 1800, 180, 'Pho, bun cha, egg coffee.'],
      ['Ha Long Bay day cruise', 'outdoor', 6500, 600, 'Limestone karsts, kayaking and lunch aboard.'],
      ['Temple of Literature', 'culture', 200, 60, 'Vietnam\'s first university, founded 1070.'],
      ['Water puppet show', 'culture', 750, 60, 'Thousand-year-old art form performed in a pool.'],
    ],
  },
  {
    name: 'Mexico City', country: 'Mexico', region: 'North America', costIndex: 2, popularity: 81,
    latitude: 19.4326, longitude: -99.1332, imageUrl: img('mexicocity'),
    activities: [
      ['Teotihuacan pyramids', 'sightseeing', 4000, 360, 'Sun and Moon pyramids an hour outside the city.'],
      ['Frida Kahlo Casa Azul', 'culture', 1400, 90, 'Timed tickets, always sold out on the day.'],
      ['Taco crawl in Roma', 'food', 2800, 180, 'Al pastor, suadero and a mezcal stop.'],
      ['Xochimilco trajinera', 'outdoor', 2200, 240, 'Painted boats on the pre-Hispanic canals.'],
    ],
  },
  {
    name: 'Rio de Janeiro', country: 'Brazil', region: 'South America', costIndex: 2, popularity: 80,
    latitude: -22.9068, longitude: -43.1729, imageUrl: img('rio'),
    activities: [
      ['Christ the Redeemer', 'sightseeing', 2800, 180, 'Cog train up Corcovado.'],
      ['Sugarloaf cable car', 'sightseeing', 2200, 150, 'Two-stage ascent, best at sunset.'],
      ['Ipanema beach day', 'outdoor', 0, 240, 'Posto 9 for the people-watching.'],
      ['Samba night in Lapa', 'nightlife', 2200, 180, 'Live bands under the arches.'],
    ],
  },
  {
    name: 'Buenos Aires', country: 'Argentina', region: 'South America', costIndex: 2, popularity: 76,
    latitude: -34.6037, longitude: -58.3816, imageUrl: img('buenosaires'),
    activities: [
      ['Tango show and dinner', 'nightlife', 6500, 180, 'San Telmo dinner show with a lesson first.'],
      ['Recoleta cemetery', 'culture', 750, 90, 'Evita\'s tomb among the mausoleums.'],
      ['Parrilla steak dinner', 'food', 3200, 120, 'Bife de chorizo and a Malbec.'],
      ['La Boca & Caminito', 'sightseeing', 0, 120, 'Painted houses and street tango.'],
    ],
  },
  {
    name: 'Seoul', country: 'South Korea', region: 'East Asia', costIndex: 3, popularity: 84,
    latitude: 37.5665, longitude: 126.9780, imageUrl: img('seoul'),
    activities: [
      ['Gyeongbokgung Palace', 'culture', 300, 120, 'Free entry if you wear a rented hanbok.'],
      ['Korean BBQ dinner', 'food', 2800, 120, 'Grill-at-the-table pork belly and sides.'],
      ['Bukchon Hanok Village', 'sightseeing', 0, 90, 'Traditional houses between two palaces.'],
      ['Hongdae nightlife', 'nightlife', 3600, 240, 'Student district; live music and late food.'],
    ],
  },
  {
    name: 'Dublin', country: 'Ireland', region: 'Northern Europe', costIndex: 4, popularity: 74,
    latitude: 53.3498, longitude: -6.2603, imageUrl: img('dublin'),
    activities: [
      ['Guinness Storehouse', 'food', 2800, 120, 'Seven floors ending in the Gravity Bar.'],
      ['Trinity College & Book of Kells', 'culture', 1800, 90, 'Ninth-century gospel manuscript and the Long Room.'],
      ['Temple Bar trad session', 'nightlife', 2200, 150, 'Live traditional music from the early evening.'],
      ['Cliffs of Moher day trip', 'outdoor', 6000, 720, 'Long coach day, worth it in clear weather.'],
    ],
  },
  {
    name: 'Zurich', country: 'Switzerland', region: 'Central Europe', costIndex: 5, popularity: 72,
    latitude: 47.3769, longitude: 8.5417, imageUrl: img('zurich'),
    activities: [
      ['Lake Zurich cruise', 'sightseeing', 2800, 90, 'Covered by the day travel pass.'],
      ['Uetliberg hike', 'outdoor', 1100, 180, 'Train up, walk down the ridge path.'],
      ['Old Town chocolate tour', 'food', 5000, 150, 'Four chocolatiers with tastings.'],
      ['Kunsthaus art museum', 'culture', 2400, 120, 'Giacometti, Munch and a strong modern wing.'],
    ],
  },
  {
    name: 'Bologna', country: 'Italy', region: 'Southern Europe', costIndex: 2, popularity: 68,
    latitude: 44.4949, longitude: 11.3426, imageUrl: img('bologna'),
    activities: [
      ['Quadrilatero market walk', 'food', 0, 90, 'Medieval market lanes behind Piazza Maggiore.'],
      ['Asinelli Tower climb', 'sightseeing', 500, 60, '498 steps for the rooftop view.'],
      ['Tortellini making class', 'food', 5000, 180, 'Fresh egg pasta from scratch.'],
      ['Parmigiano dairy visit', 'food', 3600, 240, 'Early-morning production tour with tasting.'],
    ],
  },
  {
    name: 'Porto', country: 'Portugal', region: 'Southern Europe', costIndex: 2, popularity: 71,
    latitude: 41.1579, longitude: -8.6291, imageUrl: img('porto'),
    activities: [
      ['Port wine cellar tasting', 'food', 2200, 90, 'Vila Nova de Gaia, across the bridge.'],
      ['Livraria Lello', 'culture', 750, 45, 'The staircase that reportedly inspired Hogwarts.'],
      ['Douro valley day trip', 'outdoor', 7800, 540, 'Terraced vineyards, two quintas and a river stretch.'],
      ['Ribeira riverside walk', 'sightseeing', 0, 60, 'Tiled houses under the Dom Luis bridge.'],
    ],
  },
];
