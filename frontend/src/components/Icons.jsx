const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75 };

export const GridIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
);
export const UsersIcon = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round"/><path d="M15.5 5.2c1.5.4 2.6 1.7 2.6 3.3 0 1.5-1 2.8-2.4 3.2" strokeLinecap="round"/><path d="M16 14.7c2.6.5 4.5 2.4 4.5 5" strokeLinecap="round"/></svg>
);
export const CoinsIcon = (p) => (
  <svg {...base} {...p}><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M3 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/><path d="M15 9.3c2.9.3 5 1.5 5 2.7v4c0 1.2-2 2.4-4.7 2.7"/></svg>
);
export const NoteIcon = (p) => (
  <svg {...base} {...p}><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 6v12M18 6v12" strokeWidth="1.5"/></svg>
);
export const RepeatIcon = (p) => (
  <svg {...base} {...p}><path d="M4 8h13l-2.5-2.5M20 16H7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round"/></svg>
);
export const ShieldIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const PhoneIcon = (p) => (
  <svg {...base} {...p}><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18h3" strokeLinecap="round"/></svg>
);
export const GearIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1L5.6 5.6" strokeLinecap="round"/></svg>
);
export const UserIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" strokeLinecap="round"/></svg>
);
export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/></svg>
);
export const BellIcon = (p) => (
  <svg {...base} {...p}><path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" strokeLinejoin="round"/><path d="M10 18.5a2 2 0 004 0" strokeLinecap="round"/></svg>
);
export const PlusIcon = (p) => (
  <svg {...base} {...p} strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
);
export const ChevronRightIcon = (p) => (
  <svg {...base} {...p} strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const LogoutIcon = (p) => (
  <svg {...base} {...p}><path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M14 8l4 4-4 4M18 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const EditIcon = (p) => (
  <svg {...base} {...p} strokeWidth="1.6"><path d="M4 17.5V20h2.5L18 8.5 15.5 6 4 17.5z" strokeLinejoin="round"/><path d="M13.5 8l2.5 2.5"/></svg>
);
export const TrashIcon = (p) => (
  <svg {...base} {...p} strokeWidth="1.6"><path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h4a1 1 0 001-1l1-12" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const SendIcon = (p) => (
  <svg {...base} {...p} strokeWidth="1.6"><path d="M4 4l16 8-16 8 3.5-8L4 4z" strokeLinejoin="round"/></svg>
);
export const LockIcon = (p) => (
  <svg {...base} {...p}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round"/></svg>
);
export const KeyIcon = (p) => (
  <svg {...base} {...p}><circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L19 4M16 7l2 2M19 4l1.5 1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const CheckCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const XCircleIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round"/></svg>
);
export const TrendingIcon = (p) => (
  <svg {...base} {...p}><path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const EyeIcon = (p) => (
  <svg {...base} {...p} strokeWidth="1.6"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.6"/></svg>
);
export const EyeOffIcon = (p) => (
  <svg {...base} {...p} strokeWidth="1.6"><path d="M3 3l18 18" strokeLinecap="round"/><path d="M10.6 5.6A10.6 10.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 01-3.1 3.9M6.3 7.5C4 9.1 2.5 12 2.5 12s3.5 6.5 9.5 6.5a10.4 10.4 0 004.6-1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.9 10.1a2.6 2.6 0 003.6 3.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
