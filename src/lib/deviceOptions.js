/**
 * Vision — Device type options for capture hardware.
 * Matches stitch_device_management design (iPhone 17 Pro, Vuzix, etc.).
 */

export const DEVICE_OPTIONS = [
  { id: 'iphone-17-pro', label: 'iPhone 17 Pro', description: 'Mobile Capture Unit' },
  { id: 'vuzix-head-mount', label: 'Vuzix Head Mount', description: 'AR Visualization' },
  { id: '4k-surgical-webcam', label: '4K Surgical Webcam', description: 'Fixed Point Imaging' },
  { id: 'gopro-hero-12', label: 'GoPro Hero 12', description: 'Auxiliary View' },
  { id: 'vision-smart-glasses', label: 'Vision Smart Glasses', description: 'Proprietary Optical Unit' },
]
