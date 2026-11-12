import type { SVGProps } from 'react';

/**
 * Careff icon set: 24px stroke icons drawn for this UI (no icon dependency).
 * Every icon inherits `currentColor` and takes the usual SVG props, so size
 * and color come from the call site (`className="h-5 w-5 text-amber-300"`).
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const CarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11" />
    <path d="M3.5 16.5v-3A2.5 2.5 0 0 1 6 11h12a2.5 2.5 0 0 1 2.5 2.5v3" />
    <path d="M3.5 16.5h17M6 16.5v1.8M18 16.5v1.8" />
    <circle cx="7.5" cy="13.8" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="13.8" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
);

export const PinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-6.5-5.6-6.5-10.8a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10.2" r="2.3" />
  </Icon>
);

export const FlagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 21V4" />
    <path d="M5 4.5h11.5l-2 3.5 2 3.5H5" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.3a5.6 5.6 0 0 1 3.7 5.2" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Icon>
);

export const RouteIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8.2 18H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.8" />
  </Icon>
);

export const LinkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l7 2.8v5.4c0 4.3-2.9 7.7-7 9.3-4.1-1.6-7-5-7-9.3V5.8L12 3z" />
    <path d="M9 12l2.2 2.2L15.2 10" />
  </Icon>
);

export const WalletIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3" />
    <path d="M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5H19a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z" />
    <circle cx="16" cy="13.7" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
);

export const SparkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8-4.8-1.7 4.8-1.7L12 3.5z" />
    <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
  </Icon>
);

export const BoltIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 3L5 13.5h6L10.5 21 19 10h-6.2L13 3z" />
  </Icon>
);

export const GiftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 11h16v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11zM3 7.5h18V11H3zM12 7.5v13" />
    <path d="M12 7.5C10.5 4 7 4.2 7 6.2c0 1.3 2 1.3 5 1.3zM12 7.5c1.5-3.5 5-3.3 5-1.3 0 1.3-2 1.3-5 1.3z" />
  </Icon>
);

export const MapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2zM9 4.5v13M15 6.5v13" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const SaveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4zM8 4v5h7V4M8 20v-6h8v6" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4L2.8 19.5h18.4L12 4zM12 10v4.5" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </Icon>
);

/** WhatsApp glyph (filled), for the share buttons. */
export const WhatsAppIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.7L2.5 21.5l4.7-1.2A9.7 9.7 0 1 0 12 2.2zm0 1.8a7.9 7.9 0 1 1-4 14.7l-.3-.2-2.7.7.7-2.6-.2-.300A7.9 7.9 0 0 1 12 4zm-3.3 3.9c-.2 0-.5 0-.7.3-.300.3-1 1-1 2.3s1 2.7 1.2 2.9c.100.2 2 3.1 4.9 4.2 2.4.900 2.9.700 3.4.700.5-.100 1.7-.700 1.9-1.3.200-.700.2-1.2.200-1.3-.100-.100-.300-.200-.600-.300l-1.9-.900c-.300-.100-.500-.100-.700.2l-.800 1c-.200.2-.300.2-.600.1-.300-.200-1.2-.500-2.3-1.4-.900-.800-1.4-1.7-1.6-2-.200-.300 0-.500.1-.600l.400-.500c.200-.200.2-.300.3-.500.1-.200 0-.400 0-.500l-.900-2c-.200-.500-.400-.400-.600-.400h-.700z" />
  </svg>
);
