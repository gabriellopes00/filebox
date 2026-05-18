export function hexToBase64(hex: string): string {
  return btoa(
    String.fromCharCode(...new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))))
  )
}
