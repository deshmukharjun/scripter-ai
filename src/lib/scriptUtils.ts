/**
 * Cleans the script to make it "HeyGen Ready" by removing all brackets,
 * special markers, and formatting instructions.
 * Returns only the natural dialogue that should be spoken.
 */
export function cleanScriptForHeyGen(script: string): string {
  let cleaned = script;

  // Remove all text in square brackets (e.g., [HOOK], [BODY], [CLOSING STATEMENT], [CTA])
  // This regex matches [ followed by any characters until ]
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');

  // Remove any remaining brackets that might be standalone
  cleaned = cleaned.replace(/\[|\]/g, '');

  // Remove common section markers and labels (case-insensitive)
  const sectionMarkers = [
    /^HOOK:?\s*/gim,
    /^BODY:?\s*/gim,
    /^CLOSING STATEMENT:?\s*/gim,
    /^CTA:?\s*/gim,
    /^CLOSING:?\s*/gim,
    /^STATEMENT:?\s*/gim,
  ];
  
  sectionMarkers.forEach(marker => {
    cleaned = cleaned.replace(marker, '');
  });

  // Clean up extra whitespace - replace multiple spaces/newlines with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Replace multiple periods, exclamation marks, or question marks with single ones
  cleaned = cleaned.replace(/\.{2,}/g, '.');
  cleaned = cleaned.replace(/!{2,}/g, '!');
  cleaned = cleaned.replace(/\?{2,}/g, '?');

  return cleaned;
}

