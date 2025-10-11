import React from 'react';
import PluginRack from '../../../../components/PluginRack.jsx';
import PluginButton from '../buttons/PluginButton.jsx';
import { IconBusinessplan, IconCashBanknote, IconCashBanknoteFilled, IconChartBar, IconCurrencyDollar, IconPinned, IconPinnedFilled, IconReceiptFilled, IconShoppingCart, IconShoppingCartDollar, IconShoppingCartFilled } from '@tabler/icons-react';

export default function MetricPluginPanel({ onPanelStateChange, panelCommand }) {
  const metricPlugins = {
    'Revenue': [
      { id: 'total-revenue', label: 'NET', icon: IconCashBanknote },
      { id: 'avg-order-value', label: 'AOV', icon: IconShoppingCartDollar},
      { id: 'top-10', label: ' AR', icon: IconPinned },
      { id: 'margin-analysis', label: 'TOP 20', icon: IconBusinessplan },

    ],
    'Inventory': [
      { id: 'total-quantity', label: 'Qty', icon: IconShoppingCart },
      { id: 'product-performance', label: 'Perf', icon: IconChartBar },
      { id: 'avg-unit-price', label: 'Unit $', icon: IconBusinessplan },
            { id: 'total-orders', label: 'Orders', icon: IconShoppingCart },
    ],
    'Orders': [

      { id: 'orders-by-value', label: 'By Val', icon: IconChartBar },
    ]
  };

  const handleDragStart = (e, plugin) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(plugin));
    e.dataTransfer.effectAllowed = 'copy';
    console.log('Dragging plugin:', plugin);
  };

  return (
    <div className="flex h-[100px] items-center justify-center bg-gradient-to-t from gray-100 via-gray-50 to-gray-100 border-t border-b">
      <PluginRack
        pages={['Revenue', 'Inventory', 'Orders']}
        pluginsByPage={metricPlugins}
        renderButton={(plugin) => (
          <PluginButton
            plugin={plugin}
            onDragStart={handleDragStart}
          />
        )}
      />
    </div>
  );
}
