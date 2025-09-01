import React from 'react';
import {
  StarIcon,
  BellIcon,
  ChartBarIcon,
  NewspaperIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const LeftSidebar = () => {
  const sidebarItems = [
    { icon: StarIcon, label: 'Watchlist', active: true },
    { icon: BellIcon, label: 'Alerts', active: false },
    { icon: ChartBarIcon, label: 'Charts', active: false },
    { icon: NewspaperIcon, label: 'News', active: false },
    { icon: BriefcaseIcon, label: 'Portfolio', active: false },
  ];

  return (
    <div className="left-sidebar">
      {sidebarItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div 
            key={index}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            title={item.label}
          >
            <IconComponent className="sidebar-icon" />
          </div>
        );
      })}
    </div>
  );
};

export default LeftSidebar;