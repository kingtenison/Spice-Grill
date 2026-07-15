"use client";

import { useState, useEffect } from "react";
import { useCartStore, type Address, type ShippingMethod, type PaymentMethod, type OrderDetails } from "@/store/useCartStore";
import {
  Trash2, Plus, Minus, ArrowRight, ArrowLeft, MapPin, Clock,
  CreditCard, Smartphone, DollarSign, Truck, Tag, Percent,
  CheckCircle, AlertCircle, User, Mail, Phone, Home, Building,
  Award
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createAuthClientBrowser } from "@/lib/supabase/client";

type CheckoutStep = 'delivery' | 'payment' | 'review';

const deliveryMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery within 30-45 minutes',
    cost: 0,
    estimatedDays: 0
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Delivery within 15-20 minutes',
    cost: 4.99,
    estimatedDays: 0
  },
  {
    id: 'scheduled',
    name: 'Scheduled Delivery',
    description: 'Choose your preferred delivery time',
    cost: 2.99,
    estimatedDays: 0
  }
];

const paymentMethods: { id: PaymentMethod; name: string; description: string; icon: any }[] = [
  { id: 'card', name: 'Credit/Debit Card', description: 'Visa, Mastercard, American Express', icon: CreditCard },
  { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal account', icon: DollarSign },
  { id: 'apple_pay', name: 'Apple Pay', description: 'Quick and secure with Touch ID', icon: Smartphone },
  { id: 'google_pay', name: 'Google Pay', description: 'Fast checkout with Google Pay', icon: Smartphone },
  { id: 'cash', name: 'Cash on Delivery', description: 'Pay when your order arrives', icon: DollarSign }
];

export default function CheckoutPage() {
  const {
    items,
    deliveryMethod,
    coupon,
    orderDetails,
    setDeliveryMethod,
    setOrderDetails,
    setCoupon,
    validateCoupon,
    getSubtotal,
    getDeliveryCost,
    getTaxAmount,
    getDiscountAmount,
    getTotal,
    clearCart
  } = useCartStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [currentUser, setCurrentUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const [userLoyalty, setUserLoyalty] = useState<{ tier: string; points: number; discountPercent: number } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [deliveryForm, setDeliveryForm] = useState({
    name: '', email: '', phone: '',
    street: '', city: '', state: '', zipCode: '', country: 'USA', instructions: ''
  });

  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [billingForm, setBillingForm] = useState({
    sameAsDelivery: true,
    name: '', street: '', city: '', state: '', zipCode: '', country: 'USA'
  });

  const [paymentForm, setPaymentForm] = useState({
    method: 'card' as PaymentMethod,
    cardNumber: '', expiryDate: '', cvv: '', cardholderName: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createAuthClientBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser(user);
        setIsGuestCheckout(false);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profile) {
          setDeliveryForm(prev => ({ ...prev, name: profile.name || '', email: user.email || '', phone: profile.phone || '' }));
        }
        const { data: loyalty } = await supabase.from('loyalty_points').select('points, tier').eq('user_id', user.id).maybeSingle();
        if (loyalty) {
          const tier = loyalty.tier || 'Bronze';
          const discountPercent = tier === 'Gold' ? 10 : tier === 'Silver' ? 5 : 0;
          setUserLoyalty({ tier, points: loyalty.points || 0, discountPercent });
        }
      } else {
        setCurrentUser(null);
        setIsGuestCheckout(true);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (billingForm.sameAsDelivery) {
      setBillingForm(prev => ({ ...prev, name: deliveryForm.name, street: deliveryForm.street, city: deliveryForm.city, state: deliveryForm.state, zipCode: deliveryForm.zipCode, country: deliveryForm.country }));
    }
  }, [deliveryForm, billingForm.sameAsDelivery]);

  // Initialize delivery method on mount to avoid hydration mismatch
  useEffect(() => {
    setDeliveryMethod(deliveryMethods[0]);
  }, []);

  // Get customer location
  const getLocation = async () => {
    setLocationLoading(true);
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Get address from coordinates using reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        
        const address = data.display_name || `${deliveryForm.street}, ${deliveryForm.city}, ${deliveryForm.state} ${deliveryForm.zipCode}`;
        
        setCustomerLocation({
          lat: latitude,
          lng: longitude,
          address
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const subtotal = getSubtotal();
  const deliveryCost = getDeliveryCost();
  const taxAmount = subtotal * 0.08;
  const discountAmount = getDiscountAmount();
  const loyaltyDiscountAmount = userLoyalty ? Math.round(subtotal * (userLoyalty.discountPercent / 100) * 100) / 100 : 0;
  const total = Math.max(0, subtotal + deliveryCost + taxAmount - discountAmount - loyaltyDiscountAmount);

  const validateStep = (step: CheckoutStep): boolean => {
    const errors: Record<string, string> = {};
    if (step === 'delivery') {
      if (!deliveryForm.name.trim()) errors.name = 'Name is required';
      if (!deliveryForm.email.trim()) errors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(deliveryForm.email)) errors.email = 'Invalid email format';
      if (!deliveryForm.phone.trim()) errors.phone = 'Phone number is required';
      if (!deliveryForm.street.trim()) errors.street = 'Street address is required';
      if (!deliveryForm.city.trim()) errors.city = 'City is required';
      if (!deliveryForm.state.trim()) errors.state = 'State is required';
      if (!deliveryForm.zipCode.trim()) errors.zipCode = 'ZIP code is required';
      if (!billingForm.sameAsDelivery) {
        if (!billingForm.name.trim()) errors.billingName = 'Billing name is required';
        if (!billingForm.street.trim()) errors.billingStreet = 'Billing street is required';
        if (!billingForm.city.trim()) errors.billingCity = 'Billing city is required';
        if (!billingForm.state.trim()) errors.billingState = 'Billing state is required';
        if (!billingForm.zipCode.trim()) errors.billingZipCode = 'Billing ZIP code is required';
      }
      // Require location for delivery orders
      if (deliveryMethod?.id !== 'pickup' && !customerLocation) {
        errors.location = 'Location is required for delivery orders';
      }
    }
    if (step === 'payment') {
      if (paymentForm.method === 'card') {
        if (!paymentForm.cardNumber.trim()) errors.cardNumber = 'Card number is required';
        else if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentForm.cardNumber.replace(/\s/g, ''))) errors.cardNumber = 'Invalid card number format';
        if (!paymentForm.expiryDate.trim()) errors.expiryDate = 'Expiry date is required';
        else if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate)) errors.expiryDate = 'Invalid expiry format (MM/YY)';
        if (!paymentForm.cvv.trim()) errors.cvv = 'CVV is required';
        else if (!/^\d{3,4}$/.test(paymentForm.cvv)) errors.cvv = 'Invalid CVV';
        if (!paymentForm.cardholderName.trim()) errors.cardholderName = 'Cardholder name is required';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    const isValid = await validateCoupon(couponCode.trim());
    if (!isValid) setCouponError("Invalid coupon code or minimum order not met");
    else setCouponCode("");
    setIsApplyingCoupon(false);
  };

  const handlePlaceOrder = async () => {
    if (!validateStep('payment')) { setCurrentStep('payment'); return; }
    if (!deliveryMethod) setDeliveryMethod(deliveryMethods[0]);
    setIsSubmitting(true);
    setValidationErrors({});
    try {
      const orderData = {
        user_id: currentUser?.id || null,
        total_amount: total,
        delivery_address: `${deliveryForm.name} - ${deliveryForm.phone} - ${deliveryForm.email} - ${deliveryForm.street}, ${deliveryForm.city}, ${deliveryForm.state} ${deliveryForm.zipCode}, ${deliveryForm.country}${deliveryForm.instructions ? ` - Instructions: ${deliveryForm.instructions}` : ''}`,
        status: "pending",
        payment_status: "paid",
        customer_location: customerLocation,
        shipping_method: deliveryMethod?.id
      };
      const orderItems = items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData, orderItems }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }
      setOrderId(data.orderId);
      setOrderPlaced(true);
      clearCart();
      if (currentUser?.id) {
        try { await fetch('/api/loyalty/award', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: data.orderId }) }); } catch { /* non-blocking */ }
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      setValidationErrors({ general: error.message || 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => { if (validateStep(currentStep)) { if (currentStep === 'delivery') setCurrentStep('payment'); else if (currentStep === 'payment') setCurrentStep('review'); } };
  const prevStep = () => { if (currentStep === 'payment') setCurrentStep('delivery'); else if (currentStep === 'review') setCurrentStep('payment'); };

  if (orderPlaced) {
    return (
      <ConfirmationPage
        orderId={orderId}
        orderDetails={{ items, deliveryMethod: deliveryMethod || deliveryMethods[0], paymentMethod: paymentForm.method, coupon, deliveryAddress: deliveryForm, billingAddress: billingForm.sameAsDelivery ? deliveryForm : billingForm, totals: { subtotal, deliveryCost, taxAmount, discountAmount, total } }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={currentUser ? "/cart" : "/menu"} className="p-2 rounded-lg bg-white border border-gray-200 hover:border-red-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="flex items-center justify-center mb-8">
          {(['delivery', 'payment', 'review'] as CheckoutStep[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-colors ${currentStep === step ? 'bg-red-600 border-red-600 text-white' : index < (['delivery', 'payment', 'review'] as CheckoutStep[]).indexOf(currentStep) ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-200 border-gray-200 text-gray-600'}`}>
                {index < (['delivery', 'payment', 'review'] as CheckoutStep[]).indexOf(currentStep) ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 font-medium capitalize ${currentStep === step ? 'text-red-600' : 'text-gray-600'}`}>{step}</span>
              {index < 2 && <div className="w-12 h-[2px] bg-gray-200 mx-4" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 'delivery' && (
                <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Checkout as Guest</h3>
                        <p className="text-sm text-gray-600">No account required - quick and easy</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isGuestCheckout} onChange={(e) => setIsGuestCheckout(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5" />Delivery Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input type="text" value={deliveryForm.name} onChange={(e) => setDeliveryForm({...deliveryForm, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="John Doe" />
                        {validationErrors.name && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                        <input type="email" value={deliveryForm.email} onChange={(e) => setDeliveryForm({...deliveryForm, email: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="john@example.com" />
                        {validationErrors.email && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                        <input type="tel" value={deliveryForm.phone} onChange={(e) => setDeliveryForm({...deliveryForm, phone: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="(555) 123-4567" />
                        {validationErrors.phone && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.phone}</p>}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                      <input type="text" value={deliveryForm.street} onChange={(e) => setDeliveryForm({...deliveryForm, street: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.street ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="123 Main Street" />
                      {validationErrors.street && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.street}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input type="text" value={deliveryForm.city} onChange={(e) => setDeliveryForm({...deliveryForm, city: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="New York" />
                        {validationErrors.city && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                        <input type="text" value={deliveryForm.state} onChange={(e) => setDeliveryForm({...deliveryForm, state: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.state ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="NY" />
                        {validationErrors.state && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.state}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                        <input type="text" value={deliveryForm.zipCode} onChange={(e) => setDeliveryForm({...deliveryForm, zipCode: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.zipCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-red-600 focus:ring-red-600/20'}`} placeholder="10001" />
                        {validationErrors.zipCode && <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.zipCode}</p>}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
                      <textarea value={deliveryForm.instructions} onChange={(e) => setDeliveryForm({...deliveryForm, instructions: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900 resize-none" placeholder="Apartment number, delivery preferences, etc." />
                    </div>

                    {/* Location Capture */}
                    <div className={`mt-4 p-4 rounded-xl border ${validationErrors.location ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-5 h-5 ${validationErrors.location ? 'text-red-600' : 'text-blue-600'}`} />
                          <span className="font-medium text-gray-900">Delivery Location</span>
                        </div>
                        <button
                          onClick={getLocation}
                          disabled={locationLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
                        >
                          {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                        </button>
                      </div>
                      {customerLocation && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Location captured</p>
                              <p className="text-xs text-gray-600 mt-1">{customerLocation.address}</p>
                              <p className="text-xs text-gray-400 mt-1">Lat: {customerLocation.lat.toFixed(6)}, Lng: {customerLocation.lng.toFixed(6)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {!customerLocation && (
                        <div>
                          <p className="text-xs text-gray-600 mt-2">We'll use your GPS location for accurate delivery tracking</p>
                          {validationErrors.location && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{validationErrors.location}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <input type="checkbox" id="sameAsDelivery" checked={billingForm.sameAsDelivery} onChange={(e) => setBillingForm({...billingForm, sameAsDelivery: e.target.checked})} className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600" />
                      <label htmlFor="sameAsDelivery" className="text-sm font-medium text-gray-700">Billing address is the same as delivery</label>
                    </div>
                    {!billingForm.sameAsDelivery && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Billing Information</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                          <input type="text" value={billingForm.name} onChange={(e) => setBillingForm({...billingForm, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.billingName ? 'border-red-500' : 'border-gray-300'}`} placeholder="John Doe" />
                          {validationErrors.billingName && <p className="text-red-600 text-sm mt-1">{validationErrors.billingName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                          <input type="text" value={billingForm.street} onChange={(e) => setBillingForm({...billingForm, street: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.billingStreet ? 'border-red-500' : 'border-gray-300'}`} placeholder="123 Main Street" />
                          {validationErrors.billingStreet && <p className="text-red-600 text-sm mt-1">{validationErrors.billingStreet}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                            <input type="text" value={billingForm.city} onChange={(e) => setBillingForm({...billingForm, city: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.billingCity ? 'border-red-500' : 'border-gray-300'}`} placeholder="New York" />
                            {validationErrors.billingCity && <p className="text-red-600 text-sm mt-1">{validationErrors.billingCity}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input type="text" value={billingForm.state} onChange={(e) => setBillingForm({...billingForm, state: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.billingState ? 'border-red-500' : 'border-gray-300'}`} placeholder="NY" />
                            {validationErrors.billingState && <p className="text-red-600 text-sm mt-1">{validationErrors.billingState}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                            <input type="text" value={billingForm.zipCode} onChange={(e) => setBillingForm({...billingForm, zipCode: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.billingZipCode ? 'border-red-500' : 'border-gray-300'}`} placeholder="10001" />
                            {validationErrors.billingZipCode && <p className="text-red-600 text-sm mt-1">{validationErrors.billingZipCode}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 'payment' && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2"><Truck className="w-5 h-5" />Delivery Method</h2>
                    <div className="grid grid-cols-1 gap-4">
                      {deliveryMethods.map((method) => (
                        <button key={method.id} onClick={() => setDeliveryMethod(method)} className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod?.id === method.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}>
                          <div className="flex items-center justify-between">
                            <div><h3 className="font-semibold text-gray-900">{method.name}</h3><p className="text-sm text-gray-600">{method.description}</p></div>
                            <div className="text-right"><span className="font-bold text-gray-900">{method.cost === 0 ? 'Free' : `$${method.cost.toFixed(2)}`}</span><p className="text-sm text-gray-600">{method.estimatedDays === 0 ? 'Today' : `${method.estimatedDays} days`}</p></div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5" />Payment Method</h2>
                    <div className="grid grid-cols-1 gap-4 mb-6">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button key={method.id} onClick={() => setPaymentForm({...paymentForm, method: method.id})} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentForm.method === method.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}>
                            <div className="flex items-center gap-3"><Icon className="w-6 h-6 text-gray-600" /><div><h3 className="font-semibold text-gray-900">{method.name}</h3><p className="text-sm text-gray-600">{method.description}</p></div></div>
                          </button>
                        );
                      })}
                    </div>
                    {paymentForm.method === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number *</label>
                          <input type="text" value={paymentForm.cardNumber} onChange={(e) => { const v = e.target.value.replace(/\s/g, ''); const f = v.replace(/(\d{4})(?=\d)/g, '$1 '); setPaymentForm({...paymentForm, cardNumber: f.slice(0, 19)}); }} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.cardNumber ? 'border-red-500' : 'border-gray-300'}`} placeholder="1234 5678 9012 3456" />
                          {validationErrors.cardNumber && <p className="text-red-600 text-sm mt-1">{validationErrors.cardNumber}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                            <input type="text" value={paymentForm.expiryDate} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); const f = v.replace(/(\d{2})(?=\d)/, '$1/'); setPaymentForm({...paymentForm, expiryDate: f.slice(0, 5)}); }} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.expiryDate ? 'border-red-500' : 'border-gray-300'}`} placeholder="MM/YY" />
                            {validationErrors.expiryDate && <p className="text-red-600 text-sm mt-1">{validationErrors.expiryDate}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
                            <input type="text" value={paymentForm.cvv} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setPaymentForm({...paymentForm, cvv: v.slice(0, 4)}); }} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.cvv ? 'border-red-500' : 'border-gray-300'}`} placeholder="123" />
                            {validationErrors.cvv && <p className="text-red-600 text-sm mt-1">{validationErrors.cvv}</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name *</label>
                          <input type="text" value={paymentForm.cardholderName} onChange={(e) => setPaymentForm({...paymentForm, cardholderName: e.target.value})} className={`w-full px-4 py-3 rounded-xl border focus:ring-2 transition-colors text-gray-900 ${validationErrors.cardholderName ? 'border-red-500' : 'border-gray-300'}`} placeholder="John Doe" />
                          {validationErrors.cardholderName && <p className="text-red-600 text-sm mt-1">{validationErrors.cardholderName}</p>}
                        </div>
                      </div>
                    )}
                    {paymentForm.method === 'cash' && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"><p className="text-sm text-yellow-800">💰 You'll pay in cash when your order is delivered. Please have exact change ready.</p></div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 text-gray-900">Review Your Order</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><User className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{deliveryForm.name}</p><p className="text-sm text-gray-600">{deliveryForm.email} • {deliveryForm.phone}</p></div></div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><MapPin className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">Delivery Address</p><p className="text-sm text-gray-600">{deliveryForm.street}, {deliveryForm.city}, {deliveryForm.state} {deliveryForm.zipCode}</p></div></div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><Truck className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{deliveryMethod?.name}</p><p className="text-sm text-gray-600">{deliveryMethod?.description}</p></div></div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><CreditCard className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{paymentMethods.find(m => m.id === paymentForm.method)?.name}</p><p className="text-sm text-gray-600">{paymentForm.method === 'card' ? `**** **** **** ${paymentForm.cardNumber.slice(-4)}` : 'Pay on delivery'}</p></div></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 p-6 rounded-2xl bg-white border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1"><p className="font-medium text-gray-900">{item.name}</p><p className="text-sm text-gray-600">Qty: {item.quantity}</p></div>
                    <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {currentStep !== 'review' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code" className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-colors text-gray-900" disabled={!!coupon || isApplyingCoupon} />
                    {!coupon ? (
                      <button onClick={handleApplyCoupon} disabled={!couponCode.trim() || isApplyingCoupon} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">{isApplyingCoupon ? "..." : "Apply"}</button>
                    ) : (
                      <button onClick={() => setCoupon(undefined)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">Remove</button>
                    )}
                  </div>
                  {couponError && <p className="text-red-600 text-sm mt-1">{couponError}</p>}
                  {coupon && <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-lg border border-green-200"><Tag className="w-4 h-4 text-green-600" /><span className="text-sm text-green-800 font-medium">{coupon.description}</span></div>}
                </div>
              )}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="font-semibold">{deliveryCost === 0 ? "Free" : `$${deliveryCost.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-semibold">${taxAmount.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><Percent className="w-4 h-4" />Discount ({coupon?.code})</span><span className="font-semibold">-${discountAmount.toFixed(2)}</span></div>}
                {userLoyalty && userLoyalty.discountPercent > 0 && <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><Award className="w-4 h-4" />{userLoyalty.tier} Member ({userLoyalty.discountPercent}% off)</span><span className="font-semibold">-${loyaltyDiscountAmount.toFixed(2)}</span></div>}
                <div className="h-[1px] bg-gray-200 my-3" />
                <div className="flex justify-between text-2xl font-bold text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
              <div className="flex gap-3 mt-6">
                {currentStep !== 'delivery' && <button onClick={prevStep} className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>}
                {currentStep !== 'review' ? (
                  <button onClick={nextStep} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">Continue</button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{isSubmitting ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}</button>
                )}
              </div>
              {validationErrors.general && <p className="text-red-600 text-sm mt-3 text-center">{validationErrors.general}</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConfirmationPage({ orderId, orderDetails }: { orderId: string; orderDetails: any }) {
  const paymentMethodName = ( { card: 'Credit/Debit Card', paypal: 'PayPal', apple_pay: 'Apple Pay', google_pay: 'Google Pay', cash: 'Cash on Delivery' } as Record<string, string> )[orderDetails.paymentMethod] || orderDetails.paymentMethod;
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container px-4 pt-24 pb-12 mx-auto max-w-4xl">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8"><CheckCircle className="w-12 h-12 text-green-600" /></div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for your order</p>
          <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Order #{orderId.slice(0, 8).toUpperCase()}</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Order Details</h2>
              <div className="space-y-4">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center"><div className="flex-1"><p className="font-medium text-gray-900">{item.name}</p><p className="text-sm text-gray-600">Qty: {item.quantity}</p></div><span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">${orderDetails.totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="font-semibold">${orderDetails.totals.deliveryCost.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-semibold">${orderDetails.totals.taxAmount.toFixed(2)}</span></div>
                {orderDetails.totals.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({orderDetails.coupon?.code})</span><span className="font-semibold">-${orderDetails.totals.discountAmount.toFixed(2)}</span></div>}
                <div className="h-[1px] bg-gray-200 my-2" />
                <div className="flex justify-between text-xl font-bold text-gray-900"><span>Total</span><span>${orderDetails.totals.total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Delivery Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{orderDetails.deliveryAddress.name}</p><p className="text-sm text-gray-600">{orderDetails.deliveryAddress.email}</p><p className="text-sm text-gray-600">{orderDetails.deliveryAddress.phone}</p></div></div>
                <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">Delivery Address</p><p className="text-sm text-gray-600">{orderDetails.deliveryAddress.street}<br />{orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} {orderDetails.deliveryAddress.zipCode}</p></div></div>
                <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{orderDetails.deliveryMethod?.name || 'Standard Delivery'}</p><p className="text-sm text-gray-600">{orderDetails.deliveryMethod?.description || 'Delivery within 30-45 minutes'}</p></div></div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Payment Information</h2>
              <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{paymentMethodName}</p><p className="text-sm text-gray-600">Payment completed successfully</p></div></div>
              {orderDetails.coupon && <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200"><Tag className="w-5 h-5 text-green-600" /><div><p className="font-medium text-green-800">Coupon Applied</p><p className="text-sm text-green-600">{orderDetails.coupon.description}</p></div></div>}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">What's Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-red-600">1</span></div><div><p className="font-medium text-gray-900">Order Confirmation</p><p className="text-sm text-gray-600">You'll receive an email confirmation shortly</p></div></div>
                <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-red-600">2</span></div><div><p className="font-medium text-gray-900">Preparation</p><p className="text-sm text-gray-600">Our chefs are preparing your order with care</p></div></div>
                <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-red-600">3</span></div><div><p className="font-medium text-gray-900">Delivery</p><p className="text-sm text-gray-600">{orderDetails.deliveryMethod?.description || 'Delivery within 30-45 minutes'}</p></div></div>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/orders" className="flex-1 py-4 px-6 rounded-xl bg-red-600 text-white font-bold text-center hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">Track Order</Link>
              <Link href="/menu" className="flex-1 py-4 px-6 rounded-xl bg-gray-100 text-gray-900 font-semibold text-center hover:bg-gray-200 transition-colors">Order Again</Link>
            </div>
            <div className="text-center"><Link href="/" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"><Home className="w-4 h-4" />Back to Home</Link></div>
          </div>
        </div>
      </main>
    </div>
  );
}
