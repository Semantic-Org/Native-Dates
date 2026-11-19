// decimal kB (1000 bytes) to match build size output
export const formatSizeBytes = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
