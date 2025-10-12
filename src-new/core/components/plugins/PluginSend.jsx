/**
 * PluginSend
 *
 * Query output component - displays query status and provides execute button.
 * Uses Toolbar for consistent layout.
 */

import React from 'react';
import Toolbar from '../../../components/Toolbar.jsx';
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react';

export default function PluginSend({
  query = null,
  queryIsValid = false,
  onExecute,
  isExecuting = false,
  lastExecuted = null
}) {
  const handleExecute = () => {
    if (queryIsValid && onExecute) {
      onExecute();
    }
  };

  return (
    <Toolbar
      leftContent={
        <div className="text-xs font-semibold text-gray-700">Execute Query</div>
      }
      centerContent={
        queryIsValid ? (
          <div className="text-xs text-green-600">✓ Ready to run</div>
        ) : (
          <div className="text-xs text-gray-400">Fill required slots</div>
        )
      }
      rightContent={
        <button
          onClick={handleExecute}
          disabled={!queryIsValid || isExecuting}
          title={queryIsValid ? 'Run Query' : 'Fill required slots to run query'}
          className={`
            flex items-center justify-center w-7 h-7 rounded transition-all
            ${queryIsValid && !isExecuting
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isExecuting ? (
            <IconRefresh size={16} className="animate-spin" />
          ) : (
            <IconPlayerPlay size={16} />
          )}
        </button>
      }
      height={32}
      borderWidth={0}
      shadowSize=""
      paddingX={3}
      backgroundColor="bg-gradient-to-b from-gray-50 via-white to-gray-100"
    />
  );
}
