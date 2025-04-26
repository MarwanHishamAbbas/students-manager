import Database from "better-sqlite3";

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

export default getDB;
