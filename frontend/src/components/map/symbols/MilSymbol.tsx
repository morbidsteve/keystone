import { useMemo } from 'react';
import L from 'leaflet';
import ms, { type SymbolOptions } from 'milsymbol';

export function createMilSymbolIcon(
  sidc: string,
  size: number = 35,
  statusColor?: string,
): L.Icon {
  const options: SymbolOptions = {
    size,
    frame: true,
    fill: true,
  };

  if (statusColor) {
    options.iconColor = statusColor;
    options.colorMode = statusColor;
  }

  const symbol = new ms.Symbol(sidc, options);

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
