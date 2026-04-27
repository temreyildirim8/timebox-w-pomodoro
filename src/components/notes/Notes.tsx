import React, { useState } from "react";

interface NotesProps {
  date: string;
  note: string;
  updateNote: (date: string, content: string) => void;
}

export const Notes: React.FC<NotesProps> = ({ date, note, updateNote }) => {
  const [localNote, setLocalNote] = useState(note);

  const handleBlur = () => {
    if (localNote !== note) {
      updateNote(date, localNote);
    }
  };

  return (
    <div className="notes-panel">
      <header className="notes-header animate-in delay-3">
        <h2 className="notes-title">Daily Notes</h2>
      </header>
      <div className="notes-content animate-in delay-4">
        <textarea
          placeholder="Start writing... (Brain dump, rough work, planning)"
          value={localNote || ""}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={handleBlur}
          className="notes-textarea"
        />
      </div>
    </div>
  );
};
