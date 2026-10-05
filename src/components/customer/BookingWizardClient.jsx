'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils/formatters';

export default function BookingWizardClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Form state
  const [sender, setSender] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [receiver, setReceiver] = useState({
    name: '',
    phone: '+91 80 4422 1100',
    email: 'receiving@technopark.in',
    address: 'Plot 44, Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    zip: '560100',
  });

  const [parcel, setParcel] = useState({
    category: 'Industrial Electronics',
    type: 'Box',
    quantity: 1,
    weight: '25',
    length: '60',
    width: '40',
    height: '40',
  });

  const [serviceTier, setServiceTier] = useState('express');

  // Logistics Hubs state
  const [branches, setBranches] = useState([]);
  const [originBranchId, setOriginBranchId] = useState('');
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Fetch user profile and branches on mount
  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated && data.user) {
          setCurrentUser(data.user);
          setSender((prev) => ({
            ...prev,
            name: data.user.name || '',
            phone: data.user.phone || '',
            email: data.user.email || '',
          }));
        }
      })
      .catch((err) => console.error('Failed to load session user:', err));

    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.branches && data.branches.length > 0) {
          setBranches(data.branches);
          setOriginBranchId(data.branches[0]._id);
          setDestinationBranchId(data.branches[1]?._id || data.branches[0]._id);
        }
      })
      .catch((err) => {
        console.error('Failed to load branches:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBranches(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Parcel' },
    { num: 3, label: 'Routing' },
    { num: 4, label: 'Service' },
    { num: 5, label: 'Review' },
  ];

  const handleProfileToggle = (e) => {
    const checked = e.target.checked;
    setUseProfileInfo(checked);
    if (checked && currentUser) {
      setSender((prev) => ({
        ...prev,
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      }));
    } else if (!checked) {
      setSender({ name: '', phone: '', email: '', address: '', city: '', state: '', zip: '' });
    }
  };

  const calculateEstimate = () => {
    const base = serviceTier === 'priority' ? 450 : serviceTier === 'express' ? 320 : 180;
    const weightFee = Number(parcel.weight || 10) * 1.5;
    return formatCurrency(base + weightFee);
  };

  const handleBookingSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Field validations
    if (!sender.name?.trim() || !sender.phone?.trim() || !sender.address?.trim()) {
      setErrorMsg('Please complete all required sender details (Name, Phone, Address).');
      setCurrentStep(1);
      return;
    }
    if (!receiver.name?.trim() || !receiver.phone?.trim() || !receiver.address?.trim()) {
      setErrorMsg('Please complete all required receiver details (Name, Phone, Address).');
      setCurrentStep(1);
      return;
    }
    if (!parcel.weight || Number(parcel.weight) <= 0) {
      setErrorMsg('Please specify a positive parcel weight in kg.');
      setCurrentStep(2);
      return;
    }
    if (!originBranchId || !destinationBranchId) {
      setErrorMsg('Please select valid origin and destination logistics hubs.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const senderFullAddress = `${sender.address}, ${sender.city || ''} ${sender.state || ''} ${sender.zip || ''}`.trim();
      const receiverFullAddress = `${receiver.address}, ${receiver.city || ''} ${receiver.state || ''} ${receiver.zip || ''}`.trim();

      const payload = {
        senderName: sender.name.trim(),
        senderPhone: sender.phone.trim(),
        senderAddress: senderFullAddress,
        receiverName: receiver.name.trim(),
        receiverPhone: receiver.phone.trim(),
        receiverAddress: receiverFullAddress,
        packageDescription: `${parcel.category} - ${parcel.type} (Qty: ${parcel.quantity})`,
        weight: Number(parcel.weight),
        length: Number(parcel.length) || 0,
        width: Number(parcel.width) || 0,
        height: Number(parcel.height) || 0,
        serviceType: serviceTier,
        originBranchId,
        destinationBranchId,
      };

      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsSubmitting(false);
        setErrorMsg(data.error || 'Failed to book shipment. Please try again.');
        return;
      }

      setSuccessData(data);
      setTimeout(() => {
        router.push(`/shipments/${data.trackingNumber}`);
      }, 700);
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Network error. Unable to contact booking service.');
    }
  };

  const selectedOriginBranch = branches.find((b) => b._id === originBranchId);
  const selectedDestBranch = branches.find((b) => b._id === destinationBranchId);

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <header className="mb-stack-md">
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary tracking-tight font-bold">
          Book Shipment
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Create a new logistics ticket in 5 simple steps.
        </p>
      </header>

      {/* Step Pipeline Tracker (Desktop) */}
      <div className="mb-stack-xl relative z-10 hidden sm:block">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant/30 -z-10 -translate-y-1/2"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        <div className="flex justify-between items-center w-full">
          {steps.map((s) => {
            const isCompleted = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  isCurrent
                    ? 'scale-105'
                    : isCompleted
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-label-md text-sm font-bold shadow-md transition-all ${
                    isCurrent
                      ? 'bg-primary text-on-primary ring-4 ring-primary-fixed/50'
                      : isCompleted
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant'
                  }`}
                >
                  {isCompleted ? <Icon name="check" size={16} /> : s.num}
                </div>
                <span
                  className={`font-label-sm text-label-sm ${
                    isCurrent || isCompleted ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="sm:hidden flex justify-between items-center bg-surface-container p-3 rounded-lg mb-4">
        <span className="font-label-md text-label-md text-primary font-bold">
          Step {currentStep}: {steps[currentStep - 1].label}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {currentStep} of {steps.length}
        </span>
      </div>

      {/* Global Form Notification Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error flex items-center gap-3 text-label-md">
          <Icon name="error" size={20} className="text-error shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successData && (
        <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/30 text-tertiary flex items-center gap-3 text-label-md">
          <Icon name="check_circle" size={20} className="text-tertiary shrink-0" />
          <div>
            <p className="font-bold">Shipment Booked Successfully!</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Assigned Tracking Number: <span className="font-mono font-bold text-on-surface">{successData.trackingNumber}</span>. Redirecting to shipment terminal...
            </p>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Form Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-stack-lg">
          {/* STEP 1: Details (Sender & Receiver) */}
          {currentStep === 1 && (
            <>
              {/* Sender Details */}
              <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon name="person" size={20} />
                    </div>
                    <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                      Sender Details
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="font-label-sm text-label-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      Use Profile Info
                    </span>
                    <input
                      type="checkbox"
                      checked={useProfileInfo}
                      onChange={handleProfileToggle}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-outline-variant/40 rounded-full peer peer-checked:bg-primary transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-transform peer-checked:after:translate-x-4"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Full Name or Company <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={sender.name}
                      onChange={(e) => setSender({ ...sender, name: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Phone Number <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      value={sender.phone}
                      onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={sender.email}
                      onChange={(e) => setSender({ ...sender, email: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Street Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={sender.address}
                      onChange={(e) => setSender({ ...sender, address: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      City
                    </label>
                    <input
                      type="text"
                      value={sender.city}
                      onChange={(e) => setSender({ ...sender, city: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                        State/Prov
                      </label>
                      <input
                        type="text"
                        value={sender.state}
                        onChange={(e) => setSender({ ...sender, state: e.target.value })}
                        className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                        ZIP/Postal
                      </label>
                      <input
                        type="text"
                        value={sender.zip}
                        onChange={(e) => setSender({ ...sender, zip: e.target.value })}
                        className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Receiver Details */}
              <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
                <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <Icon name="location_on" size={20} />
                  </div>
                  <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                    Receiver Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Full Name or Company <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TechnoPark Labs Ltd"
                      value={receiver.name}
                      onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Phone Number <span className="text-error">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 80 4422 1100"
                      value={receiver.phone}
                      onChange={(e) => setReceiver({ ...receiver, phone: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Email Address <span className="text-outline font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="receiving@technopark.in"
                      value={receiver.email}
                      onChange={(e) => setReceiver({ ...receiver, email: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Street Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Plot 44, Electronic City Phase 1"
                      value={receiver.address}
                      onChange={(e) => setReceiver({ ...receiver, address: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Bengaluru"
                      value={receiver.city}
                      onChange={(e) => setReceiver({ ...receiver, city: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                        State/Prov
                      </label>
                      <input
                        type="text"
                        placeholder="Karnataka"
                        value={receiver.state}
                        onChange={(e) => setReceiver({ ...receiver, state: e.target.value })}
                        className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                        ZIP/Postal
                      </label>
                      <input
                        type="text"
                        placeholder="560100"
                        value={receiver.zip}
                        onChange={(e) => setReceiver({ ...receiver, zip: e.target.value })}
                        className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* STEP 2: Parcel Details */}
          {currentStep === 2 && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="inventory_2" size={20} />
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Parcel Specifications
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Cargo Category
                  </label>
                  <select
                    value={parcel.category}
                    onChange={(e) => setParcel({ ...parcel, category: e.target.value })}
                    className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50"
                  >
                    <option value="Industrial Electronics">Industrial Electronics</option>
                    <option value="Precision Machinery">Precision Machinery</option>
                    <option value="Commercial Documents">Commercial Documents</option>
                    <option value="Standard Freight">Standard Freight</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Package Type
                  </label>
                  <select
                    value={parcel.type}
                    onChange={(e) => setParcel({ ...parcel, type: e.target.value })}
                    className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50"
                  >
                    <option value="Box">Standard Box</option>
                    <option value="Pallet">Freight Pallet</option>
                    <option value="Crate">Reinforced Crate</option>
                    <option value="Envelope">Secure Document Pouch</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Weight (kg) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={parcel.weight}
                    onChange={(e) => setParcel({ ...parcel, weight: e.target.value })}
                    className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parcel.quantity}
                    onChange={(e) => setParcel({ ...parcel, quantity: e.target.value })}
                    className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                    Dimensions (Length x Width x Height in cm)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="L (cm)"
                      value={parcel.length}
                      onChange={(e) => setParcel({ ...parcel, length: e.target.value })}
                      className="rounded-lg px-4 py-2.5 border border-outline-variant/40 bg-white/50"
                    />
                    <input
                      type="number"
                      placeholder="W (cm)"
                      value={parcel.width}
                      onChange={(e) => setParcel({ ...parcel, width: e.target.value })}
                      className="rounded-lg px-4 py-2.5 border border-outline-variant/40 bg-white/50"
                    />
                    <input
                      type="number"
                      placeholder="H (cm)"
                      value={parcel.height}
                      onChange={(e) => setParcel({ ...parcel, height: e.target.value })}
                      className="rounded-lg px-4 py-2.5 border border-outline-variant/40 bg-white/50"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Routing Hubs & Logistics */}
          {currentStep === 3 && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <Icon name="warehouse" size={20} />
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Logistics Hub Routing
                </h2>
              </div>

              {isLoadingBranches ? (
                <div className="py-8 flex items-center justify-center gap-2 text-on-surface-variant font-label-md">
                  <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading logistics branch network...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 font-semibold">
                      Origin Logistics Hub <span className="text-error">*</span>
                    </label>
                    <select
                      value={originBranchId}
                      onChange={(e) => setOriginBranchId(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.code}) — {b.city}, {b.country}
                        </option>
                      ))}
                    </select>
                    {selectedOriginBranch && (
                      <p className="font-label-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
                        <span className="font-semibold text-on-surface">Address:</span> {selectedOriginBranch.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5 font-semibold">
                      Destination Logistics Hub <span className="text-error">*</span>
                    </label>
                    <select
                      value={destinationBranchId}
                      onChange={(e) => setDestinationBranchId(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/50 focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.code}) — {b.city}, {b.country}
                        </option>
                      ))}
                    </select>
                    {selectedDestBranch && (
                      <p className="font-label-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
                        <span className="font-semibold text-on-surface">Address:</span> {selectedDestBranch.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STEP 4: Service Level */}
          {currentStep === 4 && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-9 h-9 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <Icon name="flight_takeoff" size={20} />
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Select Delivery Service Tier
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {[
                  { id: 'standard', name: 'Standard Ground', eta: '4-5 Days', price: formatCurrency(180) },
                  { id: 'express', name: 'Express Freight', eta: '2-3 Days', price: formatCurrency(320) },
                  { id: 'priority', name: 'Priority Air Hub', eta: 'Next Day', price: formatCurrency(450) },
                ].map((tier) => (
                  <label
                    key={tier.id}
                    onClick={() => setServiceTier(tier.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      serviceTier === tier.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-outline-variant/30 hover:border-outline-variant'
                    }`}
                  >
                    <div>
                      <span className="font-label-md text-label-md font-bold text-on-surface block">
                        {tier.name}
                      </span>
                      <span className="font-label-sm text-xs text-on-surface-variant block mt-1">
                        Est. Transit: {tier.eta}
                      </span>
                    </div>
                    <span className="font-title-lg text-title-lg text-primary font-bold mt-4 block">
                      {tier.price}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* STEP 5: Review & Confirmation */}
          {currentStep === 5 && (
            <section className="glass-panel border border-white/40 rounded-xl p-6 md:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/20 pb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon name="receipt_long" size={20} />
                </div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Review & Confirm Booking
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest/70 p-4 rounded-xl border border-outline-variant/20">
                  <div>
                    <span className="font-label-sm text-xs text-primary font-bold uppercase tracking-wider block mb-1">
                      Sender Info
                    </span>
                    <p className="font-label-md text-sm font-semibold text-on-surface">{sender.name}</p>
                    <p className="text-xs text-on-surface-variant">{sender.phone}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {sender.address}, {sender.city} {sender.state} {sender.zip}
                    </p>
                  </div>

                  <div>
                    <span className="font-label-sm text-xs text-secondary font-bold uppercase tracking-wider block mb-1">
                      Receiver Info
                    </span>
                    <p className="font-label-md text-sm font-semibold text-on-surface">{receiver.name}</p>
                    <p className="text-xs text-on-surface-variant">{receiver.phone}</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {receiver.address}, {receiver.city} {receiver.state} {receiver.zip}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-lowest/70 p-4 rounded-xl border border-outline-variant/20">
                  <div>
                    <span className="font-label-sm text-xs text-on-surface-variant font-semibold block mb-0.5">
                      Origin Hub
                    </span>
                    <p className="font-body-md text-sm font-bold text-on-surface">
                      {selectedOriginBranch ? `${selectedOriginBranch.name} (${selectedOriginBranch.code})` : 'Pending'}
                    </p>
                  </div>

                  <div>
                    <span className="font-label-sm text-xs text-on-surface-variant font-semibold block mb-0.5">
                      Destination Hub
                    </span>
                    <p className="font-body-md text-sm font-bold text-on-surface">
                      {selectedDestBranch ? `${selectedDestBranch.name} (${selectedDestBranch.code})` : 'Pending'}
                    </p>
                  </div>

                  <div>
                    <span className="font-label-sm text-xs text-on-surface-variant font-semibold block mb-0.5">
                      Package Weight
                    </span>
                    <p className="font-body-md text-sm font-bold text-primary">
                      {parcel.weight} kg ({parcel.category})
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Step Navigation Controls */}
          <div className="flex justify-between items-center pt-2">
            {currentStep > 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md font-semibold transition-colors disabled:opacity-50"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
                className="btn-premium bg-primary text-on-primary px-8 py-3 rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 shadow-lg hover:bg-primary-container transition-all cursor-pointer"
              >
                <span>
                  {currentStep === 1
                    ? 'Next: Parcel Details'
                    : currentStep === 2
                    ? 'Next: Routing Hubs'
                    : currentStep === 3
                    ? 'Next: Service Tier'
                    : 'Next: Review Booking'}
                </span>
                <Icon name="arrow_forward" size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || Boolean(successData)}
                onClick={handleBookingSubmit}
                className="btn-premium bg-primary text-on-primary px-8 py-3.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 shadow-lg hover:bg-primary-container transition-all cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Creating Booking...</span>
                  </>
                ) : (
                  <>
                    <Icon name="local_shipping" size={18} />
                    <span>Confirm & Book Shipment</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sticky Contextual Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 glass-panel border border-white/50 rounded-xl p-6 shadow-lg">
            <h3 className="font-title-lg text-title-lg text-on-surface mb-4 flex items-center gap-2 font-bold">
              <Icon name="receipt_long" size={20} className="text-primary" />
              <span>Shipment Draft</span>
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-0.5">
                    From
                  </span>
                  <span className="block font-body-md text-sm text-on-surface font-medium">
                    {sender.city || 'Kochi'}, {sender.state || 'KL'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-0.5">
                    To
                  </span>
                  {receiver.city ? (
                    <span className="block font-body-md text-sm text-on-surface font-medium">
                      {receiver.city}, {receiver.state || receiver.zip}
                    </span>
                  ) : (
                    <span className="block font-body-md text-sm text-outline italic">
                      Pending destination...
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-start pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-0.5">
                    Logistics Hubs
                  </span>
                  <span className="block font-body-md text-xs text-on-surface font-medium">
                    {selectedOriginBranch ? selectedOriginBranch.code : 'Origin'} &rarr;{' '}
                    {selectedDestBranch ? selectedDestBranch.code : 'Destination'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start pb-3 border-b border-outline-variant/20">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-0.5">
                    Parcel Specs
                  </span>
                  <span className="block font-body-md text-sm text-on-surface">
                    {parcel.category} • {parcel.weight} kg
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant font-semibold mb-0.5">
                    Est. Total
                  </span>
                  <span className="block font-headline-md text-headline-md text-primary font-bold">
                    {calculateEstimate() || '--'}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant font-medium">Authoritative at checkout</span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 flex gap-3 items-start border border-outline-variant/20">
              <Icon name="verified_user" size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="font-label-sm text-xs text-on-surface-variant leading-relaxed">
                Rates and tracking numbers are calculated securely and authoritatively on the ShipShaft server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
