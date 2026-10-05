'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils/formatters';

export default function PaymentClient({
  shipmentId,
  initialShipment,
  initialPayment,
  initialInvoice,
}) {
  const [method, setMethod] = useState('CARD');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank (Demo)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Already paid state check
  const isAlreadyPaid = Boolean(initialPayment);

  const [paymentData, setPaymentData] = useState(initialPayment || null);
  const [isPaid, setIsPaid] = useState(isAlreadyPaid);

  const amountFormatted = formatCurrency(initialShipment?.shippingCost || 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isProcessing || isPaid) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: initialShipment?._id || shipmentId,
          method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.alreadyPaid) {
          // Already paid - transition to paid view
          setPaymentData(data.existingPayment || null);
          setIsPaid(true);
          return;
        }
        throw new Error(data.error || 'Payment failed. Please try again.');
      }

      setPaymentData(data.payment);
      setIsPaid(true);
    } catch (err) {
      console.error('[Payment Process Error]:', err);
      setErrorMsg(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const trackingNum = initialShipment?.trackingNumber || shipmentId;
  const transactionId = paymentData?.transactionId || '';
  const displayAmount = paymentData?.amount ? formatCurrency(paymentData.amount) : amountFormatted;

  return (
    <div className="max-w-[1000px] mx-auto px-edge-margin-mobile md:px-edge-margin-desktop py-stack-xl min-h-screen flex flex-col justify-center">
      {/* Top Header */}
      <div className="mb-stack-lg">
        <Link
          href={`/shipments/${trackingNum}`}
          className="inline-flex items-center text-primary font-label-md text-label-md hover:opacity-80 transition-opacity mb-stack-sm"
        >
          <Icon name="arrow_back" size={18} className="mr-2" />
          <span>Back to Shipment Details</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          Secure Checkout
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
          Complete payment for Tracking ID: <span className="font-mono font-bold text-on-surface">{trackingNum}</span>
        </p>
      </div>

      {/* Demo Simulation Notice Banner */}
      <div className="mb-stack-md p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
        <Icon name="info" size={20} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-bold text-primary block">
            Demo Payment Simulation — No real money will be charged.
          </span>
          <span className="text-on-surface-variant text-xs">
            This is an academic simulation. Real financial credentials are never accepted or stored.
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-stack-md p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error flex items-center gap-2 font-label-md text-sm">
          <Icon name="error" size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {isPaid ? (
        <div className="glass-panel border border-white/40 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-status-success/20 text-tertiary flex items-center justify-center mx-auto mb-4">
            <Icon name="check_circle" size={40} />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-2">
            Payment Confirmed
          </h2>
          <p className="font-body-md text-on-surface-variant mb-6">
            Your payment of <strong className="text-on-surface">{displayAmount}</strong> has been processed
            successfully{transactionId ? <> under Transaction <span className="font-mono font-bold text-primary">#{transactionId}</span></> : '.'}
          </p>

          <div className="bg-surface-container-lowest/80 rounded-xl p-4 mb-6 text-left border border-outline-variant/30 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Shipment Tracking:</span>
              <span className="font-mono font-bold text-on-surface">{trackingNum}</span>
            </div>
            {transactionId && (
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Transaction ID:</span>
                <span className="font-mono font-bold text-primary">{transactionId}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Status:</span>
              <span className="font-bold text-status-success">Payment Confirmed</span>
            </div>
            {paymentData?.paidAt && (
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Payment Date:</span>
                <span className="text-on-surface font-medium">
                  {new Date(paymentData.paidAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/invoices/${initialInvoice?.invoiceNumber || trackingNum}`}
              className="px-6 py-3 rounded-xl border border-outline-variant font-label-md font-semibold text-primary hover:bg-surface-container transition-all"
            >
              View Invoice
            </Link>
            <Link
              href={`/shipments/${trackingNum}`}
              className="btn-premium px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md font-bold hover:bg-primary-container transition-all"
            >
              Return to Shipment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
          {/* Payment Form (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-stack-md">
            <div className="glass-panel border border-white/40 rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-stack-md flex items-center font-bold">
                <Icon name="account_balance_wallet" size={22} className="mr-3 text-primary" />
                <span>Simulated Payment Method</span>
              </h2>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-3 mb-stack-lg">
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'CARD'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <Icon
                    name="credit_card"
                    size={24}
                    className={method === 'CARD' ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span className="font-label-md text-xs font-semibold text-center">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'UPI'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <Icon
                    name="qr_code_2"
                    size={24}
                    className={method === 'UPI' ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span className="font-label-md text-xs font-semibold text-center">UPI & QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('NET_BANKING')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                    method === 'NET_BANKING'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <Icon
                    name="account_balance"
                    size={24}
                    className={method === 'NET_BANKING' ? 'text-primary' : 'text-on-surface-variant'}
                  />
                  <span className="font-label-md text-xs font-semibold text-center">Net Banking</span>
                </button>
              </div>

              {/* Card Simulation Form */}
              {method === 'CARD' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Demo Cardholder Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Sarah Jenkins"
                      readOnly
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-surface-container-low/50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Simulated Card Number
                    </label>
                    <div className="relative">
                      <Icon
                        name="credit_card"
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
                      />
                      <input
                        type="text"
                        defaultValue="4111 •••• •••• 1111"
                        readOnly
                        className="w-full pl-10 pr-4 py-2.5 text-body-md font-mono text-on-surface border border-outline-variant/40 bg-surface-container-low/50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        defaultValue="12/30"
                        readOnly
                        className="w-full px-4 py-2.5 text-body-md font-mono text-on-surface border border-outline-variant/40 bg-surface-container-low/50 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold flex justify-between items-center">
                        <span>CVV</span>
                        <span className="text-[11px] text-outline font-normal">Demo</span>
                      </label>
                      <input
                        type="password"
                        defaultValue="123"
                        readOnly
                        className="w-full px-4 py-2.5 text-body-md font-mono text-on-surface border border-outline-variant/40 bg-surface-container-low/50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full mt-4 btn-premium bg-primary text-on-primary font-label-md text-label-md py-3.5 px-6 rounded-xl shadow-lg hover:bg-primary-container transition-all flex justify-center items-center gap-2 group font-bold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Processing Payment...</span>
                      </span>
                    ) : (
                      <>
                        <Icon name="lock" size={18} className="group-hover:scale-110 transition-transform" />
                        <span>Pay {amountFormatted}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* UPI Simulation Form */}
              {method === 'UPI' && (
                <div className="p-4 text-center space-y-4">
                  <div className="w-40 h-40 bg-white p-3 rounded-xl border border-outline-variant/40 mx-auto shadow-sm flex items-center justify-center">
                    <Icon name="qr_code_2" size={120} className="text-on-surface" />
                  </div>
                  <p className="font-label-md text-sm text-on-surface font-semibold">
                    Simulate UPI QR Approval
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant">
                    UPI ID: shipshaft.demo@axisbank
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="btn-premium bg-primary text-on-primary font-label-md py-3 px-6 rounded-xl font-bold w-full flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Verifying UPI...</span>
                      </span>
                    ) : (
                      <span>Simulate UPI Payment ({amountFormatted})</span>
                    )}
                  </button>
                </div>
              )}

              {/* Net Banking Simulation Form */}
              {method === 'NET_BANKING' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-semibold">
                      Select Demo Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-body-md font-body-md text-on-surface border border-outline-variant/40 bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      <option value="HDFC Bank (Demo)">HDFC Bank (Demo)</option>
                      <option value="State Bank of India (Demo)">State Bank of India (Demo)</option>
                      <option value="ICICI Bank (Demo)">ICICI Bank (Demo)</option>
                      <option value="Axis Bank (Demo)">Axis Bank (Demo)</option>
                    </select>
                  </div>

                  <p className="text-xs text-on-surface-variant">
                    You will be simulated into {selectedBank} portal for instant authorization.
                  </p>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="w-full mt-4 btn-premium bg-primary text-on-primary font-label-md text-label-md py-3.5 px-6 rounded-xl shadow-lg hover:bg-primary-container transition-all flex justify-center items-center gap-2 font-bold cursor-pointer disabled:opacity-70"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Authorizing with Bank...</span>
                      </span>
                    ) : (
                      <>
                        <Icon name="account_balance" size={18} />
                        <span>Authorize Net Banking ({amountFormatted})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary (5 cols) */}
          <div className="md:col-span-5">
            <div className="glass-panel border border-white/40 rounded-xl shadow-lg p-6 md:p-8 sticky top-stack-xl">
              <h2 className="font-title-lg text-title-lg text-on-surface mb-stack-md flex items-center font-bold">
                <Icon name="receipt_long" size={22} className="mr-3 text-primary" />
                <span>Order Summary</span>
              </h2>

              <div className="bg-surface-container-low rounded-xl p-4 mb-stack-md border border-outline-variant/20">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-label-md text-xs text-on-surface-variant">Service</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">
                    {initialShipment?.serviceType || 'Standard Ground'}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-label-md text-xs text-on-surface-variant">Route</span>
                  <span className="font-label-md text-xs text-on-surface font-medium">
                    {initialShipment?.originCity} &rarr; {initialShipment?.destinationCity}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-stack-md border-b border-outline-variant/30 pb-stack-md">
                <div className="flex justify-between items-center text-sm font-body-md text-on-surface-variant">
                  <span>Authoritative Shipping Fee</span>
                  <span className="text-on-surface font-medium">{amountFormatted}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-body-md text-on-surface-variant">
                  <span>Gross Weight</span>
                  <span className="text-on-surface font-medium">{initialShipment?.weight || 1} kg</span>
                </div>
                <div className="flex justify-between items-center text-sm font-body-md text-status-success font-semibold">
                  <span>Taxes & Hub Handling</span>
                  <span>Included</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-title-lg text-title-lg text-on-surface font-bold">Total Due</span>
                <span className="font-headline-md text-headline-md text-primary font-bold">
                  {amountFormatted}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-on-surface-variant opacity-80">
                <Icon name="verified" size={16} className="text-tertiary" />
                <span className="font-label-sm text-xs">Simulated checkout environment.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
