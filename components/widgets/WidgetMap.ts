import React from 'react';

// Lazy load widgets to prevent circular dependency / initialization issues
// const StaffPerformanceWidget = React.lazy(() => import('./StaffPerformanceWidget').then(module => ({ default: module.StaffPerformanceWidget })));
// const SLAMonitorWidget = React.lazy(() => import('./SLAMonitorWidget').then(module => ({ default: module.SLAMonitorWidget })));

// DUMMY COMPONENTS FOR DEBUGGING
const StaffPerformanceWidget = () => React.createElement('div', { className: 'p-4 text-red-500 border border-red-200 rounded' }, 'Widget Disabled');
const SLAMonitorWidget = () => React.createElement('div', { className: 'p-4 text-red-500 border border-red-200 rounded' }, 'SLA Widget Disabled');

export const WIDGET_COMPONENTS: Record<string, any> = {
    'staff-performance': StaffPerformanceWidget,
    'sla-monitor': SLAMonitorWidget,
};
