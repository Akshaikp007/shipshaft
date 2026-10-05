'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/formatters';

export default function AdminReportsPage() {
  const [range, setRange] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Real Report Data State
  const [overview, setOverview] = useState(null);
  const [shipmentsReport, setShipmentsReport] = useState(null);
  const [revenueReport, setRevenueReport] = useState(null);
  const [branchReport, setBranchReport] = useState(null);
  const [agentReport, setAgentReport] = useState(null);
  const [gpsReport, setGpsReport] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      if (range === 'custom' && (!customFrom || !customTo)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        let queryParams = `?range=${encodeURIComponent(range)}`;
        if (range === 'custom') {
          queryParams += `&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`;
        }

        const [resOverview, resShipments, resRevenue, resBranches, resAgents, resGps] =
          await Promise.all([
            fetch(`/api/admin/reports/overview${queryParams}`),
            fetch(`/api/admin/reports/shipments${queryParams}`),
            fetch(`/api/admin/reports/revenue${queryParams}`),
            fetch(`/api/admin/reports/branches${queryParams}`),
            fetch(`/api/admin/reports/agents${queryParams}`),
            fetch('/api/admin/reports/gps'),
          ]);

        const [
          dataOverview,
          dataShipments,
          dataRevenue,
          dataBranches,
          dataAgents,
          dataGps,
        ] = await Promise.all([
          resOverview.json(),
          resShipments.json(),
          resRevenue.json(),
          resBranches.json(),
          resAgents.json(),
          resGps.json(),
        ]);

        if (ignore) return;
        if (!resOverview.ok || !dataOverview.success) {
          throw new Error(dataOverview.error || 'Failed to load overview report.');
        }
        if (!resShipments.ok || !dataShipments.success) {
          throw new Error(dataShipments.error || 'Failed to load shipments report.');
        }
        if (!resRevenue.ok || !dataRevenue.success) {
          throw new Error(dataRevenue.error || 'Failed to load revenue report.');
        }
        if (!resBranches.ok || !dataBranches.success) {
          throw new Error(dataBranches.error || 'Failed to load branches report.');
        }
        if (!resAgents.ok || !dataAgents.success) {
          throw new Error(dataAgents.error || 'Failed to load agents report.');
        }
        if (!resGps.ok || !dataGps.success) {
          throw new Error(dataGps.error || 'Failed to load GPS report.');
        }

        setOverview(dataOverview.data);
        setShipmentsReport(dataShipments.data);
        setRevenueReport(dataRevenue.data);
        setBranchReport(dataBranches.data);
        setAgentReport(dataAgents.data);
        setGpsReport(dataGps.data);
      } catch (err) {
        if (!ignore) {
          console.error('[Admin Reports Fetch Error]:', err);
          setErrorMessage(err.message || 'Error communicating with reporting service.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      ignore = true;
    };
  }, [range, reloadKey, customFrom, customTo]);

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      setErrorMessage('Please select both Start and End dates for custom range.');
      return;
    }
    setReloadKey((prev) => prev + 1);
  };

  const handleExportCsv = () => {
    if (!branchReport || !branchReport.branches) {
      setToastMessage('No data available to export.');
      return;
    }
    const headers = ['Branch Name', 'Branch Code', 'Origin Shipments', 'Destination Shipments', 'Active Shipments', 'Delivered Shipments', 'Revenue (INR)'];
    const rows = branchReport.branches.map((b) => [
      `"${b.branchName}"`,
      `"${b.branchCode}"`,
      b.originShipments,
      b.destinationShipments,
      b.activeShipments,
      b.deliveredShipments,
      b.revenue,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ShipShaft_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Export complete: Consolidated CSV downloaded.');
  };

  // Safe KPI calculations
  const totalVolume = overview?.shipments?.total || 0;
  const totalRevenue = overview?.revenue?.total || 0;
  const activeFleet = overview?.operations?.availableAgents || 0;
  const activeHubs = overview?.branches?.active || 0;

  // Max volume in shipment trend for SVG scaling
  const maxTrendVolume = shipmentsReport?.trend?.length
    ? Math.max(...shipmentsReport.trend.map((t) => t.count), 1)
    : 1;

  // Max revenue in revenue trend for SVG scaling
  const maxRevenueVolume = revenueReport?.trend?.length
    ? Math.max(...revenueReport.trend.map((t) => t.revenue), 1)
    : 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header & Global Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Authoritative Database Intelligence • Live Telemetry</span>
          </div>
          <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
            Logistics Intelligence & Reports
          </h1>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant mt-1">
            Real-time MongoDB aggregated operational throughput, revenue metrics, fleet SLA, and GPS operations.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 text-xs flex-wrap">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  range === tab.id
                    ? 'bg-surface text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleExportCsv}
            icon={<Icon name="download" size={18} />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Custom Date Range Selector (Shown when range === 'custom') */}
      {range === 'custom' && (
        <div className="p-4 rounded-2xl glass-panel border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold text-on-surface">
            <span className="text-primary font-bold flex items-center gap-1.5">
              <Icon name="date_range" size={18} />
              <span>Select Custom Range:</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-white text-xs font-medium focus:outline-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-white text-xs font-medium focus:outline-primary"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyCustom}
            icon={<Icon name="filter_alt" size={16} />}
          >
            Apply Filter
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/40 text-error text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name="error" size={20} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="border-error/40 text-error"
          >
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards (Calculated directly from MongoDB) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-1">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block">
            Total Shipments
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-md text-2xl font-black text-on-surface">
              {isLoading ? '...' : totalVolume.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-tertiary">
              {overview?.shipments?.today ? `+${overview.shipments.today} Today` : 'Active'}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant block">
            {overview ? `${overview.shipments.active} in flight • ${overview.shipments.delivered} delivered` : 'Aggregating records...'}
          </span>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-1">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block">
            Authoritative Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-md text-2xl font-black text-on-surface">
              {isLoading ? '...' : formatCurrency(totalRevenue, 'INR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-bold text-tertiary">
              {overview?.revenue?.today ? `+${formatCurrency(overview.revenue.today, 'INR', { maximumFractionDigits: 0 })}` : 'Verified'}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant block">
            {overview ? `${overview.revenue.paymentCount} successful payments (PAID)` : 'Querying payments...'}
          </span>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-1">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block">
            Active Fleet Units
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-md text-2xl font-black text-on-surface">
              {isLoading ? '...' : `${activeFleet} / ${overview?.operations?.totalAgents || 0}`}
            </span>
            <span className="text-xs font-bold text-primary">
              {overview?.operations?.busyAgents ? `${overview.operations.busyAgents} Busy` : 'Available'}
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant block">
            {overview ? `${overview.operations.offlineAgents} offline agents` : 'Checking roster...'}
          </span>
        </div>

        <div className="glass-panel border border-outline-variant/30 rounded-2xl p-5 bg-white/95 shadow-sm space-y-1">
          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold block">
            Logistics Terminals
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-md text-2xl font-black text-on-surface">
              {isLoading ? '...' : activeHubs}
            </span>
            <span className="text-xs font-bold text-tertiary">100% Operational</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block">
            {overview ? `${overview.branches.total} nationwide hubs online` : 'Scanning hubs...'}
          </span>
        </div>
      </div>

      {/* Section 1: GPS Operational Telemetry Snapshot (Phase 9 Integration) */}
      <div className="glass-panel border border-primary/25 rounded-3xl p-6 bg-gradient-to-r from-white via-surface-container-low to-primary/5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="radar" size={20} />
            </div>
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface">
                GPS Telemetry & Active Delivery Operations
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant">
                Live monitoring of couriers and consignments currently in transit.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            Phase 9 Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/80 border border-outline-variant/20 space-y-1">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase block">
              Out for Delivery
            </span>
            <div className="font-headline-md text-2xl font-extrabold text-on-surface">
              {isLoading ? '...' : gpsReport?.outForDeliveryCount ?? 0}
            </div>
            <span className="text-[10px] text-on-surface-variant">Active doorstep deliveries</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-outline-variant/20 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Signals (Fresh)</span>
            </span>
            <div className="font-headline-md text-2xl font-extrabold text-emerald-700">
              {isLoading ? '...' : gpsReport?.freshTelemetryCount ?? 0}
            </div>
            <span className="text-[10px] text-on-surface-variant">Telemetry &lt;= 60s ago</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-outline-variant/20 space-y-1">
            <span className="text-[11px] font-semibold text-amber-700 uppercase block">
              Stale / Awaiting Fix
            </span>
            <div className="font-headline-md text-2xl font-extrabold text-amber-700">
              {isLoading ? '...' : gpsReport?.staleTelemetryCount ?? 0}
            </div>
            <span className="text-[10px] text-on-surface-variant">Older than 60s or awaiting signal</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-outline-variant/20 space-y-1">
            <span className="text-[11px] font-semibold text-primary uppercase block">
              Transmitting Couriers
            </span>
            <div className="font-headline-md text-2xl font-extrabold text-primary">
              {isLoading ? '...' : gpsReport?.agentsTransmittingCount ?? 0}
            </div>
            <span className="text-[10px] text-on-surface-variant">Active in the last 5 mins</span>
          </div>
        </div>
      </div>

      {/* Section 2: Shipment Throughput Trend & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shipment Daily Trend */}
        <div className="lg:col-span-8 glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <Icon name="timeline" size={20} className="text-primary" />
                <span>Daily Shipment Volume & Throughput</span>
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                Consignments cleared across national distribution routes.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              Total: {shipmentsReport?.total ?? 0} pkgs
            </span>
          </div>

          {/* SVG Area / Bar Trend Visualization */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-on-surface-variant animate-pulse">
              <Icon name="sync" size={20} className="animate-spin mr-2" />
              <span>Calculating shipment aggregation...</span>
            </div>
          ) : shipmentsReport?.trend && shipmentsReport.trend.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-outline-variant/20 overflow-x-auto">
              {shipmentsReport.trend.map((item) => {
                const heightPct = Math.round((item.count / maxTrendVolume) * 100);
                return (
                  <div key={item.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-primary to-primary-container rounded-t-md transition-all duration-300 hover:brightness-110 shadow-sm"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                    <span className="text-[10px] font-semibold text-on-surface-variant mt-1 truncate">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant text-xs space-y-2">
              <Icon name="inbox" size={32} className="text-outline" />
              <span>No shipments found for this period.</span>
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4 glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-5">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-4">
            <Icon name="pie_chart" size={20} className="text-primary" />
            <span>Status Distribution</span>
          </h2>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant animate-pulse">
                Loading status distribution...
              </div>
            ) : shipmentsReport?.distribution?.length ? (
              shipmentsReport.distribution.map((item) => {
                const pct = shipmentsReport.total > 0 ? Math.round((item.count / shipmentsReport.total) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-on-surface">{item.status.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-on-surface-variant">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-on-surface-variant">No shipment data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Revenue Analytics & Service Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-8 glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                <Icon name="payments" size={20} className="text-tertiary" />
                <span>Financial Revenue Growth (PAID)</span>
              </h2>
              <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                Authoritative collected freight payments.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-tertiary">
              Total: {formatCurrency(revenueReport?.totalRevenue || 0, 'INR', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-on-surface-variant animate-pulse">
              <Icon name="sync" size={20} className="animate-spin mr-2" />
              <span>Aggregating payment records...</span>
            </div>
          ) : revenueReport?.trend && revenueReport.trend.length > 0 ? (
            <div className="h-64 flex items-end justify-between gap-2 pt-6 px-2 border-b border-outline-variant/20 overflow-x-auto">
              {revenueReport.trend.map((item) => {
                const heightPct = Math.round((item.revenue / maxRevenueVolume) * 100);
                return (
                  <div key={item.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.revenue, 'INR', { maximumFractionDigits: 0 })}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-tertiary to-emerald-400 rounded-t-md transition-all duration-300 hover:brightness-110 shadow-sm"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                    />
                    <span className="text-[10px] font-semibold text-on-surface-variant mt-1 truncate">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant text-xs space-y-2">
              <Icon name="receipt" size={32} className="text-outline" />
              <span>No successful payments found for this period.</span>
            </div>
          )}
        </div>

        {/* Revenue by Service Type */}
        <div className="lg:col-span-4 glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-5">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-4">
            <Icon name="local_shipping" size={20} className="text-primary" />
            <span>Service-Type Breakdown</span>
          </h2>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant animate-pulse">
                Analyzing service tiers...
              </div>
            ) : revenueReport?.byServiceType?.length ? (
              revenueReport.byServiceType.map((tier) => {
                const pct = revenueReport.totalRevenue > 0 ? Math.round((tier.revenue / revenueReport.totalRevenue) * 100) : 0;
                return (
                  <div key={tier.serviceType} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-on-surface">{tier.serviceType}</span>
                      <span className="font-mono text-on-surface-variant">
                        {formatCurrency(tier.revenue, 'INR', { maximumFractionDigits: 0 })} ({tier.count} pkgs)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-tertiary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-on-surface-variant">No service tier data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Regional Hub Operational & Financial Matrix Table */}
      <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 flex-wrap gap-2">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="warehouse" size={20} className="text-primary" />
            <span>Regional Hub Operational & Financial Matrix</span>
          </h2>
          <span className="text-xs text-on-surface-variant">
            {branchReport?.count ? `${branchReport.count} Branches` : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-wider bg-surface-container-low/40">
                <th className="py-3 px-3">Hub Name</th>
                <th className="py-3 px-3">Code</th>
                <th className="py-3 px-3 text-center">Origin</th>
                <th className="py-3 px-3 text-center">Destination</th>
                <th className="py-3 px-3 text-center">Active Volume</th>
                <th className="py-3 px-3 text-center">Delivered</th>
                <th className="py-3 px-3 text-right">Attributable Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-on-surface-variant">
                    Aggregating regional logistics data...
                  </td>
                </tr>
              ) : branchReport?.branches && branchReport.branches.length > 0 ? (
                branchReport.branches.map((b) => (
                  <tr key={b.branchId} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-3 font-bold text-on-surface">{b.branchName}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-primary">{b.branchCode}</td>
                    <td className="py-3 px-3 text-center font-mono">{b.originShipments}</td>
                    <td className="py-3 px-3 text-center font-mono">{b.destinationShipments}</td>
                    <td className="py-3 px-3 text-center font-bold text-primary">{b.activeShipments}</td>
                    <td className="py-3 px-3 text-center font-bold text-tertiary">{b.deliveredShipments}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">
                      {formatCurrency(b.revenue, 'INR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-on-surface-variant">
                    No branch data found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Delivery Fleet & Courier Operations Table */}
      <div className="glass-panel border border-outline-variant/30 rounded-3xl p-6 bg-white/95 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 flex-wrap gap-2">
          <h2 className="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
            <Icon name="badge" size={20} className="text-primary" />
            <span>Delivery Fleet Operational Roster</span>
          </h2>
          <span className="text-xs text-on-surface-variant">
            {agentReport?.count ? `${agentReport.count} Agents` : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-wider bg-surface-container-low/40">
                <th className="py-3 px-3">Agent</th>
                <th className="py-3 px-3">Employee ID</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Assigned</th>
                <th className="py-3 px-3 text-center">In Transit</th>
                <th className="py-3 px-3 text-center">Out for Del</th>
                <th className="py-3 px-3 text-center">Delivered</th>
                <th className="py-3 px-3 text-right">Active Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-on-surface-variant">
                    Loading fleet metrics...
                  </td>
                </tr>
              ) : agentReport?.agents && agentReport.agents.length > 0 ? (
                agentReport.agents.map((a) => (
                  <tr key={a.agentId} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-3 font-bold text-on-surface">{a.name}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-primary">{a.employeeId}</td>
                    <td className="py-3 px-3 font-medium text-on-surface-variant">{a.branch}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.availability === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : a.availability === 'BUSY'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {a.availability}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{a.totalAssigned}</td>
                    <td className="py-3 px-3 text-center font-mono">{a.inTransit}</td>
                    <td className="py-3 px-3 text-center font-mono">{a.outForDelivery}</td>
                    <td className="py-3 px-3 text-center font-bold text-tertiary">{a.delivered}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                      {a.currentWorkload} pkgs
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-on-surface-variant">
                    No delivery agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
