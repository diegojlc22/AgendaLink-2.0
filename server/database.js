import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('server/database.db'), { verbose: console.log });

// ---- Schema Initialization ----
const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_slot TEXT NOT NULL UNIQUE,
      user_name TEXT NOT NULL,
      booked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database schema initialized.');
};

// Initialize on first load
initSchema();

// ---- Database Operations ----

/**
 * Fetches all appointments from the database.
 * @returns {Array<object>} A list of all appointments.
 */
export const getAppointments = () => {
  const stmt = db.prepare('SELECT * FROM appointments');
  return stmt.all();
};

/**
 * Creates a new appointment.
 * @param {string} timeSlot - The time slot to book (e.g., "09:00").
 * @param {string} userName - The name of the user booking the slot.
 * @returns {object} The newly created appointment.
 */
export const createAppointment = ({ timeSlot, userName }) => {
  try {
    const stmt = db.prepare('INSERT INTO appointments (time_slot, user_name) VALUES (?, ?)');
    const info = stmt.run(timeSlot, userName);
    const newAppointmentId = info.lastInsertRowid;
    const newAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(newAppointmentId);
    return newAppointment;
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`O horário ${timeSlot} já foi agendado.`);
    }
    throw error;
  }
};

/**
 * Deletes an appointment by its ID.
 * @param {number} id - The ID of the appointment to delete.
 * @returns {boolean} True if an appointment was deleted.
 */
export const deleteAppointment = (id) => {
  const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
};
