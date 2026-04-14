import { Marker, Popup } from 'react-leaflet';
import { useMemo } from 'react';
import { createVehicleIcon } from '../icons/VehicleIconFactory';
import type { ConvoyVehicleDetail } from '@/api/map';
import { useMapStore } from '@/stores/mapStore';
import VehiclePopupContent from './VehiclePopupContent';

interface ConvoyVehicleMarkerProps {
  vehicle: ConvoyVehicleDetail;
  convoyId: string;
  convoyName: string;
  isLeadVehicle: boolean;
}

export default function ConvoyVehicleMarker({
  vehicle,
  convoyId,
  convoyName,
  isLeadVehicle,
}: ConvoyVehicleMarkerProps) {
  const selectEntity = useMapStore((s) => s.selectEntity);

  const icon = useMemo(
    () =>
      createVehicleIcon({
        type: vehicle.vehicleType,
        status: vehicle.status,
        heading: vehicle.heading,
        bumperNumber: vehicle.bumperNumber,
        isLead: isLeadVehicle,
      }),
    [vehicle.vehicleType, vehicle.status, vehicle.heading, vehicle.bumperNumber, isLeadVehicle],
  );

  return (
    <Marker
      position={[vehicle.position.lat, vehicle.position.lon]}
      icon={icon}
      eventHandlers={{
        click: () => {
          selectEntity('convoy_vehicle' as any, vehicle.vehicleId, {
            ...vehicle,
            convoyId,
            convoyName,
          });
        },
      }}
    >
      <Popup className="keystone-popup" maxWidth={340} minWidth={280}>
        <VehiclePopupContent
          vehicle={vehicle}
          convoyId={convoyId}
          convoyName={convoyName}
        />
      </Popup>
    </Marker>
  );
}
