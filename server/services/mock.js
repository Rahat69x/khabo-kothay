/**
 * Mock data service for Gulshan, Banani, Baridhara, Notun Bazar area
 * Realistic fake restaurants, coordinates, varied ratings, prices, and traffic conditions
 */

export const PRESET_LOCATIONS = {
  "Notun Bazar": { lat: 23.7975, lng: 90.4234, name: "Notun Bazar Bus Stand" },
  "Gulshan 1": { lat: 23.7785, lng: 90.4178, name: "Gulshan 1 Circle" },
  "Gulshan 2": { lat: 23.7925, lng: 90.4150, name: "Gulshan 2 Circle" },
  "Banani": { lat: 23.7937, lng: 90.4046, name: "Banani Road 11" },
  "Baridhara": { lat: 23.7998, lng: 90.4215, name: "Baridhara Diplomatic Zone" }
};

export const MOCK_RESTAURANTS = [
  // --- Japanese ---
  {
    id: "mock_jap_1",
    displayName: "Tokyo Drift Ramen (Heavy Traffic Test)",
    formattedAddress: "Road 134, Gulshan 1, Dhaka 1212",
    location: { latitude: 23.7820, longitude: 90.4180 },
    rating: 4.6,
    userRatingCount: 650,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: [
        "Monday: 11:30 AM – 11:00 PM",
        "Tuesday: 11:30 AM – 11:00 PM",
        "Wednesday: 11:30 AM – 11:00 PM",
        "Thursday: 11:30 AM – 11:30 PM",
        "Friday: 12:30 PM – 11:30 PM",
        "Saturday: 11:30 AM – 11:30 PM",
        "Sunday: 11:30 AM – 11:00 PM"
      ],
      closingTime: "23:00"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 1400,
    mockDurationSeconds: 1500, // 25 mins (heavy traffic!)
    mockStaticDurationSeconds: 850,
    photos: [{ name: "places/mock_jap_1/photos/0", authorAttributions: [{ displayName: "Tokyo Drift" }] }],
    nationalPhoneNumber: "+880 1711-234567",
    websiteUri: "https://example.com/tokyo-drift"
  },
  {
    id: "mock_jap_2",
    displayName: "Sakura Breeze Sushi (Light Traffic Test)",
    formattedAddress: "Road 11, Block D, Banani, Dhaka 1213",
    location: { latitude: 23.7945, longitude: 90.4040 },
    rating: 4.7,
    userRatingCount: 820,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 2100,
    mockDurationSeconds: 720, // 12 mins (light traffic!)
    mockStaticDurationSeconds: 680,
    photos: [{ name: "places/mock_jap_2/photos/0", authorAttributions: [{ displayName: "Sakura Breeze" }] }],
    nationalPhoneNumber: "+880 1712-345678",
    websiteUri: "https://example.com/sakura-breeze"
  },
  {
    id: "mock_jap_3",
    displayName: "Mount Fuji Teppanyaki Lounge",
    formattedAddress: "Park Road, Baridhara Diplomatic Zone, Dhaka 1212",
    location: { latitude: 23.8010, longitude: 90.4225 },
    rating: 4.8,
    userRatingCount: 940,
    priceLevel: 4,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:30 PM – 11:30 PM"],
      closingTime: "23:30"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 3200,
    mockDurationSeconds: 900, // 15 mins (low traffic)
    mockStaticDurationSeconds: 850,
    photos: [{ name: "places/mock_jap_3/photos/0", authorAttributions: [{ displayName: "Mount Fuji" }] }],
    nationalPhoneNumber: "+880 1713-456789",
    websiteUri: "https://example.com/mt-fuji"
  },

  // --- Korean ---
  {
    id: "mock_kor_1",
    displayName: "Seoul Soul Korean BBQ",
    formattedAddress: "Avenue 2, Gulshan 2, Dhaka 1212",
    location: { latitude: 23.7930, longitude: 90.4165 },
    rating: 4.7,
    userRatingCount: 510,
    priceLevel: 3,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 10:30 PM"],
      closingTime: "22:30"
    },
    primaryType: "korean_restaurant",
    cuisine: "Korean",
    mockDistanceMeters: 1700,
    mockDurationSeconds: 960, // 16 min (moderate)
    mockStaticDurationSeconds: 780,
    photos: [{ name: "places/mock_kor_1/photos/0", authorAttributions: [{ displayName: "Seoul Soul" }] }],
    nationalPhoneNumber: "+880 1714-567890",
    websiteUri: "https://example.com/seoul-soul"
  },

  // --- Chinese ---
  {
    id: "mock_chi_1",
    displayName: "Dynasty Dim Sum & Wok",
    formattedAddress: "Road 12, Banani, Dhaka 1213",
    location: { latitude: 23.7915, longitude: 90.4055 },
    rating: 4.5,
    userRatingCount: 380,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:30 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "chinese_restaurant",
    cuisine: "Chinese",
    mockDistanceMeters: 2000,
    mockDurationSeconds: 780, // 13 min (light)
    mockStaticDurationSeconds: 720,
    photos: [{ name: "places/mock_chi_1/photos/0", authorAttributions: [{ displayName: "Dynasty" }] }],
    nationalPhoneNumber: "+880 1715-678901",
    websiteUri: "https://example.com/dynasty"
  },

  // --- Bangladeshi ---
  {
    id: "mock_bd_1",
    displayName: "Sonar Tori Traditional Feast",
    formattedAddress: "Progoti Shoroni, Notun Bazar, Dhaka 1212",
    location: { latitude: 23.7985, longitude: 90.4245 },
    rating: 4.5,
    userRatingCount: 1200,
    priceLevel: 1,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 8:00 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "bangladeshi_restaurant",
    cuisine: "Bangladeshi",
    mockDistanceMeters: 750,
    mockDurationSeconds: 420, // 7 min (low traffic)
    mockStaticDurationSeconds: 380,
    photos: [{ name: "places/mock_bd_1/photos/0", authorAttributions: [{ displayName: "Sonar Tori" }] }],
    nationalPhoneNumber: "+880 1716-789012",
    websiteUri: "https://example.com/sonar-tori"
  },
  {
    id: "mock_bd_2",
    displayName: "Mezban Heritage Kitchen",
    formattedAddress: "Road 10, Banani, Dhaka 1213",
    location: { latitude: 23.7920, longitude: 90.4070 },
    rating: 4.6,
    userRatingCount: 780,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "bangladeshi_restaurant",
    cuisine: "Bangladeshi",
    mockDistanceMeters: 2500,
    mockDurationSeconds: 1080, // 18 min (moderate)
    mockStaticDurationSeconds: 850,
    photos: [{ name: "places/mock_bd_2/photos/0", authorAttributions: [{ displayName: "Mezban Heritage" }] }],
    nationalPhoneNumber: "+880 1717-890123",
    websiteUri: "https://example.com/mezban"
  },

  // --- Indian ---
  {
    id: "mock_ind_1",
    displayName: "Royal Lucknow Zaika",
    formattedAddress: "South Avenue, Gulshan 2, Dhaka 1212",
    location: { latitude: 23.7910, longitude: 90.4140 },
    rating: 4.6,
    userRatingCount: 610,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "indian_restaurant",
    cuisine: "Indian",
    mockDistanceMeters: 1500,
    mockDurationSeconds: 960, // 16 min (moderate)
    mockStaticDurationSeconds: 780,
    photos: [{ name: "places/mock_ind_1/photos/0", authorAttributions: [{ displayName: "Royal Lucknow" }] }],
    nationalPhoneNumber: "+880 1718-901234",
    websiteUri: "https://example.com/royal-lucknow"
  },

  // --- Biriyani ---
  {
    id: "mock_bir_1",
    displayName: "Kacchi Symphony Gulshan",
    formattedAddress: "Gulshan South Avenue, Gulshan 1, Dhaka 1212",
    location: { latitude: 23.7790, longitude: 90.4185 },
    rating: 4.6,
    userRatingCount: 1450,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:30 AM – 11:30 PM"],
      closingTime: "23:30"
    },
    primaryType: "biriyani_restaurant",
    cuisine: "Biriyani",
    mockDistanceMeters: 1600,
    mockDurationSeconds: 1400, // 23 min (heavy traffic)
    mockStaticDurationSeconds: 850,
    photos: [{ name: "places/mock_bir_1/photos/0", authorAttributions: [{ displayName: "Kacchi Symphony" }] }],
    nationalPhoneNumber: "+880 1719-012345",
    websiteUri: "https://example.com/kacchi-symphony"
  },
  {
    id: "mock_bir_2",
    displayName: "Old Town Kacchi Express Notun Bazar",
    formattedAddress: "Vatara Main Road, Notun Bazar, Dhaka 1212",
    location: { latitude: 23.7960, longitude: 90.4240 },
    rating: 4.5,
    userRatingCount: 890,
    priceLevel: 1,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:00 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "biriyani_restaurant",
    cuisine: "Biriyani",
    mockDistanceMeters: 650,
    mockDurationSeconds: 360, // 6 min (light)
    mockStaticDurationSeconds: 320,
    photos: [{ name: "places/mock_bir_2/photos/0", authorAttributions: [{ displayName: "Old Town Kacchi" }] }],
    nationalPhoneNumber: "+880 1720-123456",
    websiteUri: "https://example.com/old-town-kacchi"
  },

  // --- Kabab ---
  {
    id: "mock_kab_1",
    displayName: "Charcoal Crown Sheekh & Grill",
    formattedAddress: "Road 7, Baridhara, Dhaka 1212",
    location: { latitude: 23.8005, longitude: 90.4200 },
    rating: 4.7,
    userRatingCount: 710,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 5:00 PM – 12:00 AM"],
      closingTime: "00:00"
    },
    primaryType: "kabab_restaurant",
    cuisine: "Kabab",
    mockDistanceMeters: 2200,
    mockDurationSeconds: 720, // 12 min (light)
    mockStaticDurationSeconds: 680,
    photos: [{ name: "places/mock_kab_1/photos/0", authorAttributions: [{ displayName: "Charcoal Crown" }] }],
    nationalPhoneNumber: "+880 1721-234567",
    websiteUri: "https://example.com/charcoal-crown"
  },

  // --- Cafe & Coffee ---
  {
    id: "mock_caf_1",
    displayName: "Velvet Roast Artisan Cafe",
    formattedAddress: "Road 55, Gulshan 2, Dhaka 1212",
    location: { latitude: 23.7940, longitude: 90.4130 },
    rating: 4.7,
    userRatingCount: 1120,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 8:00 AM – 11:30 PM"],
      closingTime: "23:30"
    },
    primaryType: "cafe",
    cuisine: "Cafe",
    mockDistanceMeters: 1300,
    mockDurationSeconds: 600, // 10 min (light)
    mockStaticDurationSeconds: 560,
    photos: [{ name: "places/mock_caf_1/photos/0", authorAttributions: [{ displayName: "Velvet Roast" }] }],
    nationalPhoneNumber: "+880 1722-345678",
    websiteUri: "https://example.com/velvet-roast"
  },
  {
    id: "mock_cof_1",
    displayName: "Bean Craft Specialty Coffee Lab",
    formattedAddress: "Road 11, Banani, Dhaka 1213",
    location: { latitude: 23.7930, longitude: 90.4050 },
    rating: 4.8,
    userRatingCount: 880,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 7:30 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "coffee_shop",
    cuisine: "Coffee",
    mockDistanceMeters: 2100,
    mockDurationSeconds: 720, // 12 min (light)
    mockStaticDurationSeconds: 670,
    photos: [{ name: "places/mock_cof_1/photos/0", authorAttributions: [{ displayName: "Bean Craft" }] }],
    nationalPhoneNumber: "+880 1723-456789",
    websiteUri: "https://example.com/bean-craft"
  },

  // --- Burger & Fast Food ---
  {
    id: "mock_bur_1",
    displayName: "Thunder Bun Smashers",
    formattedAddress: "Road 11, Banani, Dhaka 1213",
    location: { latitude: 23.7950, longitude: 90.4060 },
    rating: 4.7,
    userRatingCount: 930,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 12:00 AM"],
      closingTime: "00:00"
    },
    primaryType: "burger_restaurant",
    cuisine: "Burger",
    mockDistanceMeters: 2300,
    mockDurationSeconds: 780, // 13 min (light)
    mockStaticDurationSeconds: 710,
    photos: [{ name: "places/mock_bur_1/photos/0", authorAttributions: [{ displayName: "Thunder Bun" }] }],
    nationalPhoneNumber: "+880 1724-567890",
    websiteUri: "https://example.com/thunder-bun"
  },
  {
    id: "mock_ff_1",
    displayName: "Urban Fry Shack Express",
    formattedAddress: "Madani Avenue, Notun Bazar, Dhaka 1212",
    location: { latitude: 23.7970, longitude: 90.4250 },
    rating: 4.2,
    userRatingCount: 320,
    priceLevel: 1,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:00 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "fast_food_restaurant",
    cuisine: "Fast Food",
    mockDistanceMeters: 500,
    mockDurationSeconds: 300, // 5 min
    mockStaticDurationSeconds: 280,
    photos: [{ name: "places/mock_ff_1/photos/0", authorAttributions: [{ displayName: "Urban Fry" }] }],
    nationalPhoneNumber: "+880 1725-678901",
    websiteUri: "https://example.com/urban-fry"
  },

  // --- Dessert ---
  {
    id: "mock_des_1",
    displayName: "Sweet Symphony Gelato & Waffle",
    formattedAddress: "Gulshan North Avenue, Gulshan 2, Dhaka 1212",
    location: { latitude: 23.7935, longitude: 90.4170 },
    rating: 4.8,
    userRatingCount: 650,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 11:30 PM"],
      closingTime: "23:30"
    },
    primaryType: "dessert_shop",
    cuisine: "Dessert",
    mockDistanceMeters: 1600,
    mockDurationSeconds: 720, // 12 min (light)
    mockStaticDurationSeconds: 680,
    photos: [{ name: "places/mock_des_1/photos/0", authorAttributions: [{ displayName: "Sweet Symphony" }] }],
    nationalPhoneNumber: "+880 1726-789012",
    websiteUri: "https://example.com/sweet-symphony"
  },

  // ==========================================
  // EXACT TEST TRIO A, B, C for unit tests
  // Trio A: 2.4 km, 14 min, ৳৳, 4.6, moderate traffic (500 reviews)
  // Trio B: 1.6 km, 27 min, ৳৳, 4.5, heavy traffic (400 reviews)
  // Trio C: 3.1 km, 16 min, ৳৳৳, 4.7, low traffic (900 reviews)
  // ==========================================
  {
    id: "trio_place_A",
    displayName: "Test Spot A (Balanced Moderate)",
    formattedAddress: "Road 44, Gulshan 2, Dhaka 1212",
    location: { latitude: 23.7915, longitude: 90.4180 },
    rating: 4.6,
    userRatingCount: 500,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:00 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 2400,
    mockDurationSeconds: 840, // 14 min
    mockStaticDurationSeconds: 650, // ratio: 1.29 -> moderate
    photos: [{ name: "places/trio_place_A/photos/0", authorAttributions: [{ displayName: "Test A" }] }],
    nationalPhoneNumber: "+880 1700-000001",
    websiteUri: "https://example.com/test-a"
  },
  {
    id: "trio_place_B",
    displayName: "Test Spot B (Close but Heavy Traffic)",
    formattedAddress: "Road 135, Gulshan 1, Dhaka 1212",
    location: { latitude: 23.7810, longitude: 90.4170 },
    rating: 4.5,
    userRatingCount: 400,
    priceLevel: 2,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 11:00 AM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 1600,
    mockDurationSeconds: 1620, // 27 min
    mockStaticDurationSeconds: 950, // ratio: 1.70 -> heavy
    photos: [{ name: "places/trio_place_B/photos/0", authorAttributions: [{ displayName: "Test B" }] }],
    nationalPhoneNumber: "+880 1700-000002",
    websiteUri: "https://example.com/test-b"
  },
  {
    id: "trio_place_C",
    displayName: "Test Spot C (Far Premium Best Rated)",
    formattedAddress: "Park Road, Baridhara, Dhaka 1212",
    location: { latitude: 23.8015, longitude: 90.4230 },
    rating: 4.7,
    userRatingCount: 900,
    priceLevel: 3,
    currentOpeningHours: { openNow: true },
    regularOpeningHours: {
      openNow: true,
      weekdayDescriptions: ["Everyday: 12:00 PM – 11:00 PM"],
      closingTime: "23:00"
    },
    primaryType: "japanese_restaurant",
    cuisine: "Japanese",
    mockDistanceMeters: 3100,
    mockDurationSeconds: 960, // 16 min
    mockStaticDurationSeconds: 910, // ratio: 1.05 -> low
    photos: [{ name: "places/trio_place_C/photos/0", authorAttributions: [{ displayName: "Test C" }] }],
    nationalPhoneNumber: "+880 1700-000003",
    websiteUri: "https://example.com/test-c"
  }
];

export function getMockCandidates(cuisine, budget = null) {
  let list = [...MOCK_RESTAURANTS];
  if (cuisine && cuisine !== "All") {
    list = list.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  }
  if (budget) {
    const budgetNum = parseInt(budget, 10);
    if (!isNaN(budgetNum)) {
      list = list.filter(r => r.priceLevel === null || r.priceLevel <= budgetNum + 1);
    }
  }
  return list.slice(0, 20);
}
