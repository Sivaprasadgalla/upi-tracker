import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export type IconName =
  | 'overview'
  | 'history'
  | 'limits'
  | 'analytics'
  | 'setup'
  | 'plus'
  | 'search'
  | 'bell'
  | 'close'
  | 'chevron-right'
  | 'arrow-up-right'
  | 'arrow-down-left'
  | 'food'
  | 'grocery'
  | 'shopping'
  | 'travel'
  | 'bill'
  | 'entertainment'
  | 'medical'
  | 'transfer'
  | 'card'
  | 'wallet'
  | 'shield'
  | 'faceid'
  | 'bolt'
  | 'clock'
  | 'calendar'
  | 'trash'
  | 'edit'
  | 'lock'
  | 'check'
  | 'refresh';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  focused?: boolean;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = '#8E8E93',
  focused = false
}) => {
  const strokeColor = color;
  const fillColor = focused ? color : 'none';

  switch (name) {
    // Refresh / Sync
    case 'refresh':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M23 4V10H17M1 20V14H7"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3.51 9A9 9 0 0120.49 5.64L23 10M1 14L3.51 18.36A9 9 0 0020.49 15"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    // Tab: Overview / Dashboard (SF Symbol: square.grid.2x2 or chart.pie)
    case 'overview':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="3"
            width="8"
            height="8"
            rx="2.5"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? strokeColor : 'none'}
          />
          <Rect
            x="13"
            y="3"
            width="8"
            height="8"
            rx="2.5"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? strokeColor : 'none'}
          />
          <Rect
            x="3"
            y="13"
            width="8"
            height="8"
            rx="2.5"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? strokeColor : 'none'}
          />
          <Rect
            x="13"
            y="13"
            width="8"
            height="8"
            rx="2.5"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? strokeColor : 'none'}
          />
        </Svg>
      );

    // Tab: History / Transactions (SF Symbol: creditcard.fill or list.bullet.rectangle)
    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="3"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? strokeColor : 'none'}
          />
          <Path d="M2 10H22" stroke={focused ? '#000000' : strokeColor} strokeWidth="2" />
          <Rect
            x="5"
            y="14"
            width="4"
            height="2"
            rx="0.5"
            fill={focused ? '#000000' : strokeColor}
          />
        </Svg>
      );

    // Tab: Limits / Budgets (SF Symbol: target / sliders.horizontal)
    case 'limits':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="12"
            r="9"
            stroke={strokeColor}
            strokeWidth="2"
            fill={focused ? 'rgba(10, 132, 255, 0.2)' : 'none'}
          />
          <Circle cx="12" cy="12" r="5" stroke={strokeColor} strokeWidth="2" />
          <Circle cx="12" cy="12" r="2" fill={strokeColor} />
        </Svg>
      );

    // Tab: Analytics (SF Symbol: chart.xyaxis.line or chart.bar.fill)
    case 'analytics':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 3V21H21"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M7 16L12 11L16 14L21 8"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {focused && <Circle cx="21" cy="8" r="2" fill={strokeColor} />}
        </Svg>
      );

    // Tab: Setup / Settings (SF Symbol: gearshape)
    case 'setup':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={strokeColor} strokeWidth="2" />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={focused ? strokeColor : 'none'}
          />
        </Svg>
      );

    // Common Action: Plus
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 5V19M5 12H19"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Common Action: Search
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke={strokeColor} strokeWidth="2" />
          <Path d="M16.5 16.5L21 21" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // Common Action: Bell / Notification
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.73 21A2 2 0 0 1 10.27 21"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
      );

    // Common Action: Close
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 6L6 18M6 6L18 18"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </Svg>
      );

    // Chevron right
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18L15 12L9 6"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Arrow Up Right (Debit / Spent)
    case 'arrow-up-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Arrow Down Left (Credit / Received)
    case 'arrow-down-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 7L7 17M7 17H17M7 17V7"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Categories: Food
    case 'food':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8H6C4 8 3 10 3 12C3 14 4 15 6 15H18C20 15 21 14 21 12C21 10 20 8 18 8Z"
            stroke={strokeColor}
            strokeWidth="2"
          />
          <Path d="M5 8C5 4.5 8 3 12 3C16 3 19 4.5 19 8" stroke={strokeColor} strokeWidth="2" />
          <Path d="M4 18H20C20 20 18 21 12 21C6 21 4 20 4 18Z" fill={strokeColor} />
        </Svg>
      );

    // Categories: Grocery
    case 'grocery':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="21" r="1.5" fill={strokeColor} />
          <Circle cx="19" cy="21" r="1.5" fill={strokeColor} />
          <Path
            d="M1 1H4L6.68 14.39A2 2 0 0 0 8.66 16H18.4A2 2 0 0 0 20.37 14.39L22 6H5"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Categories: Shopping
    case 'shopping':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 2L3 6V20A2 2 0 0 0 5 22H19A2 2 0 0 0 21 20V6L18 2H6Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Path d="M3 6H21" stroke={strokeColor} strokeWidth="2" />
          <Path d="M16 10A4 4 0 0 1 8 10" stroke={strokeColor} strokeWidth="2" />
        </Svg>
      );

    // Categories: Travel / Ride
    case 'travel':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="13" rx="2" stroke={strokeColor} strokeWidth="2" />
          <Path d="M3 10H21" stroke={strokeColor} strokeWidth="2" />
          <Circle cx="7" cy="14" r="1.5" fill={strokeColor} />
          <Circle cx="17" cy="14" r="1.5" fill={strokeColor} />
          <Path d="M5 17L4 20M19 17L20 20" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // Categories: Bills / Electricity / Utilities
    case 'bill':
    case 'bolt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={focused ? strokeColor : 'none'}
          />
        </Svg>
      );

    // Categories: Entertainment
    case 'entertainment':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="3" width="20" height="18" rx="3" stroke={strokeColor} strokeWidth="2" />
          <Path d="M10 8L16 12L10 16V8Z" fill={strokeColor} />
        </Svg>
      );

    // Categories: Medical
    case 'medical':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="18" rx="4" stroke={strokeColor} strokeWidth="2" />
          <Path d="M12 7V17M7 12H17" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );

    // Face ID
    case 'faceid':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M7 3H5A2 2 0 0 0 3 5V7M17 3H19A2 2 0 0 1 21 5V7M21 17V19A2 2 0 0 1 19 21H17M3 17V19A2 2 0 0 0 5 21H7" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          <Circle cx="9" cy="9.5" r="1.2" fill={strokeColor} />
          <Circle cx="15" cy="9.5" r="1.2" fill={strokeColor} />
          <Path d="M12 12V14.5M9 17C10 18 14 18 15 17" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // Shield / Privacy
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // Calendar
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="3" stroke={strokeColor} strokeWidth="2" />
          <Path d="M16 2V6M8 2V6M3 10H21" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // Trash / Delete
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 6H21M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M10 11V17M14 11V17" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // Edit / Pencil
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    // Lock
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="11" width="18" height="11" rx="2" stroke={strokeColor} strokeWidth="2" />
          <Path d="M7 11V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V11" stroke={strokeColor} strokeWidth="2" />
        </Svg>
      );

    // Wallet
    case 'wallet':
    case 'card':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="5" width="20" height="14" rx="3" stroke={strokeColor} strokeWidth="2" />
          <Path d="M2 10H22" stroke={strokeColor} strokeWidth="2" />
        </Svg>
      );
  }
};
