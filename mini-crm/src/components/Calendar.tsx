import { useState } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarProps {
  onSchedule: (date: string, time: string) => void;
  onCancel: () => void;
}

export default function InlineCalendar({ onSchedule, onCancel }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Schedule Meeting
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Select Date</label>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {getNextWeekDates().map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  selectedDate === date.toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Select Time</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-2 text-xs rounded-lg border transition-colors ${
                  selectedTime === time
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onSchedule(selectedDate, selectedTime)}
            disabled={!selectedDate || !selectedTime}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Check className="h-3 w-3 mr-1" />
            Schedule
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}