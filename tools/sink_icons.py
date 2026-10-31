"""Tiny lucide-style inline SVG icons for demos (stroke=currentColor, aria-hidden)."""
P = {
 "search": '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', "terminal": '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
 "file": '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>', "check": '<path d="M20 6 9 17l-5-5"/>',
 "x": '<path d="M18 6 6 18M6 6l12 12"/>', "brain": '<path d="M12 5a3 3 0 1 0-6 0 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 1 0 6 0zM12 5a3 3 0 1 1 6 0 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 1 1-6 0z"/>',
 "tool": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>', "link": '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
 "home": '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', "inbox": '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
 "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', "settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 9h.1a2 2 0 1 1 0 4z"/>',
 "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 "chart": '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>', "folder": '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 "panel": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>', "plus": '<path d="M12 5v14M5 12h14"/>', "send": '<path d="M12 19V5M5 12l7-7 7 7"/>',
 "clip": '<path d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L16 7"/>', "copy": '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 "thumb": '<path d="M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.4 21H7V10l4-8a3 3 0 0 1 4 3.9"/>', "retry": '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
 "book": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5"/>', "logo": '<path d="M12 2 3 7v10l9 5 9-5V7z"/>',
 "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', "bot": '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4M8 14h.01M16 14h.01"/>',
 "git": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="9" r="3"/><path d="M6 9v6M18 12a6 6 0 0 1-6 6H9"/>', "alert": '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
 "flag": '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
 "google": '<path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5z" fill="currentColor" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10 10 0 0 0 12 22z" fill="currentColor" stroke="none" opacity=".75"/><path d="M6.2 13.7a6 6 0 0 1 0-3.4V7.6H2.8a10 10 0 0 0 0 8.8z" fill="currentColor" stroke="none" opacity=".55"/><path d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 2.8 7.6l3.4 2.7C7 7.8 9.3 6 12 6z" fill="currentColor" stroke="none" opacity=".9"/>',
 "apple": '<path d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.8A4.8 4.8 0 0 0 4 9.4c-1.7 3-.4 7.4 1.3 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.5-3.9zM14 5.2A4.3 4.3 0 0 0 15 2a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3.1A3.6 3.6 0 0 0 14 5.2z" fill="currentColor" stroke="none"/>',
 "github": '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.7 16 2.5a13.4 13.4 0 0 0-7 0C6.3.7 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.5 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22"/>',
}
def I(name, size=16):
    return f'<svg data-ui-part="icon" aria-hidden="true" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{P[name]}</svg>'
