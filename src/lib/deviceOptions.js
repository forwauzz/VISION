/**
 * Vision — Device type options for capture hardware.
 * Matches stitch_device_management design (iPhone 17 Pro, Vuzix, etc.).
 */

export const DEVICE_OPTIONS = [
  { id: 'iphone-17-pro', label: 'iPhone 17 Pro', description: 'Mobile Capture Unit' },
  { id: 'android', label: 'Android', description: 'Mobile Capture' },
  { id: 'vuzix-head-mount', label: 'Vuzix Head Mount', description: 'AR Visualization' },
  { id: '4k-surgical-webcam', label: '4K Surgical Webcam', description: 'Fixed Point Imaging' },
  { id: 'gopro-hero-12', label: 'GoPro Hero 12', description: 'Auxiliary View' },
  { id: 'vision-smart-glasses', label: 'Vision Smart Glasses', description: 'Proprietary Optical Unit' },
]

/** Display metadata for device cards on Device Management page. */
export const DEVICE_CARDS = [
  { id: 'iphone-17-pro', label: 'iPhone 17 Pro', description: 'Mobile Capture Unit', status: 'online', batteryDisplay: '85%', batteryIcon: 'battery_5_bar', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcnI6XgV6DTftOk-UvQbBZzXmLrqTiNZl7cFJv-tZFXm6qmxwcJHY9EI7w19DsrBtGhohHQrbiLv2LnXqB919SnXeEtL_n2f5yrhw4eayBjqb583Jm0KUwEgv3cDNXvBuCfbczPZ5vp5f_KXHVOD2mNOBPeyR4rnJN299WcIGMVXdeGJSmaiEW9Hn6P2dsQJEmAwtINw13jF4i079RRDSfr4DuHqKkqkpRQg1KYteIXA2f41uV1wQtEp9IOc8qhNpQiykMkJmBkOw' },
  { id: 'vuzix-head-mount', label: 'Vuzix Head Mount', description: 'AR Visualization', status: 'online', batteryDisplay: '42%', batteryIcon: 'battery_2_bar', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNfJgVT-kyu3AGfBLe8B-SIXCbX1xY2_twzRZ7M5fQeSACgM2oNQ88u0XYlqPdob-v3WuaZaXfz4kgG4--VLt6XtSfc-hjTO4wEHz0-vdtErxDYM9rAGiCG2BNkCOZbIMo0eYC2ZylcGZ4fQqG-Nw3fApHwbsXWzRopZFEt5KTINufx7z6B-7-oFoB447yiVIi8Rvr33vkeSPuCmvTMkZpqmDKk5dMQ0yumDakbf1f5WrF_HsK7XYIj703MyAURPfUDUDwT-z8iGg' },
  { id: '4k-surgical-webcam', label: '4K Surgical Webcam', description: 'Fixed Point Imaging', status: 'online', batteryDisplay: 'Wired', batteryIcon: 'power', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvslNjsCYMiEJ4N9Ml1rRj9MxwNjv9y77JxtSzhCR_jN7HSPdbRy52GkUCsnm8bwdi-o3JlUMB9mDxBwSDh1sUFfda2se_BbGCVsftbtVhNv4D8imFqZeDe1aOylld4_nx3rC348j-wb4ns0zYWDrKBZ21i-3Zo59Vmqb3pHB80L5OAKDgKGAxeC1IfIu-3XXSW8ooIUYBzlMfB4xwdu52ty1blP3K5uGW-jl782aY9Ier0roMYOvmpNGZObMauXVhL-EWj5BPXKg' },
  { id: 'gopro-hero-12', label: 'GoPro Hero 12', description: 'Auxiliary View', status: 'offline', batteryDisplay: 'N/A', batteryIcon: 'battery_unknown', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGz6EhmXG1cW2rLy3C15yHB9KoB7Ui4FD8RMVfpYMxEDs9XrRXm7NglVwLKB1yiCC9xBx4_aU5dxqZoP6BlvQMj5exokAF8W-kEYQU1YQ3Mth3TAUYevL1sHPT2y1Y_YmXYIDa2GOqeIC9Pw6l276r_CjywzzHSgnrTA7KD3x3Y15kX6iF60YVopm4XmQiJiiaXJgmhKemxLlyt9Z9Op-narXIkpptO8KlPB7ygBFYTpPth4l9g9ebjZRj-9Nu-sXm0bjmLkM0CW8' },
  { id: 'vision-smart-glasses', label: 'Vision Smart Glasses', description: 'Proprietary Optical Unit', status: 'pairing', batteryDisplay: '---', batteryIcon: 'settings_input_antenna', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtA-TBBx-dbl67YhrjrR8JJYBpANdsZloe8oCJzpo55szzFFiwt2kB78nGlSfxNh2l2khwGSw29q0NREp1eVHP2dN_BlME6UAFzMpdCgnqlcaZyTNbEIfPCNRUmcDHPPbfucomdjpBWpl92qY4iXmfxzajQssLKDIutuFRT61CSpj-jfdpVXy7Zl0u9TFCPjkP4vBm6BL_ffKV_KzZUcp1-bDs2eCKULH8rMi1XtmPSDA2mzvOeUBiNUQqftIQtr4fTNzRgXfeie4' },
]
