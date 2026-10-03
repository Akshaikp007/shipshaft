import React from 'react';
import BookingWizardClient from '@/components/customer/BookingWizardClient';

export const metadata = {
  title: 'Book Shipment | ShipShaft',
  description: 'Create a new logistics ticket in 5 simple steps.',
};

export default function BookShipmentPage() {
  return <BookingWizardClient />;
}
