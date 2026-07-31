export type Language = 'en' | 'bn' | 'hi';

type Translations = {
  [key: string]: {
    en: string;
    bn: string;
    hi: string;
  };
};

export const translations: Translations = {
  explore: {
    en: 'Explore',
    bn: 'অন্বেষণ',
    hi: 'खोजें',
  },
  book: {
    en: 'Book',
    bn: 'বুক করুন',
    hi: 'बुक करें',
  },
  appointments: {
    en: 'Appointments',
    bn: 'কাজ শেষ',
    hi: 'अपॉइंटमेंट',
  },
  profile: {
    en: 'Profile',
    bn: 'প্রোফাইল',
    hi: 'प्रोफ़ाइल',
  },
  signIn: {
    en: 'Sign In',
    bn: 'সাইন ইন',
    hi: 'साइन इन करें',
  },
  dashboard: {
    en: 'Dashboard',
    bn: 'ড্যাশবোর্ড',
    hi: 'डैशबोर्ड',
  },
  shopManagement: {
    en: 'Shop Management',
    bn: 'দোকান পরিচালনা',
    hi: 'दुकान प्रबंधन',
  },
  language: {
    en: 'Language',
    bn: 'ভাষা',
    hi: 'भाषा',
  },
  // Dashboard / stat card labels
  upcoming: {
    en: 'Upcoming',
    bn: 'নতুন',
    hi: 'आगामी',
  },
  todaysSchedule: {
    en: "Today's Schedule",
    bn: 'কাজ',
    hi: 'आज का शेड्यूल',
  },
  revenue: {
    en: 'Revenue',
    bn: 'আয়',
    hi: 'राजस्व',
  },
  bookings: {
    en: 'Bookings',
    bn: 'বুকিং',
    hi: 'बुकिंग',
  },
  services: {
    en: 'Services',
    bn: 'পরিষেবা',
    hi: 'सेवाएं',
  },
  clients: {
    en: 'Clients',
    bn: 'ক্লায়েন্ট',
    hi: 'ग्राहक',
  },
  completeAppointment: {
    en: 'Complete Appointment',
    bn: 'কাজ শেষ',
    hi: 'अपॉइंटमेंट पूरा करें',
  },
  completing: {
    en: 'Completing...',
    bn: 'শেষ হচ্ছে...',
    hi: 'पूरा हो रहा है...',
  },
  // Booking page specific
  bookAppointment: {
    en: 'Book Appointment',
    bn: 'বুক করুন',
    hi: 'अपॉइंटमेंट बुक करें',
  },
  searchServices: {
    en: 'Search services...',
    bn: 'সার্ভিস খুঁজুন...',
    hi: 'सेवाएं खोजें...',
  },
  servicesAvailable: {
    en: 'services available',
    bn: 'পরিষেবা উপলব্ধ',
    hi: 'सेवाएं उपलब्ध',
  },
  noServicesFound: {
    en: 'No services found',
    bn: 'কোনো পরিষেবা পাওয়া যায়নি',
    hi: 'कोई सेवा नहीं मिली',
  },
  tryDifferentSearch: {
    en: 'Try a different search term.',
    bn: 'একটি ভিন্ন অনুসন্ধান চেষ্টা করুন.',
    hi: 'एक अलग खोज प्रयास करें.',
  },
  date: {
    en: 'Date',
    bn: 'তারিখ',
    hi: 'तारीख',
  },
  today: {
    en: 'Today',
    bn: 'আজ',
    hi: 'आज',
  },
  time: {
    en: 'Time',
    bn: 'সময়',
    hi: 'समय',
  },
  total: {
    en: 'Total',
    bn: 'মোট',
    hi: 'कुल',
  },
  choose: {
    en: 'Choose',
    bn: 'বাছুন',
    hi: 'चुनें',
  },
  select: {
    en: 'Select',
    bn: 'নির্বাচন',
    hi: 'चुनें',
  },
  loading: {
    en: 'Loading...',
    bn: 'লোড হচ্ছে...',
    hi: 'लोड हो रहा है...',
  },
  selectService: {
    en: 'Select a Service',
    bn: 'service সিলেক্ট করুন',
    hi: 'एक सेवा चुनें',
  },
  chooseTime: {
    en: 'Choose a Time',
    bn: 'একটি সময় চয়ন করুন',
    hi: 'एक समय चुनें',
  },
  confirmBooking: {
    en: 'Confirm Booking',
    bn: 'বুকিং নিশ্চিত করুন',
    hi: 'बुकिंग की पुष्टि करें',
  },
  chooseTimeSlot: {
    en: 'Choose a time',
    bn: 'একটি সময় চয়ন করুন',
    hi: 'एक समय चुनें',
  },
  noSlotsToday: {
    en: 'No slots available today',
    bn: 'আজ কোনো স্লট উপলব্ধ নেই',
    hi: 'आज कोई स्लॉट उपलब्ध नहीं है',
  },
  bookingConfirmed: {
    en: 'Booking Confirmed!',
    bn: 'বুকিং সফল হয়েছে!',
    hi: 'बुकिंग की पुष्टि हुई!',
  },
  seeYouAt: {
    en: "We'll see you at",
    bn: 'দেখা হবে',
    hi: 'हम आपसे मिलेंगे',
  },
  backToExplore: {
    en: 'Back to Explore',
    bn: 'অন্বেষণে ফিরে যান',
    hi: 'खोज में वापस जाएं',
  },
  shopNotFound: {
    en: 'Shop not found',
    bn: 'দোকান পাওয়া যায়নি',
    hi: 'दुकान नहीं मिली',
  },
  localShop: {
    en: 'Local Shop',
    bn: 'স্থানীয় দোকান',
    hi: 'स्थानीय दुकान',
  },
  signInToBook: {
    en: 'Please sign in to book.',
    bn: 'বুক করতে সাইন ইন করুন.',
    hi: 'कृपया बुक करने के लिए साइन इन करें.',
  },
  // Tagline for landing page
  tagline: {
    en: 'The premium platform to find and book the best local barber shops instantly.',
    bn: 'কাছাকাছি সেরা Barber দোকান খুঁজুন এবং মুহূর্তেই বুক করুন।',
    hi: 'बेहतरीन स्थानीय Barber दुकानें खोजें और तुरंत बुक करें।',
  },
  // Explore page
  shopsAvailable: {
    en: 'shops available',
    bn: 'দোকান উপলব্ধ',
    hi: 'दुकानें उपलब्ध',
  },
  noShopsFound: {
    en: 'No shops found',
    bn: 'কোনো দোকান পাওয়া যায়নি',
    hi: 'कोई दुकान नहीं मिली',
  },
  searchShops: {
    en: 'Search barber shops...',
    bn: 'অনুসন্ধান করুন',
    hi: 'Barber दुकानें खोजें...',
  },
  bookNow: {
    en: 'Book Now',
    bn: 'এখনই বুক করুন',
    hi: 'अभी बुक करें',
  },
  fullyBooked: {
    en: 'Fully booked today',
    bn: 'আজ সম্পূর্ণ বুকড',
    hi: 'आज पूरी तरह बुक',
  },
  checkingAvailability: {
    en: 'Checking availability...',
    bn: 'উপলব্ধতা পরীক্ষা...',
    hi: 'उपलब्धता जांच रहे हैं...',
  },
  // Bottom nav items
  shop: {
    en: 'Shop',
    bn: 'শপ',
    hi: 'दुकान',
  },
  admin: {
    en: 'Admin',
    bn: 'অ্যাডমিন',
    hi: 'एडमिन',
  },
  settings: {
    en: 'Settings',
    bn: 'সেটিংস',
    hi: 'सेटिंग्स',
  },
  myServices: {
    en: 'My Services',
    bn: 'আমার পরিষেবা',
    hi: 'मेरी सेवाएं',
  },
  history: {
    en: 'History',
    bn: 'ইতিহাস',
    hi: 'इतिहास',
  },
  // Time picker modes
  nextSchedule: {
    en: 'Next Schedule',
    bn: 'পরবর্তী সময়সূচী',
    hi: 'अगला समय',
  },
  nextAvailable: {
    en: 'Next available',
    bn: 'পরবর্তী উপলব্ধ',
    hi: 'अगला उपलब्ध',
  },
  customTime: {
    en: 'Custom Time',
    bn: 'কাস্টম সময়',
    hi: 'कस्टम समय',
  },
  unavailable: {
    en: 'Unavailable',
    bn: 'অনুপলব্ধ',
    hi: 'अनुपलब्ध',
  },
  // Upcoming booking alert
  upcomingAppointment: {
    en: 'Upcoming Appointment',
    bn: 'নতুন বুকিং',
    hi: 'आगामी अपॉइंटमेंट',
  },
  // Custom time validation
  shopHours: {
    en: 'Shop hours:',
    bn: 'দোকানের সময়:',
    hi: 'दुकान के घंटे:',
  },
  activeBookingExists: {
    en: 'You already have an active booking that hasn\'t ended yet. Please wait until it finishes.',
    bn: 'আপনার ইতিমধ্যে একটি সক্রিয় বুকিং আছে যা এখনও শেষ হয়নি। এটি শেষ না হওয়া পর্যন্ত অপেক্ষা করুন।',
    hi: 'आपके पास पहले से एक सक्रिय बुकिंग है जो अभी समाप्त नहीं हुई है। कृपया इसके समाप्त होने तक प्रतीक्षा करें।',
  },
  customTimeOutsideRange: {
    en: 'Please select a time between {open} and {close}',
    bn: '{open} থেকে {close} এর মধ্যে একটি সময় নির্বাচন করুন',
    hi: 'कृपया {open} और {close} के बीच एक समय चुनें',
  },
  // Custom time live availability
  timeAvailable: {
    en: 'This time is available',
    bn: 'এই সময়টি উপলব্ধ',
    hi: 'यह समय उपलब्ध है',
  },
  timeAlreadyBooked: {
    en: 'This time is already booked',
    bn: 'এই সময়টি ইতিমধ্যে বুক করা',
    hi: 'यह समय पहले से बुक है',
  },
  timePassed: {
    en: 'This time has already passed',
    bn: 'এই সময়টি ইতিমধ্যে পেরিয়ে গেছে',
    hi: 'यह समय पहले ही बीत चुका है',
  },
  useNextAvailable: {
    en: 'Use next available',
    bn: 'পরবর্তী উপলব্ধ সময় ব্যবহার করুন',
    hi: 'अगला उपलब्ध समय चुनें',
  },
  goToSession: {
    en: 'Go to My Session',
    bn: 'আমার সেশনে যান',
    hi: 'मेरे सत्र पर जाएं',
  },
  // Locked session screen
  sessionInProgress: {
    en: 'Session in progress',
    bn: 'সেশন চলছে',
    hi: 'सत्र जारी है',
  },
  sessionEndsIn: {
    en: 'Session ends in',
    bn: 'সেশন শেষ হতে',
    hi: 'सत्र समाप्त होने में',
  },
  totalDuration: {
    en: 'Total duration',
    bn: 'মোট সময়',
    hi: 'कुल अवधि',
  },
  bookedServices: {
    en: 'Booked services',
    bn: 'বুক করা পরিষেবা',
    hi: 'बुक की गई सेवाएं',
  },
  lockedNote: {
    en: "You're locked in until your session ends",
    bn: 'আপনার সেশন শেষ না হওয়া পর্যন্ত আপনি লকড',
    hi: 'आपका सत्र समाप्त होने तक आप लॉक हैं',
  },
  sessionComplete: {
    en: 'Session complete!',
    bn: 'সেশন সম্পন্ন!',
    hi: 'सत्र पूर्ण!',
  },
  sessionCompleteMsg: {
    en: 'Thanks for visiting. Enjoy your new look!',
    bn: 'ভিজিটের জন্য ধন্যবাদ। আপনার নতুন লুক উপভোগ করুন!',
    hi: 'आने के लिए धन्यवाद। अपने नए लुक का आनंद लें!',
  },
  bookingCancelled: {
    en: 'Booking cancelled',
    bn: 'বুকিং বাতিল হয়েছে',
    hi: 'बुकिंग रद्द',
  },
  bookingCancelledMsg: {
    en: 'The shop cancelled this appointment. You can browse again.',
    bn: 'দোকানটি এই অ্যাপয়েন্টমেন্ট বাতিল করেছে। আপনি আবার ব্রাউজ করতে পারেন।',
    hi: 'दुकान ने यह अपॉइंटमेंट रद्द कर दिया। आप फिर से ब्राउज़ कर सकते हैं।',
  },
  continueExploring: {
    en: 'Continue Exploring',
    bn: 'অন্বেষণ চালিয়ে যান',
    hi: 'खोज जारी रखें',
  },
};

// Returns the translation for the given key and language.
// Falls back to English if the key or translation is missing.
export const t = (key: string, lang: Language): string => {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
};
