import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  ConvoyVehicle,
  ConvoyPersonnelAssignment,
  PersonnelSummary,
  VehicleAllocation,
} from '@/lib/types';
import { ConvoyRole } from '@/lib/types';
import { mockApi } from '@/api/mockClient';

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface PersonnelState {
  personnelRoles: { role: string; count: number }[];
  setPersonnelRoles: React.Dispatch<React.SetStateAction<{ role: string; count: number }[]>>;
  personnelMode: 'summary' | 'detailed';
  setPersonnelMode: (mode: 'summary' | 'detailed') => void;
  convoyVehicles: ConvoyVehicle[];
  setConvoyVehicles: React.Dispatch<React.SetStateAction<ConvoyVehicle[]>>;
  unassignedPersonnel: ConvoyPersonnelAssignment[];
  setUnassignedPersonnel: React.Dispatch<React.SetStateAction<ConvoyPersonnelAssignment[]>>;
  personnelSearchQuery: string;
  setPersonnelSearchQuery: (q: string) => void;
  personnelSearchResults: PersonnelSummary[];
  setPersonnelSearchResults: (results: PersonnelSummary[]) => void;
  personnelSearchLoading: boolean;
  assignTargetVehicleId: string | null;
  setAssignTargetVehicleId: (id: string | null) => void;
  showRoleSelector: string | null;
  setShowRoleSelector: (id: string | null) => void;
  totalDetailedPersonnel: number;
  handleAssignPersonnel: (person: PersonnelSummary, vehicleId: string | null, role: ConvoyRole) => void;
  handleRemoveAssignedPersonnel: (assignmentId: string, vehicleId: string | null) => void;
  handleUpdateConvoyVehicle: (vehicleId: string, field: 'bumperNumber' | 'callSign', value: string) => void;
  resetPersonnel: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePersonnel(vehicleAllocations: VehicleAllocation[]): PersonnelState {
  const [personnelRoles, setPersonnelRoles] = useState<{ role: string; count: number }[]>([]);
  const [personnelMode, setPersonnelMode] = useState<'summary' | 'detailed'>('summary');
  const [convoyVehicles, setConvoyVehicles] = useState<ConvoyVehicle[]>([]);
  const [unassignedPersonnel, setUnassignedPersonnel] = useState<ConvoyPersonnelAssignment[]>([]);
  const [personnelSearchQuery, setPersonnelSearchQuery] = useState('');
  const [personnelSearchResults, setPersonnelSearchResults] = useState<PersonnelSummary[]>([]);
  const [personnelSearchLoading, setPersonnelSearchLoading] = useState(false);
  const [assignTargetVehicleId, setAssignTargetVehicleId] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Sync convoy vehicles from vehicleAllocations when switching to detailed
  // ---------------------------------------------------------------------------

  const expandedConvoyVehicles = useMemo<ConvoyVehicle[]>(() => {
    const result: ConvoyVehicle[] = [];
    for (const alloc of vehicleAllocations) {
      for (let i = 0; i < alloc.quantity; i++) {
        const existing = convoyVehicles.find(
          cv => cv.vehicleType === alloc.type && cv.sequenceNumber === i + 1,
        );
        if (existing) {
          result.push(existing);
        } else {
          result.push({
            id: `cv-${alloc.type}-${i}`,
            movementId: '',
            vehicleType: alloc.type,
            tamcn: alloc.tamcn,
            bumperNumber: '',
            callSign: '',
            sequenceNumber: i + 1,
            assignedPersonnel: [],
          });
        }
      }
    }
    return result;
  }, [vehicleAllocations, convoyVehicles]);

  useEffect(() => {
    if (personnelMode === 'detailed') {
      setConvoyVehicles(prev => {
        const merged: ConvoyVehicle[] = [];
        for (const expanded of expandedConvoyVehicles) {
          const match = prev.find(
            p => p.vehicleType === expanded.vehicleType && p.sequenceNumber === expanded.sequenceNumber,
          );
          if (match) {
            merged.push(match);
          } else {
            merged.push(expanded);
          }
        }
        return merged;
      });
    }
  }, [personnelMode, expandedConvoyVehicles]);

  // ---------------------------------------------------------------------------
  // Personnel search (debounced)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (personnelSearchQuery.length < 2) {
      setPersonnelSearchResults([]);
      return;
    }
    setPersonnelSearchLoading(true);
    const timer = setTimeout(() => {
      mockApi.searchPersonnel(personnelSearchQuery).then(results => {
        setPersonnelSearchResults(results);
        setPersonnelSearchLoading(false);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [personnelSearchQuery]);

  // ---------------------------------------------------------------------------
  // Personnel handlers
  // ---------------------------------------------------------------------------

  const handleAssignPersonnel = useCallback(
    (person: PersonnelSummary, vehicleId: string | null, role: ConvoyRole) => {
      const assignment: ConvoyPersonnelAssignment = {
        id: `cpa-${person.id}-${Date.now()}`,
        movementId: '',
        personnelId: person.id,
        convoyVehicleId: vehicleId || undefined,
        role,
        personnel: person,
      };

      if (vehicleId) {
        setConvoyVehicles(prev =>
          prev.map(cv =>
            cv.id === vehicleId
              ? { ...cv, assignedPersonnel: [...cv.assignedPersonnel, assignment] }
              : cv,
          ),
        );
      } else {
        setUnassignedPersonnel(prev => [...prev, assignment]);
      }

      setPersonnelSearchQuery('');
      setPersonnelSearchResults([]);
      setAssignTargetVehicleId(null);
      setShowRoleSelector(null);
    },
    [],
  );

  const handleRemoveAssignedPersonnel = useCallback(
    (assignmentId: string, vehicleId: string | null) => {
      if (vehicleId) {
        setConvoyVehicles(prev =>
          prev.map(cv =>
            cv.id === vehicleId
              ? { ...cv, assignedPersonnel: cv.assignedPersonnel.filter(a => a.id !== assignmentId) }
              : cv,
          ),
        );
      } else {
        setUnassignedPersonnel(prev => prev.filter(a => a.id !== assignmentId));
      }
    },
    [],
  );

  const handleUpdateConvoyVehicle = useCallback(
    (vehicleId: string, field: 'bumperNumber' | 'callSign', value: string) => {
      setConvoyVehicles(prev =>
        prev.map(cv => (cv.id === vehicleId ? { ...cv, [field]: value } : cv)),
      );
    },
    [],
  );

  const totalDetailedPersonnel = useMemo(() => {
    const vehicleAssigned = convoyVehicles.reduce(
      (sum, cv) => sum + cv.assignedPersonnel.length,
      0,
    );
    return vehicleAssigned + unassignedPersonnel.length;
  }, [convoyVehicles, unassignedPersonnel]);

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  const resetPersonnel = useCallback(() => {
    setPersonnelRoles([]);
    setPersonnelMode('summary');
    setConvoyVehicles([]);
    setUnassignedPersonnel([]);
    setPersonnelSearchQuery('');
    setPersonnelSearchResults([]);
    setAssignTargetVehicleId(null);
    setShowRoleSelector(null);
  }, []);

  return {
    personnelRoles,
    setPersonnelRoles,
    personnelMode,
    setPersonnelMode,
    convoyVehicles,
    setConvoyVehicles,
    unassignedPersonnel,
    setUnassignedPersonnel,
    personnelSearchQuery,
    setPersonnelSearchQuery,
    personnelSearchResults,
    setPersonnelSearchResults,
    personnelSearchLoading,
    assignTargetVehicleId,
    setAssignTargetVehicleId,
    showRoleSelector,
    setShowRoleSelector,
    totalDetailedPersonnel,
    handleAssignPersonnel,
    handleRemoveAssignedPersonnel,
    handleUpdateConvoyVehicle,
    resetPersonnel,
  };
}
