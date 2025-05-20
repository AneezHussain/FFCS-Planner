import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import FacultyPreferenceModal from './FacultyPreferenceModal';

interface CourseSlotSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    courseName: string; 
    selectedSlots: string[]; 
    credits: number; 
    facultyPreferences?: string[]; 
    includeLabCourse?: boolean; 
    facultyLabAssignments?: Map<string, string[]>;
  }) => void;
  preferredSlot: 'morning' | 'evening' | 'custom';
  existingSlots?: string[]; // Add this prop to track already selected slots
  editingCourse?: { name: string; slots: string[]; credits: number; facultyPreferences?: string[]; facultyLabAssignments?: Array<{ facultyName: string; slots: string[] }> }; // Add prop for editing
}

const CourseSlotSelector: React.FC<CourseSlotSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  preferredSlot,
  existingSlots = [], // Default to empty array if not provided
  editingCourse = undefined // Default to undefined if not provided
}) => {
  const [courseName, setCourseName] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slotText, setSlotText] = useState('');
  const [credits, setCredits] = useState(3); // Default to 3 credits
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [tempCourseData, setTempCourseData] = useState<{courseName: string; selectedSlots: string[]; credits: number} | null>(null);

  // Reset form or populate with editing data when modal is opened
  useEffect(() => {
    if (isOpen) {
      if (editingCourse) {
        // Populate form with editing data
        setCourseName(editingCourse.name);
        setSelectedSlots(editingCourse.slots);
        setCredits(editingCourse.credits);
        setSlotText(editingCourse.slots.join('+'));
      } else {
        // Reset form for new entry
        setCourseName('');
        setSelectedSlots([]);
        setCredits(3);
        setSlotText('');
      }
      setTempCourseData(null);
    }
  }, [isOpen, editingCourse]);

  // Slot patterns - only theory slots
  const morningTheorySlots = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'TA1', 'TB1', 'TC1', 'TD1', 'TE1', 'TF1', 'TG1', 'TAA1', 'TCC1'];
  const eveningTheorySlots = ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'TA2', 'TB2', 'TC2', 'TD2', 'TE2', 'TF2', 'TAA2', 'TBB2', 'TCC2', 'TDD2'];

  // Function to parse slot text and identify valid slots
  const parseSlotText = (text: string) => {
    // Split the input by + or space or comma
    const inputSlots = text.split(/[+\s,]+/).filter(Boolean);
    const allValidSlots = [...morningTheorySlots, ...eveningTheorySlots];
    
    // Filter to get only valid slots
    const validSlots = inputSlots.filter(slot => allValidSlots.includes(slot));
    
    // Update the selected slots
    setSelectedSlots(validSlots);
  };

  const toggleSlot = (slot: string) => {
    // Don't allow selecting already taken slots, unless it's part of the course being edited
    if (isSlotTaken(slot) && !(editingCourse && editingCourse.slots.includes(slot))) return;
    
    const newSelectedSlots = selectedSlots.includes(slot)
      ? selectedSlots.filter(s => s !== slot)
      : [...selectedSlots, slot];
    
    setSelectedSlots(newSelectedSlots);
    setSlotText(newSelectedSlots.join('+'));
  };

  // Function to check if a slot is already taken in other courses
  const isSlotTaken = (slot: string) => {
    // If we're editing a course, don't consider its own slots as taken
    if (editingCourse && editingCourse.slots.includes(slot)) {
      return false;
    }

    // Check if the slot is already taken by another course
    return existingSlots.includes(slot);
  };

  const handleCourseDetailSubmit = () => {
    if (courseName && selectedSlots.length > 0) {
      // Store course data and open faculty modal
      setTempCourseData({
        courseName,
        selectedSlots,
        credits
      });
      setIsFacultyModalOpen(true);
    }
  };

  const handleSkipFaculty = () => {
    if (courseName && selectedSlots.length > 0) {
      // Submit course without faculty preferences
      // For editing, preserve existing faculty preferences if available
      onSubmit({
        courseName,
        selectedSlots,
        credits,
        facultyPreferences: editingCourse?.facultyPreferences || [],
        includeLabCourse: false
      });
      
      // Reset states and close modal
      resetForm();
      onClose();
    }
  };

  const handleFacultyPreferenceSubmit = (
    facultyPreferencesFromModal: string[], 
    includeLabCourse?: boolean, 
    facultyLabAssignmentsFromModal?: Map<string, string[]>
  ) => {
    if (tempCourseData) { 
      onSubmit({
        ...tempCourseData,
        facultyPreferences: facultyPreferencesFromModal,
        includeLabCourse: includeLabCourse, 
        facultyLabAssignments: facultyLabAssignmentsFromModal
      });
      
      resetForm();
      setIsFacultyModalOpen(false);
    }
  };

  const handleCloseModal = () => {
    // Just close without saving any changes
    resetForm();
    onClose();
  };

  const handleFacultyModalClose = () => {
    // Close faculty modal without saving changes
    setIsFacultyModalOpen(false);
    setTempCourseData(null);
  };

  const resetForm = () => {
    setCourseName('');
    setSelectedSlots([]);
    setCredits(3);
    setSlotText('');
    setTempCourseData(null);
  };

  // Get slot rows based on the preferred slot
  const getSlotRows = () => {
    const slots = preferredSlot === 'evening' ? eveningTheorySlots : morningTheorySlots;
    
    // Create rows of 5 slots each for consistent layout
    const rows = [];
    for (let i = 0; i < slots.length; i += 5) {
      rows.push(slots.slice(i, i + 5));
    }
    return rows;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${isFacultyModalOpen ? 'hidden' : ''}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-sm" onClick={handleCloseModal}></div>
        <div className="bg-white rounded-2xl p-6 w-[800px] max-h-[90vh] overflow-y-auto z-10 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Enter Course Details</h2>
            <button 
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Course Name and Credits Input */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter course name"
              />
            </div>
            
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credits
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setCredits(prev => Math.max(1, prev - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-lg transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={credits}
                  onChange={(e) => setCredits(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center border-x border-gray-300 py-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max="5"
                />
                <button
                  onClick={() => setCredits(prev => Math.min(5, prev + 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Slot Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slot Pattern (e.g., A1+TG1)
            </label>
            <input
              type="text"
              value={slotText}
              onChange={(e) => {
                setSlotText(e.target.value);
                parseSlotText(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter slot pattern (e.g., A1+TG1)"
            />
          </div>

          {/* Slots Grid */}
          <div className="mb-6">
            {getSlotRows().map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 mb-2">
                {row.map(slot => (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    disabled={isSlotTaken(slot)}
                    className={`
                      flex-1 p-3 rounded-lg text-sm font-medium transition-all
                      ${selectedSlots.includes(slot)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isSlotTaken(slot)
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-70'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {editingCourse ? (
              // Show only confirm/cancel when editing
              <>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSkipFaculty()}
                  disabled={!courseName || selectedSlots.length === 0}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors
                    ${courseName && selectedSlots.length > 0
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  Confirm
                </button>
              </>
            ) : (
              // Show regular options for new course creation
              <>
                <button
                  onClick={handleSkipFaculty}
                  disabled={!courseName || selectedSlots.length === 0}
                  className={`
                    px-4 py-3 text-sm font-medium transition-colors
                    ${courseName && selectedSlots.length > 0
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  Skip Faculty
                </button>
                <button
                  onClick={handleCourseDetailSubmit}
                  disabled={!courseName || selectedSlots.length === 0}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors
                    ${courseName && selectedSlots.length > 0
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  Add Faculty
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Faculty Preference Modal */}
      {tempCourseData && (
        <FacultyPreferenceModal
          isOpen={isFacultyModalOpen}
          onClose={handleFacultyModalClose}
          onSubmit={handleFacultyPreferenceSubmit}
          courseName={`${tempCourseData.courseName} ${tempCourseData.selectedSlots.join('+')}`}
          initialFacultyPreferences={editingCourse?.facultyPreferences || []}
        />
      )}
    </>
  );
};

export default CourseSlotSelector; 
