import { useMemo } from 'react';
import L from 'leaflet';
import ms from 'milsymbol';

export function createMilSymbolIcon(
  sidc: string,
  size: number = 35,
  statusColor?: string,
): L.Icon {
  // Pad SIDC to 15 characters if shorter (MIL-STD-2525B requirement)
  const paddedSidc = sidc.length < 15 ? sidc.padEnd(15, '-') : sidc;

  const options: Record<string, unknown> = {
    size,
    frame: true,
    fill: true,
  };

  // Use monoColor for status overlay — colors the entire symbol
  if (statusColor) {
    options.monoColor = statusColor;
  }

  const symbol = new ms.Symbol(paddedSidc, options);

  const anchor = symbol.getAnchor();

  return L.icon({
    iconUrl: symbol.toDataURL(),
    iconSize: [symbol.getSize().width, symbol.getSize().height],
    iconAnchor: [anchor.x, anchor.y],
    popupAnchor: [0, -anchor.y],
  });
}

export function useMilSymbolIcon(
  sidc: string,
  size?: number,
  statusColor?: string,
): L.Icon {
  return useMemo(
    () => createMilSymbolIcon(sidc, size, statusColor),
    [sidc, size, statusColor],
  );
}
