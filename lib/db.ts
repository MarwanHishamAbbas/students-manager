import Database from "better-sqlite3";

import type { StudentFormValues } from "@/components/student-form";

// Initialize the database
let db: Database.Database;

// This function ensures we have a database connection
function getDB() {
  if (!db) {
    // In a real app, you'd want to store this in a proper location
    // For this example, we'll use an in-memory database
    // or any other path you prefer

    db = new Database("database.db");

    // Initialize the database schema
    initDB();
  }
  return db;
}

// Initialize the database schema
function initDB() {
  const db = getDB();

  // Create students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      studentId TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      gender TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      date TEXT NOT NULL,
      isPresent INTEGER NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students (id)
    )
  `);

  // Create activities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Insert sample activities
}

// Get all students
export async function getStudents() {
  const db = getDB();
  return db.prepare("SELECT * FROM students ORDER BY firstName").all() as StudentFormValues[];
}

// Get student by ID
export async function getStudentById(id: string) {
  const db = getDB();
  return db.prepare("SELECT * FROM students WHERE id = ?").get(id);
}

// Get students by class (grade and section)
export async function getStudentsByClass(grade: string, section: string) {
  const db = getDB();
  return db.prepare("SELECT * FROM students WHERE grade = ? AND section = ? ORDER BY firstName").all(grade, section);
}

// Get student count
export async function getStudentCount() {
  const db = getDB();
  const result = db.prepare("SELECT COUNT(*) as count FROM students").get() as { count: number };
  return result.count;
}

// Get class count (unique grade-section combinations)
export async function getClassCount() {
  const db = getDB();
  const result = db.prepare("SELECT COUNT(DISTINCT grade || '-' || section) as count FROM students").get() as {
    count: number;
  };
  return result.count;
}

// Get attendance rate (percentage of present students)
export async function getAttendanceRate() {
  const db = getDB();
  const result = db
    .prepare(`
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE ROUND((SUM(isPresent) * 100.0) / COUNT(*), 1)
      END as rate
    FROM attendance
  `)
    .get() as { rate: number };

  return result.rate;
}

// Get recent activities
export async function getRecentActivities() {
  const db = getDB();
  return db.prepare("SELECT * FROM activities ORDER BY timestamp DESC LIMIT 5").all();
}

export default getDB;
