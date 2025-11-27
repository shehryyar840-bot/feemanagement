// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  console.log('Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      email: 'admin@school.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create Teacher Users
  console.log('Creating teacher users...');
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@school.com' },
    update: {},
    create: {
      email: 'teacher1@school.com',
      password: hashedPassword,
      name: 'John Smith',
      role: 'TEACHER',
      isActive: true,
      teacher: {
        create: {
          employeeId: 'EMP001',
          phoneNumber: '1234567890',
          address: '123 Main St',
          qualification: 'M.Ed',
        },
      },
    },
    include: { teacher: true },
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@school.com' },
    update: {},
    create: {
      email: 'teacher2@school.com',
      password: hashedPassword,
      name: 'Jane Doe',
      role: 'TEACHER',
      isActive: true,
      teacher: {
        create: {
          employeeId: 'EMP002',
          phoneNumber: '9876543210',
          address: '456 Oak Ave',
          qualification: 'B.Ed',
        },
      },
    },
    include: { teacher: true },
  });
  console.log(`✓ Teachers created: ${teacher1.email}, ${teacher2.email}`);

  // Create Classes
  console.log('Creating classes...');
  const class1 = await prisma.class.upsert({
    where: { name: 'Class 1' },
    update: {},
    create: {
      name: 'Class 1',
      description: 'First grade',
      isActive: true,
    },
  });

  const class2 = await prisma.class.upsert({
    where: { name: 'Class 2' },
    update: {},
    create: {
      name: 'Class 2',
      description: 'Second grade',
      isActive: true,
    },
  });

  const class3 = await prisma.class.upsert({
    where: { name: 'Class 3' },
    update: {},
    create: {
      name: 'Class 3',
      description: 'Third grade',
      isActive: true,
    },
  });
  console.log(`✓ Classes created: ${class1.name}, ${class2.name}, ${class3.name}`);

  // Assign teachers to classes
  console.log('Assigning teachers to classes...');
  if (teacher1.teacher) {
    await prisma.classTeacher.upsert({
      where: {
        teacherId_classId: {
          teacherId: teacher1.teacher.id,
          classId: class1.id,
        },
      },
      update: {},
      create: {
        teacherId: teacher1.teacher.id,
        classId: class1.id,
        isPrimary: true,
      },
    });
  }

  if (teacher2.teacher) {
    await prisma.classTeacher.upsert({
      where: {
        teacherId_classId: {
          teacherId: teacher2.teacher.id,
          classId: class2.id,
        },
      },
      update: {},
      create: {
        teacherId: teacher2.teacher.id,
        classId: class2.id,
        isPrimary: true,
      },
    });
  }
  console.log('✓ Teachers assigned to classes');

  // Create Fee Structures
  console.log('Creating fee structures...');
  await prisma.feeStructure.upsert({
    where: { classId: class1.id },
    update: {},
    create: {
      classId: class1.id,
      tuitionFee: 1000,
      labFee: 200,
      libraryFee: 100,
      sportsFee: 150,
      examFee: 300,
      otherFee: 0,
      totalMonthlyFee: 1750,
    },
  });

  await prisma.feeStructure.upsert({
    where: { classId: class2.id },
    update: {},
    create: {
      classId: class2.id,
      tuitionFee: 1200,
      labFee: 250,
      libraryFee: 100,
      sportsFee: 150,
      examFee: 350,
      otherFee: 0,
      totalMonthlyFee: 2050,
    },
  });

  await prisma.feeStructure.upsert({
    where: { classId: class3.id },
    update: {},
    create: {
      classId: class3.id,
      tuitionFee: 1500,
      labFee: 300,
      libraryFee: 150,
      sportsFee: 200,
      examFee: 400,
      otherFee: 0,
      totalMonthlyFee: 2550,
    },
  });
  console.log('✓ Fee structures created');

  // Create Students
  console.log('Creating students...');
  const students = [];

  // Class 1 Students
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.student.upsert({
      where: { rollNumber: `C1-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        name: `Student ${i} Class 1`,
        fatherName: `Father ${i}`,
        rollNumber: `C1-${i.toString().padStart(3, '0')}`,
        classId: class1.id,
        phoneNumber: `98765432${i}0`,
        address: `Address ${i}`,
        tuitionFee: 1000,
        labFee: 200,
        libraryFee: 100,
        sportsFee: 150,
        examFee: 300,
        otherFee: 0,
        totalMonthlyFee: 1750,
        isActive: true,
      },
    });
    students.push(student);
  }

  // Class 2 Students
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.student.upsert({
      where: { rollNumber: `C2-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        name: `Student ${i} Class 2`,
        fatherName: `Father ${i + 5}`,
        rollNumber: `C2-${i.toString().padStart(3, '0')}`,
        classId: class2.id,
        phoneNumber: `98765432${i + 5}0`,
        address: `Address ${i + 5}`,
        tuitionFee: 1200,
        labFee: 250,
        libraryFee: 100,
        sportsFee: 150,
        examFee: 350,
        otherFee: 0,
        totalMonthlyFee: 2050,
        isActive: true,
      },
    });
    students.push(student);
  }

  // Class 3 Students
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.student.upsert({
      where: { rollNumber: `C3-${i.toString().padStart(3, '0')}` },
      update: {},
      create: {
        name: `Student ${i} Class 3`,
        fatherName: `Father ${i + 10}`,
        rollNumber: `C3-${i.toString().padStart(3, '0')}`,
        classId: class3.id,
        phoneNumber: `98765432${i + 10}0`,
        address: `Address ${i + 10}`,
        tuitionFee: 1500,
        labFee: 300,
        libraryFee: 150,
        sportsFee: 200,
        examFee: 400,
        otherFee: 0,
        totalMonthlyFee: 2550,
        isActive: true,
      },
    });
    students.push(student);
  }
  console.log(`✓ Created ${students.length} students`);

  // Create Fee Records for current month
  console.log('Creating fee records...');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonth = months[currentDate.getMonth()];

  for (const student of students) {
    const dueDate = new Date(currentYear, currentDate.getMonth(), 10);

    await prisma.feeRecord.upsert({
      where: {
        studentId_month_year: {
          studentId: student.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        month: currentMonth,
        year: currentYear,
        tuitionFee: student.tuitionFee,
        labFee: student.labFee,
        libraryFee: student.libraryFee,
        sportsFee: student.sportsFee,
        examFee: student.examFee,
        otherFee: student.otherFee,
        totalFee: student.totalMonthlyFee,
        balance: student.totalMonthlyFee,
        dueDate,
        status: 'Pending',
      },
    });
  }
  console.log(`✓ Created fee records for ${currentMonth} ${currentYear}`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin:');
  console.log('  Email: admin@school.com');
  console.log('  Password: password123');
  console.log('\nTeachers:');
  console.log('  Email: teacher1@school.com');
  console.log('  Password: password123');
  console.log('  Email: teacher2@school.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
