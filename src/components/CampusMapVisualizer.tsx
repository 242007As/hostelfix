import React, { useState } from 'react';
import { Building2, Layers, AlertCircle, CheckCircle, Wifi, Droplets, Zap, Wrench, ChevronRight } from 'lucide-react';
import { HostelBlockInfo, Ticket } from '../types';

interface CampusMapVisualizerProps {
  blocks: HostelBlockInfo[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicketForRoom: (block: string, floor: number, room: string) => void;
}

export const CampusMapVisualizer: React.FC<CampusMapVisualizerProps> = ({
  blocks,
  tickets,
  onSelectTicket,
  onOpenNewTicketForRoom,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0].id);
  const [selectedFloor, setSelectedFloor] = useState<number>(2);
  const [activeRoomInspect, setActiveRoomInspect] = useState<string | null>('Room 204');

  const currentBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];
  const floorData = currentBlock.floors.find((f) => f.floorNumber === selectedFloor) || currentBlock.floors[0];

  // Helper to find tickets for a room or common area in current block & floor
  const getTicketsForLocation = (roomName: string) => {
    return tickets.filter((t) => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const isSameBlock = t.hostelBlock.includes(currentBlock.code) || t.hostelBlock.includes(currentBlock.name.split('·')[0].trim());
      const isSameFloor = t.floor === selectedFloor;
      const matchesRoom =
        t.roomNumber.toLowerCase().includes(roomName.toLowerCase()) ||
        roomName.toLowerCase().includes(t.roomNumber.toLowerCase());
      return isSameBlock && isSameFloor && matchesRoom;
    });
  };

  // Inspect room tickets
  const inspectTickets = activeRoomInspect ? getTicketsForLocation(activeRoomInspect) : [];

  return (
    <div className="space-y-6">
      {/* Top Overview Strip with Campus Facade Photo */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 relative min-h-[180px] bg-slate-900">
            <img
              src="/src/assets/images/hostel_campus_facade_1793192100644.jpg"
              alt="Campus residential hall facade"
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Residential Infrastructure
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Hostel Complex Hotspot Telemetry
              </h3>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {blocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => {
                      setSelectedBlockId(block.id);
                      setSelectedFloor(Math.min(selectedFloor, block.totalFloors - 1));
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      selectedBlockId === block.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {block.name}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Click any room or wing common area on the interactive floor blueprint below to inspect open maintenance requests, trace localized infrastructure faults, or dispatch technician teams directly to the physical room.
              </p>
            </div>

            {/* Floor selector segmented buttons */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Select Floor:
              </span>
              <div className="flex items-center gap-1.5">
                {currentBlock.floors.map((fl) => (
                  <button
                    key={fl.floorNumber}
                    onClick={() => setSelectedFloor(fl.floorNumber)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      selectedFloor === fl.floorNumber
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fl.floorNumber === 0 ? 'Ground (0)' : `Floor ${fl.floorNumber}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Blueprint Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Blueprint Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {currentBlock.name} — Floor {selectedFloor === 0 ? 'Ground' : selectedFloor}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rooms 01–12 and Corridor Common Facilities
              </p>
            </div>

            {/* Blueprint Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                P0 Hazard
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                P1 High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
                P2 Standard
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 inline-block" />
                Nominal
              </span>
            </div>
          </div>

          {/* North Wing Rooms Grid */}
          <div className="space-y-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              North Wing (Rooms 01 – 06)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {floorData.rooms.slice(0, 6).map((roomNum) => {
                const roomLabel = `Room ${roomNum}`;
                const roomTickets = getTicketsForLocation(roomLabel);
                const hasP0 = roomTickets.some((t) => t.priority === 'P0');
                const hasP1 = roomTickets.some((t) => t.priority === 'P1');
                const hasP2 = roomTickets.some((t) => t.priority === 'P2');
                const isSelected = activeRoomInspect === roomLabel;

                let borderStyle = 'border-slate-200 bg-slate-50/70 hover:border-slate-400';
                if (hasP0) borderStyle = 'border-rose-400 bg-rose-50/60 text-rose-950';
                else if (hasP1) borderStyle = 'border-amber-400 bg-amber-50/60 text-amber-950';
                else if (hasP2) borderStyle = 'border-sky-300 bg-sky-50/60 text-sky-950';

                return (
                  <button
                    key={roomNum}
                    onClick={() => setActiveRoomInspect(roomLabel)}
                    className={`p-3 rounded-xl border text-left transition-all ${borderStyle} ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{roomNum}</span>
                      {roomTickets.length > 0 && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-white rounded border border-slate-300">
                          {roomTickets.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {roomTickets.length === 0 ? 'Nominal' : `${roomTickets[0].category}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Central Corridor & Common Facilities */}
            <div className="my-6 p-4 bg-slate-100/70 border border-slate-200 rounded-xl space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Common Corridor Facilities & Utilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {floorData.commonAreas.map((area) => {
                  const areaTickets = getTicketsForLocation(area);
                  const isSelected = activeRoomInspect === area;
                  const hasP0 = areaTickets.some((t) => t.priority === 'P0');
                  const hasP1 = areaTickets.some((t) => t.priority === 'P1');

                  let style = 'bg-white border-slate-200';
                  if (hasP0) style = 'bg-rose-50 border-rose-300 text-rose-950';
                  else if (hasP1) style = 'bg-amber-50 border-amber-300 text-amber-950';

                  return (
                    <button
                      key={area}
                      onClick={() => setActiveRoomInspect(area)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${style} ${
                        isSelected ? 'ring-2 ring-slate-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate">{area}</span>
                        {areaTickets.length > 0 && (
                          <span className="font-mono text-[10px] font-bold text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200 shrink-0 ml-1">
                            {areaTickets.length} active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* South Wing Rooms Grid */}
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              South Wing (Rooms 07 – 12)
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {floorData.rooms.slice(6, 12).map((roomNum) => {
                const roomLabel = `Room ${roomNum}`;
                const roomTickets = getTicketsForLocation(roomLabel);
                const hasP0 = roomTickets.some((t) => t.priority === 'P0');
                const hasP1 = roomTickets.some((t) => t.priority === 'P1');
                const hasP2 = roomTickets.some((t) => t.priority === 'P2');
                const isSelected = activeRoomInspect === roomLabel;

                let borderStyle = 'border-slate-200 bg-slate-50/70 hover:border-slate-400';
                if (hasP0) borderStyle = 'border-rose-400 bg-rose-50/60 text-rose-950';
                else if (hasP1) borderStyle = 'border-amber-400 bg-amber-50/60 text-amber-950';
                else if (hasP2) borderStyle = 'border-sky-300 bg-sky-50/60 text-sky-950';

                return (
                  <button
                    key={roomNum}
                    onClick={() => setActiveRoomInspect(roomLabel)}
                    className={`p-3 rounded-xl border text-left transition-all ${borderStyle} ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{roomNum}</span>
                      {roomTickets.length > 0 && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-white rounded border border-slate-300">
                          {roomTickets.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {roomTickets.length === 0 ? 'Nominal' : `${roomTickets[0].category}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Location Detail Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Physical Inspector
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {activeRoomInspect || 'Select a room'}
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Floor {selectedFloor}
              </span>
            </div>

            {/* List of active complaints in this selected room/facility */}
            <div className="mt-4 space-y-3">
              {inspectTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-medium text-slate-700">No active maintenance issues</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Room infrastructure verified operating nominally
                  </p>
                  <button
                    onClick={() =>
                      onOpenNewTicketForRoom(currentBlock.name, selectedFloor, activeRoomInspect || 'Room 101')
                    }
                    className="mt-3 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    + Log Issue for this Room
                  </button>
                </div>
              ) : (
                inspectTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'P0'
                            ? 'text-rose-700 bg-rose-100'
                            : t.priority === 'P1'
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-sky-800 bg-sky-100'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 line-clamp-2">
                      {t.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span className="capitalize">{t.status.replace('_', ' ')}</span>
                      <span className="flex items-center gap-0.5 text-slate-700 font-medium">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Click any complaint above to open the full triage assessment and assign maintenance staff.
          </div>
        </div>
      </div>
    </div>
  );
};
