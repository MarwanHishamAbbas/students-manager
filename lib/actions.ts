"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import getDB from "./db";

// Add a new student
export async function addStudent(data: any) {
  const db = getDB();

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  // Insert the student
  db.prepare(`
    INSERT INTO students (id, firstName, lastName, studentId, grade, section, gender, dateOfBirth, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.firstName,
    data.lastName,
    data.studentId,
    data.grade,
    data.section,
    data.gender,
    data.dateOfBirth,
    createdAt,
  );

  // Log the activity
  const activityId = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, description, timestamp)
    VALUES (?, ?, ?)
  `).run(activityId, `Added new student: ${data.firstName} ${data.lastName}`, new Date().toISOString());

  revalidatePath("/students");
  revalidatePath("/");
}

// Delete a student
export async function deleteStudent(formData: FormData) {
  const db = getDB();
  const id = formData.get("id") as string;

  // Get student info before deleting
  const student = db.prepare("SELECT firstName, lastName FROM students WHERE id = ?").get(id) as any;

  // Delete the student
  db.prepare("DELETE FROM students WHERE id = ?").run(id);

  // Log the activity
  const activityId = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, description, timestamp)
    VALUES (?, ?, ?)
  `).run(activityId, `Deleted student: ${student.firstName} ${student.lastName}`, new Date().toISOString());

  revalidatePath("/students");
  revalidatePath("/");
}

// Get students by class for attendance
export async function getStudentsByClass(grade: string, section: string) {
  const db = getDB();
  return db.prepare("SELECT * FROM students WHERE grade = ? AND section = ? ORDER BY firstName").all(grade, section);
}

// Save attendance
export async function saveAttendance(attendanceData: any[]) {
  const db = getDB();

  // Begin transaction
  const transaction = db.transaction(() => {
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (id, studentId, date, isPresent)
      VALUES (?, ?, ?, ?)
    `);

    for (const record of attendanceData) {
      const id = uuidv4();
      insertAttendance.run(id, record.studentId, record.date, record.isPresent ? 1 : 0);
    }

    // Log the activity
    const activityId = uuidv4();
    db.prepare(`
      INSERT INTO activities (id, description, timestamp)
      VALUES (?, ?, ?)
    `).run(
      activityId,
      `Took attendance for ${attendanceData.length} students on ${attendanceData[0].date}`,
      new Date().toISOString(),
    );
  });

  // Execute the transaction
  transaction();

  revalidatePath("/attendance");
  revalidatePath("/");
}

// Generate student report
export async function generateStudentReport(studentId: string) {
  const db = getDB();

  // Get student data
  const student = db
    .prepare(`
    SELECT * FROM students WHERE studentId = ?
  `)
    .get(studentId) as any;

  if (!student) {
    throw new Error("Student not found");
  }

  // Get attendance data
  const attendance = db
    .prepare(`
    SELECT a.* FROM attendance a
    JOIN students s ON a.studentId = s.id
    WHERE s.studentId = ?
    ORDER BY a.date DESC
  `)
    .all(studentId) as any[];

  // In a real app, you would generate a PDF here
  // For this example, we'll just log the activity

  // Log the activity
  const activityId = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, description, timestamp)
    VALUES (?, ?, ?)
  `).run(activityId, `Generated student report for ${student.firstName} ${student.lastName}`, new Date().toISOString());

  revalidatePath("/reports");
  revalidatePath("/");

  // In a real app, you would return the PDF or a download link
  return {
    success: true,
    message: "Report generated successfully",
    attendance,
  };
}

// Generate attendance report
export async function generateAttendanceReport(grade: string, section: string, startDate: string, endDate: string) {
  const db = getDB();

  // Get students in the class
  const students = db
    .prepare(`
    SELECT * FROM students WHERE grade = ? AND section = ? ORDER BY firstName
  `)
    .all(grade, section) as any[];

  if (students.length === 0) {
    throw new Error("No students found in this class");
  }

  // Get attendance data for the date range
  const attendanceData = db
    .prepare(`
    SELECT a.*, s.firstName, s.lastName, s.studentId as studentIdNumber
    FROM attendance a
    JOIN students s ON a.studentId = s.id
    WHERE s.grade = ? AND s.section = ? AND a.date BETWEEN ? AND ?
    ORDER BY a.date, s.firstName
  `)
    .all(grade, section, startDate, endDate) as any[];

  // In a real app, you would generate a PDF here
  // For this example, we'll just log the activity

  // Log the activity
  const activityId = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, description, timestamp)
    VALUES (?, ?, ?)
  `).run(
    activityId,
    `Generated attendance report for Grade ${grade} Section ${section} (${startDate} to ${endDate})`,
    new Date().toISOString(),
  );

  revalidatePath("/reports");
  revalidatePath("/");

  // In a real app, you would return the PDF or a download link
  return {
    success: true,
    message: "Report generated successfully",
    attendanceData,
  };
}
