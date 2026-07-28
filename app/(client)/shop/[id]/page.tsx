"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getShopDetails, createBooking, getAvailableSlots } from "@/app/actions/client";
import { Scissors, MapPin, Clock, Loader2, Calendar, User as UserIcon, ChevronLeft, Phone } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

export default function ShopDetailsPage() {
  const params = useParams();
  const shopId = params.id as string;
  const [session, setSession] = useState<User | null>(null);
  
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [time, setTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      const data = await getShopDetails(shopId);
      setShop(data);
      setIsLoading(false);
    };
    fetchShop();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setSession(currentUser);
    });
    return () => unsubscribe();
  }, [shopId]);

  useEffect(() => {
    if (selectedServices.length === 0) {
        setAvailableSlots([]);
        return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      const today = new Date().toISOString().split('T')[0];
      const totalDuration = selectedServices.reduce((acc, curr) => acc + (parseInt(curr.duration, 10) || 30), 0);
      const slots = await getAvailableSlots(shopId, today, totalDuration);
      setAvailableSlots(slots);
      setIsLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedServices, shopId]);

  const toggleService = (service: any) => {
    setSelectedServices(prev => {
        const exists = prev.find(s => s.id === service.id);
        if (exists) return prev.filter(s => s.id !== service.id);
        return [...prev, service];
    });
  };

  const handleBook = async () => {
    if (!session) {
      setError("Please sign in to book an appointment.");
      return;
    }
    if (selectedServices.length === 0 || !time) {
      setError("Please select at least one service and a time.");
      return;
    }
    
    setIsBooking(true);
    setError("");
    
    const result = await createBooking({
      shopId,
      serviceIds: selectedServices.map(s => s.id),
      time
    });
    
    if (result.success) {
      setSuccess(true);
      setSelectedServices([]);
      setTime("");
    } else {
      setError(result.error || "An unknown error occurred");
    }
    
    setIsBooking(false);
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!shop) {
    return <div className="min-h-[50vh] flex items-center justify-center"><h2 className="text-2xl font-bold text-gray-900">Shop not found</h2></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12 relative">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Map
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Hero Section */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-indigo-900 z-0">
            {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover opacity-60" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 to-indigo-600 opacity-90"></div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent z-10"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
            <div className="max-w-4xl mx-auto flex items-end gap-5">
              {shop.logoUrl && (
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shrink-0 shadow-lg hidden sm:block">
                  <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover rounded-xl" />
                </div>
              )}
              <h1 className="text-4xl font-bold text-white mb-2">{shop.shopName}</h1>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-wrap gap-6 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-2"><MapPin size={18} /> {shop.address || "No address provided"}</div>
            {shop.phone && (
                <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                    <Phone size={18} /> {shop.phone}
                </a>
            )}
            <div className="flex items-center gap-2"><Clock size={18} /> {shop.openTime || "9:00 AM"} - {shop.closeTime || "6:00 PM"}</div>
            <div className="flex items-center gap-2 font-medium text-gray-900">Owner: {shop.owner?.name || 'Unknown'}</div>
          </div>
          
          {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full"><Calendar size={20} className="text-green-600"/></div>
              <div>
                <p className="font-bold">Booking Confirmed!</p>
                <p className="text-sm">We'll see you today at {time}.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
                {(!shop.services || shop.services.filter((s:any) => s.isActive !== false).length === 0) ? (
                  <p className="text-gray-500">This shop hasn't added any services yet.</p>
                ) : (
                  <div className="space-y-4">
                    {shop.services.filter((s:any) => s.isActive !== false).map((service: any) => (
                      <div 
                        key={service.id} 
                        onClick={() => toggleService(service)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedServices.some(s => s.id === service.id) ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-indigo-300'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Clock size={14}/> {service.duration} mins</p>
                          </div>
                          <div className="text-lg font-bold text-gray-900">${Number(service.price).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">About Us</h2>
                <div className="bg-gray-50 rounded-2xl p-6 text-gray-600 leading-relaxed border border-gray-100">
                  {shop.description || "Welcome to our shop! We provide premium grooming services."}
                </div>
              </div>

              {shop.images && shop.images.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {shop.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <img src={img} alt={`${shop.shopName} gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Location</h2>
                <div className="bg-gray-100 rounded-xl overflow-hidden h-[300px] border border-gray-200">
                  <iframe
                    src={(() => {
                      let q = "barber shops near me";
                      const link = shop.googleMapLink;
                      
                      if (link) {
                        if (link.includes("/embed?") || link.includes("/embed/")) {
                          const match = link.match(/src="([^"]+)"/);
                          return match ? match[1] : link;
                        }
                        
                        const coordMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (coordMatch) {
                          q = `${coordMatch[1]},${coordMatch[2]}`;
                        } else if (link.startsWith("http")) {
                          q = `${shop.shopName} ${shop.address || ""}`.trim();
                        } else {
                          q = link;
                        }
                      } else {
                        q = `${shop.shopName} ${shop.address || ""}`.trim();
                      }
                      
                      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
                    })()}
                    className="w-full h-full border-0"
                    style={{ touchAction: 'none' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Book Appointment</h2>
                
                {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                
                {session ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selected Services</label>
                      <div className="p-3 bg-white border border-gray-300 rounded-md text-sm text-gray-900 min-h-[40px]">
                        {selectedServices.length > 0 ? (
                            <div>
                                <ul className="mb-2 space-y-1">
                                    {selectedServices.map(s => <li key={s.id}>• {s.name} (${s.price})</li>)}
                                </ul>
                                <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-indigo-700">
                                    <span>Total: ${selectedServices.reduce((acc, curr) => acc + Number(curr.price), 0).toFixed(2)}</span>
                                    <span>{selectedServices.reduce((acc, curr) => acc + (parseInt(curr.duration, 10) || 30), 0)} mins</span>
                                </div>
                            </div>
                        ) : "Select one or more services"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
                        Today ({new Date().toLocaleDateString()})
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <select 
                        className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 disabled:opacity-50" 
                        value={time} 
                        onChange={e => setTime(e.target.value)}
                        disabled={selectedServices.length === 0 || isLoadingSlots}
                      >
                        <option value="">{isLoadingSlots ? "Loading slots..." : "Select a time..."}</option>
                        {availableSlots.length > 0 ? (
                            availableSlots.map((slot, idx) => (
                                <option key={idx} value={slot}>{slot}</option>
                            ))
                        ) : (
                            selectedServices.length > 0 && !isLoadingSlots && <option value="" disabled>No available slots for today</option>
                        )}
                      </select>
                    </div>
                    
                    <button 
                      onClick={handleBook}
                      disabled={isBooking || selectedServices.length === 0}
                      className="w-full mt-4 h-12 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-6 bg-white border border-gray-200 rounded-xl text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Guest Mode</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      You are viewing this shop as a guest. Please create an account or sign in to book an appointment.
                    </p>
                    <a href="/signup" className="inline-block w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 mb-3">
                      Create Account
                    </a>
                    <a href="/signin" className="inline-block w-full bg-white text-gray-700 font-medium py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                      Sign In
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
