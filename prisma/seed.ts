import { PrismaClient, Role, UserStatus, DeviceCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Initial Users
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const techPassword = process.env.SEED_TECH_PASSWORD || 'Tech@123456';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123456';

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const techHash = await bcrypt.hash(techPassword, 12);
  const customerHash = await bcrypt.hash(customerPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@amanuelrepair.com' },
    update: {
      name: 'Amanuel Admin',
      phone: '+251914131094',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Amanuel Admin',
      email: 'admin@amanuelrepair.com',
      phone: '+251914131094',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'kalilhida24@gmail.com' },
    update: {
      name: 'Amanuel (Owner)',
      phone: '+251914131094',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Amanuel (Owner)',
      email: 'kalilhida24@gmail.com',
      phone: '+251914131094',
      passwordHash: adminHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@amanuelrepair.com' },
    update: {
      name: 'Dawit Technician',
      phone: '+251911000002',
      passwordHash: techHash,
      role: Role.TECHNICIAN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Dawit Technician',
      email: 'tech@amanuelrepair.com',
      phone: '+251911000002',
      passwordHash: techHash,
      role: Role.TECHNICIAN,
      status: UserStatus.ACTIVE,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@amanuelrepair.com' },
    update: {
      name: 'Bethlehem Customer',
      phone: '+251911000003',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Bethlehem Customer',
      email: 'customer@amanuelrepair.com',
      phone: '+251911000003',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Seeded Users: ${admin.email}, ${tech.email}, ${customer.email}`);

  // 2. Initial Services (2 per DeviceCategory + 1 deactivated service to test FR-17)
  const services = [
    // MOBILE_PHONE
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Smartphone Screen Replacement',
      description: 'Full LCD/OLED and digitizer replacement for mobile phones',
      category: DeviceCategory.MOBILE_PHONE,
      indicativePrice: 2500.00,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Smartphone Battery Replacement',
      description: 'OEM grade battery replacement with calibration and warranty',
      category: DeviceCategory.MOBILE_PHONE,
      indicativePrice: 1500.00,
      isActive: true,
    },
    // TABLET
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Tablet Touchscreen & LCD Repair',
      description: 'Front glass, digitizer, and display assembly replacement for tablets',
      category: DeviceCategory.TABLET,
      indicativePrice: 3500.00,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Tablet Charging Port & Power Service',
      description: 'Micro-USB / USB-C charge port board replacement and power diagnostics',
      category: DeviceCategory.TABLET,
      indicativePrice: 2000.00,
      isActive: true,
    },
    // LAPTOP
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Laptop OS & Software Diagnostics',
      description: 'Operating system reinstallation, malware eradication, and performance tuning',
      category: DeviceCategory.LAPTOP,
      indicativePrice: 1200.00,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Laptop Keyboard & Screen Replacement',
      description: 'Internal backlit/non-backlit keyboard and high-resolution laptop panel repair',
      category: DeviceCategory.LAPTOP,
      indicativePrice: 4500.00,
      isActive: true,
    },
    // DESKTOP_COMPUTER
    {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Desktop Deep Cleaning & Thermal Re-paste',
      description: 'Comprehensive dust clean-out, fan lubrication, and high-performance CPU thermal paste',
      category: DeviceCategory.DESKTOP_COMPUTER,
      indicativePrice: 1800.00,
      isActive: true,
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Desktop Motherboard / Power Supply Repair',
      description: 'Component-level motherboard repair and PSU fault diagnosis/replacement',
      category: DeviceCategory.DESKTOP_COMPUTER,
      indicativePrice: 5500.00,
      isActive: true,
    },
    // Deactivated service (FR-17 testing)
    {
      id: '00000000-0000-0000-0000-000000000009',
      name: 'Legacy Feature Phone Flashing & Firmware Unlock',
      description: 'Deactivated legacy service for testing service catalog deactivation behavior',
      category: DeviceCategory.MOBILE_PHONE,
      indicativePrice: 800.00,
      isActive: false,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        name: service.name,
        description: service.description,
        category: service.category,
        indicativePrice: service.indicativePrice,
        isActive: service.isActive,
      },
      create: service,
    });
  }
  console.log(`Seeded Services: ${services.length} records`);

  // 3. Initial Inventory Parts (including 1 below reorderThreshold to test FR-46)
  const parts = [
    {
      name: 'Universal 6.5-inch OLED Display Panel',
      sku: 'DISP-OLED-65',
      quantity: 15,
      reorderThreshold: 5,
      unitCost: 1850.00,
    },
    {
      name: 'Standard 4000mAh Li-ion Battery',
      sku: 'BATT-LI-4000',
      quantity: 20,
      reorderThreshold: 8,
      unitCost: 950.00,
    },
    {
      name: 'DDR4 8GB 3200MHz Laptop RAM',
      sku: 'RAM-DDR4-8G',
      quantity: 12,
      reorderThreshold: 4,
      unitCost: 1400.00,
    },
    {
      // quantity (2) < reorderThreshold (5) to test FR-46 low stock alerts
      name: 'M.2 NVMe SSD 512GB High-Speed',
      sku: 'SSD-NVME-512G',
      quantity: 2,
      reorderThreshold: 5,
      unitCost: 2200.00,
    },
  ];

  for (const part of parts) {
    await prisma.inventoryPart.upsert({
      where: { sku: part.sku },
      update: {
        name: part.name,
        quantity: part.quantity,
        reorderThreshold: part.reorderThreshold,
        unitCost: part.unitCost,
      },
      create: part,
    });
  }
  console.log(`Seeded Inventory Parts: ${parts.length} records`);

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error in database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
