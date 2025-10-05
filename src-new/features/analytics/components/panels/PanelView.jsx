import React from 'react';
import { ProductFilterToolbar } from '../filters/product/ProductFilter.jsx';
import { MetricFilterToolbar } from '../filters/metric/MetricFilter.jsx';
import { TimeFilterToolbar } from '../filters/time/TimeFilter.jsx';
import { ElementFilterToolbar } from '../filters/element/ElementFilter.jsx';
import { TrendFilterToolbar } from '../filters/trend/TrendFilter.jsx';

export default function PanelView({ activeTab, setActiveTab, panelState, onToolbarAction, panelCommand, onPanelStateChange, resetNonce, ...props }) {
  return (
    <div className="flex flex-col items-center space-y-2 p-2">
      <div className="w-full"><ProductFilterToolbar /></div>
      <div className="w-full"><MetricFilterToolbar /></div>
      <div className="w-full"><TimeFilterToolbar /></div>
      <div className="w-full"><ElementFilterToolbar /></div>
      <div className="w-full"><TrendFilterToolbar /></div>
    </div>
  );
}