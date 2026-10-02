"use client";

import { useState, useEffect, useRef } from "react";
import { useCartStore, type Address, type ShippingMethod, type PaymentMethod, type CartItem, type Coupon } from "@/store/useCartStore";
import {
  Trash2, Plus, Minus, ArrowRight, ArrowLeft, MapPin, Clock,
  CreditCard, DollarSign, Truck, Tag, Percent,
  CheckCircle, AlertCircle, User, Mail, Phone, Home, Building,
  Award
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { createAuthClientBrowser } from "@/lib/supabase/client";
import type { SquareCardFormHandle } from "@/components/payment/SquareCardForm";
import { MAX_DELIVERY_RADIUS_MILES } from "@/lib/delivery";
import { getMenuItemImage } from "@/lib/utils";

const SquareCardForm = dynamic(() => import("@/components/payment/SquareCardForm"), { ssr: false });

type CheckoutStep = 'delivery' | 'payment' | 'review';

interface CheckoutSummaryAddress {
  name: string;
  email?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CheckoutSummary {
  items: CartItem[];
  deliveryMethod: ShippingMethod | null;
  paymentMethod: PaymentMethod;
  coupon: Coupon | null;
  deliveryAddress: CheckoutSummaryAddress;
  billingAddress: CheckoutSummaryAddress;
  totals: {
    subtotal: number;
    deliveryCost: number;
    serviceFee: number;
    smallOrderFee: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  };
}

interface DeliverySettings {
  delivery_fee: number;
  service_fee: number;
  service_fee_radius_miles: number;
  per_mile_rate: number;
  free_delivery_radius_miles: number;
  small_order_threshold: number;
  small_order_fee: number;
}

  const defaultDeliveryMethods: ShippingMethod[] = [
    { id: 'pickup', name: 'Pickup', description: 'Ready in 15-20 minutes — order ahead and we\'ll have it waiting', cost: 0, estimatedDays: 0 },
    { id: 'standard', name: 'Standard Delivery', description: 'Delivery within 30-45 minutes', cost: 0, estimatedDays: 0 },
    { id: 'express', name: 'Express Delivery', description: 'Delivery within 15-20 minutes', cost: 4.99, estimatedDays: 0 },
    { id: 'scheduled', name: 'Scheduled Delivery', description: 'Choose your preferred delivery time', cost: 2.99, estimatedDays: 0 },
  ];

const paymentMethods: { id: PaymentMethod; name: string; description: string; icon: LucideIcon }[] = [
  { id: 'card', name: 'Credit/Debit Card', description: 'Visa, Mastercard, American Express — securely processed by Square', icon: CreditCard },
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
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<ShippingMethod[]>(defaultDeliveryMethods);
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [deliveryUnavailable, setDeliveryUnavailable] = useState(false);
  const [calculatedFees, setCalculatedFees] = useState({ deliveryFee: 0, serviceFee: 0, smallOrderFee: 0 });

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
    method: 'card' as PaymentMethod
  });
  const tokenizeRef = useRef<((details?: Record<string, unknown>) => Promise<string>) | null>(null);
  const cardTokenRef = useRef<string | null>(null);
  const [squareCardError, setSquareCardError] = useState("");
  const [confirmationData, setConfirmationData] = useState<CheckoutSummary | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Standard mount flag: keeps the first client render identical to the
    // server HTML so the persisted cart doesn't cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  // Fetch delivery settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/delivery-settings');
        if (res.ok) {
          const settings: DeliverySettings = await res.json();
          setDeliverySettings(settings);
          setDeliveryMethods([
            { id: 'pickup', name: 'Pickup', description: 'Ready in 15-20 minutes — order ahead and we\'ll have it waiting', cost: 0, estimatedDays: 0 },
            { id: 'standard', name: 'Standard Delivery', description: 'Delivery within 30-45 minutes', cost: settings.delivery_fee, estimatedDays: 0 },
            { id: 'express', name: 'Express Delivery', description: 'Delivery within 15-20 minutes', cost: settings.delivery_fee + 1.00, estimatedDays: 0 },
            { id: 'scheduled', name: 'Scheduled Delivery', description: 'Choose your preferred delivery time', cost: settings.delivery_fee, estimatedDays: 0 },
          ]);
        }
      } catch (e) {
        console.error('Failed to load delivery settings:', e);
      }
    };
    fetchSettings();
  }, []);

  // Initialize delivery method on mount to avoid hydration mismatch
  useEffect(() => {
    if (deliveryMethods.length > 0) setDeliveryMethod(deliveryMethods[0]);
  }, [deliveryMethods]);

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

  // Calculate distance when customer location changes
  useEffect(() => {
    if (!customerLocation || !deliverySettings) return;
    const calcDistance = async () => {
      try {
        const res = await fetch(`/api/distance?lat=${customerLocation.lat}&lng=${customerLocation.lng}`);
        if (res.ok) {
          const data = await res.json();
          const miles = data.distance_miles || 0;
          setDistanceMiles(miles);
          const unavailable = miles > MAX_DELIVERY_RADIUS_MILES;
          setDeliveryUnavailable(unavailable);

          if (unavailable) {
            const pickup = deliveryMethods.find((m) => m.id === 'pickup');
            if (pickup && deliveryMethod && deliveryMethod.id !== 'pickup') {
              setDeliveryMethod(pickup);
            }
          }

          // Calculate fees based on distance
          let deliveryFee = deliverySettings.delivery_fee;
          let serviceFee = 0;

          // Free delivery within radius
          if (miles <= deliverySettings.free_delivery_radius_miles) {
            deliveryFee = 0;
          }

          // Service fee: full fee within radius, then per-mile after
          if (miles <= deliverySettings.service_fee_radius_miles) {
            serviceFee = deliverySettings.service_fee;
          } else {
            serviceFee = deliverySettings.service_fee + (miles - deliverySettings.service_fee_radius_miles) * deliverySettings.per_mile_rate;
          }

          // Small order fee
          const currentSubtotal = getSubtotal();
          const smallOrderFee = currentSubtotal < deliverySettings.small_order_threshold ? deliverySettings.small_order_fee : 0;

          setCalculatedFees({
            deliveryFee: Math.round(deliveryFee * 100) / 100,
            serviceFee: Math.round(serviceFee * 100) / 100,
            smallOrderFee,
          });
        }
      } catch (e) {
        console.error('Failed to calculate distance:', e);
      }
    };
    calcDistance();
  }, [customerLocation, deliverySettings]);

  const subtotal = getSubtotal();
  const deliveryCost = deliveryMethod?.id === 'pickup' ? 0 : (calculatedFees.deliveryFee !== undefined ? calculatedFees.deliveryFee : getDeliveryCost());
  const serviceFee = deliveryMethod?.id === 'pickup' ? 0 : calculatedFees.serviceFee;
  const smallOrderFee = deliveryMethod?.id === 'pickup' ? 0 : calculatedFees.smallOrderFee;
  const taxAmount = subtotal * 0.08;
  const discountAmount = getDiscountAmount();
  const loyaltyDiscountAmount = userLoyalty ? Math.round(subtotal * (userLoyalty.discountPercent / 100) * 100) / 100 : 0;
  const total = Math.max(0, subtotal + deliveryCost + serviceFee + smallOrderFee + taxAmount - discountAmount - loyaltyDiscountAmount);

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
      // Card details are collected and validated by the Square Web Payments SDK
      if (deliveryMethod?.id !== 'pickup' && deliveryUnavailable) {
        errors.general = `Delivery is not available ${distanceMiles.toFixed(0)} miles away (max ${MAX_DELIVERY_RADIUS_MILES} mi). Please select Pickup.`;
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
      let paymentToken: string | undefined;
      if (paymentForm.method === 'card') {
        if (!cardTokenRef.current) {
          setValidationErrors({ general: 'Card payment could not be initialized. Please go back to the payment step and try again.' });
          setCurrentStep('payment');
          setIsSubmitting(false);
          return;
        }
        paymentToken = cardTokenRef.current;
        cardTokenRef.current = null;
      }
      const orderData = {
        user_id: currentUser?.id || null,
        total_amount: Math.round(total * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: Math.round(discountAmount * 100) / 100,
        loyalty_discount_amount: loyaltyDiscountAmount,
        delivery_address: `${deliveryForm.name} - ${deliveryForm.phone} - ${deliveryForm.email} - ${deliveryForm.street}, ${deliveryForm.city}, ${deliveryForm.state} ${deliveryForm.zipCode}, ${deliveryForm.country}${deliveryForm.instructions ? ` - Instructions: ${deliveryForm.instructions}` : ''}`,
        status: "pending",
        payment_method: paymentForm.method,
        payment_token: paymentToken,
        coupon_code: coupon?.code,
        customer_location: customerLocation,
        shipping_method: deliveryMethod?.id,
        delivery_fee: deliveryCost,
        service_fee: serviceFee,
        small_order_fee: smallOrderFee,
        distance_miles: distanceMiles,
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
      setConfirmationData({
        items: items.map((item) => ({ ...item })),
        deliveryMethod: deliveryMethod || deliveryMethods[0],
        paymentMethod: paymentForm.method,
        coupon: coupon ?? null,
        deliveryAddress: deliveryForm,
        billingAddress: billingForm.sameAsDelivery ? deliveryForm : billingForm,
        totals: { subtotal, deliveryCost, serviceFee, smallOrderFee, taxAmount, discountAmount, total },
      });
      setOrderPlaced(true);
      clearCart();
      if (currentUser?.id) {
        try { await fetch('/api/loyalty/award', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: data.orderId }) }); } catch { /* non-blocking */ }
      }
    } catch (error: unknown) {
      console.error('Error placing order:', error);
      const message = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      setValidationErrors({ general: message });
      if (paymentForm.method === 'card') setCurrentStep('payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildVerificationDetails = (): Record<string, unknown> => {
    const nameParts = deliveryForm.name.trim().split(/\s+/);
    return {
      amount: total.toFixed(2),
      currencyCode: "USD",
      intent: "CHARGE",
      customerInitiated: true,
      sellerKeyedIn: false,
      billingContact: {
        givenName: nameParts.slice(0, -1).join(" ") || nameParts[0] || "",
        familyName: nameParts[nameParts.length - 1] || "",
        email: deliveryForm.email,
        phone: deliveryForm.phone,
        addressLines: [deliveryForm.street],
        city: deliveryForm.city,
        state: deliveryForm.state,
        postalCode: deliveryForm.zipCode,
        countryCode: (deliveryForm.country || "US").slice(0, 2).toUpperCase(),
      },
    };
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 'delivery') { setCurrentStep('payment'); return; }
    if (currentStep === 'payment') {
      if (paymentForm.method === 'card') {
        if (!tokenizeRef.current) {
          setValidationErrors({ general: squareCardError || 'Card payment is still loading. Please wait a moment and try again.' });
          return;
        }
        setIsSubmitting(true);
        setValidationErrors({});
        try {
          cardTokenRef.current = await tokenizeRef.current(buildVerificationDetails());
        } catch (tokenError: unknown) {
          const message = tokenError instanceof Error ? tokenError.message : 'Unable to process your card. Please check the card details and try again.';
          setValidationErrors({ general: message });
          return;
        } finally {
          setIsSubmitting(false);
        }
      }
      setCurrentStep('review');
    }
  };
  const prevStep = () => { if (currentStep === 'payment') setCurrentStep('delivery'); else if (currentStep === 'review') setCurrentStep('payment'); };

  if (orderPlaced && confirmationData) {
    return (
      <ConfirmationPage
        orderId={orderId}
        orderDetails={confirmationData}
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
                          {deliveryUnavailable && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4" />Delivery not available at this distance ({distanceMiles.toFixed(1)} mi)</p>
                              <p className="text-xs text-red-600 mt-1">Maximum delivery radius is {MAX_DELIVERY_RADIUS_MILES} mi. Please select Pickup at checkout.</p>
                            </div>
                          )}
                        </div>
                      )}
                      {!customerLocation && (
                        <div>
                          <p className="text-xs text-gray-600 mt-2">We&apos;ll use your GPS location for accurate delivery tracking</p>
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
                    {deliveryUnavailable && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-700 font-medium flex items-center gap-1"><AlertCircle className="w-4 h-4" />Delivery is unavailable at this distance ({distanceMiles.toFixed(1)} mi away)</p>
                        <p className="text-xs text-red-600 mt-1">Maximum delivery radius is {MAX_DELIVERY_RADIUS_MILES} mi. Only Pickup is available for your location.</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      {deliveryMethods.map((method) => {
                        const disabled = deliveryUnavailable && method.id !== 'pickup';
                        return (
                        <button key={method.id} disabled={disabled} onClick={() => setDeliveryMethod(method)} className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod?.id === method.id ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-red-300'} ${disabled ? 'opacity-50 cursor-not-allowed hover:border-gray-200' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div><h3 className="font-semibold text-gray-900">{method.name}</h3><p className="text-sm text-gray-600">{method.description}</p></div>
                            <div className="text-right"><span className="font-bold text-gray-900">{method.cost === 0 ? 'Free' : `$${method.cost.toFixed(2)}`}</span><p className="text-sm text-gray-600">{method.estimatedDays === 0 ? 'Today' : `${method.estimatedDays} days`}</p></div>
                          </div>
                        </button>
                        );
                      })}
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
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-sm text-blue-800">🔒 Card details are entered into Square&apos;s secure, PCI-compliant payment form. Your card number never touches our servers.</p>
                        </div>
                        <SquareCardForm
                          onReady={(handle: SquareCardFormHandle) => {
                            tokenizeRef.current = () => handle.tokenize();
                            setSquareCardError("");
                          }}
                          onError={(message: string) => setSquareCardError(message)}
                        />
                      </div>
                    )}
                    {paymentForm.method === 'cash' && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl"><p className="text-sm text-yellow-800">💰 You&apos;ll pay in cash when your order is delivered. Please have exact change ready.</p></div>
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
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><CreditCard className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{paymentMethods.find(m => m.id === paymentForm.method)?.name}</p><p className="text-sm text-gray-600">{paymentForm.method === 'card' ? 'Paid securely with card' : 'Pay on delivery'}</p></div></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 p-6 rounded-2xl bg-white border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>
              {!mounted && (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-8 bg-gray-100 rounded animate-pulse" />
                </div>
              )}
              {mounted && (
              <div>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={getMenuItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
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
                {deliveryMethod?.id !== 'pickup' && (
                  <>
                    <div className="flex justify-between text-gray-600"><span>Delivery Fee{distanceMiles > 0 ? ` (${distanceMiles.toFixed(1)} mi)` : ''}</span><span className="font-semibold">{deliveryCost === 0 ? "Free" : `$${deliveryCost.toFixed(2)}`}</span></div>
                    {serviceFee > 0 && <div className="flex justify-between text-gray-600"><span>Service Fee</span><span className="font-semibold">${serviceFee.toFixed(2)}</span></div>}
                    {smallOrderFee > 0 && <div className="flex justify-between text-orange-600"><span>Small Order Fee</span><span className="font-semibold">${smallOrderFee.toFixed(2)}</span></div>}
                  </>
                )}
                <div className="flex justify-between text-gray-600"><span>Tax</span><span className="font-semibold">${taxAmount.toFixed(2)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><Percent className="w-4 h-4" />Discount ({coupon?.code})</span><span className="font-semibold">-${discountAmount.toFixed(2)}</span></div>}
                {userLoyalty && userLoyalty.discountPercent > 0 && <div className="flex justify-between text-green-600"><span className="flex items-center gap-1"><Award className="w-4 h-4" />{userLoyalty.tier} Member ({userLoyalty.discountPercent}% off)</span><span className="font-semibold">-${loyaltyDiscountAmount.toFixed(2)}</span></div>}
                <div className="h-[1px] bg-gray-200 my-3" />
                <div className="flex justify-between text-2xl font-bold text-gray-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
              <div className="flex gap-3 mt-6">
                {currentStep !== 'delivery' && <button onClick={prevStep} className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>}
                {currentStep !== 'review' ? (
                  <button onClick={nextStep} disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{isSubmitting ? "Processing..." : "Continue"}</button>
                ) : (
                  <button onClick={handlePlaceOrder} disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">{isSubmitting ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}</button>
                )}
              </div>
              {validationErrors.general && <p className="text-red-600 text-sm mt-3 text-center">{validationErrors.general}</p>}
              </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ConfirmationPage({ orderId, orderDetails }: { orderId: string; orderDetails: CheckoutSummary }) {
  const paymentMethodName = ( { card: 'Credit/Debit Card', cash: 'Cash on Delivery' } as Record<string, string> )[orderDetails.paymentMethod] || orderDetails.paymentMethod;
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
                {orderDetails.items.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={getMenuItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-semibold">${orderDetails.totals.subtotal.toFixed(2)}</span></div>
                {orderDetails.deliveryMethod?.id !== 'pickup' && (
                  <>
                    <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span className="font-semibold">{orderDetails.totals.deliveryCost === 0 ? "Free" : `$${orderDetails.totals.deliveryCost.toFixed(2)}`}</span></div>
                    {orderDetails.totals.serviceFee > 0 && <div className="flex justify-between text-gray-600"><span>Service Fee</span><span className="font-semibold">${orderDetails.totals.serviceFee.toFixed(2)}</span></div>}
                    {orderDetails.totals.smallOrderFee > 0 && <div className="flex justify-between text-orange-600"><span>Small Order Fee</span><span className="font-semibold">${orderDetails.totals.smallOrderFee.toFixed(2)}</span></div>}
                  </>
                )}
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
              <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-gray-600" /><div><p className="font-medium text-gray-900">{paymentMethodName}</p><p className="text-sm text-gray-600">{orderDetails.paymentMethod === 'cash' ? 'Please pay when your order arrives' : 'Payment completed successfully'}</p></div></div>
              {orderDetails.coupon && <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200"><Tag className="w-5 h-5 text-green-600" /><div><p className="font-medium text-green-800">Coupon Applied</p><p className="text-sm text-green-600">{orderDetails.coupon.description}</p></div></div>}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">What&apos;s Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-red-600">1</span></div><div><p className="font-medium text-gray-900">Order Confirmation</p><p className="text-sm text-gray-600">You&apos;ll receive an email confirmation shortly</p></div></div>
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
