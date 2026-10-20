/**
 * Seed script: creates the first admin account if no admin exists yet.
 *
 *   npm run seed
 *
 * Default credentials (change them after first login):
 *   email:    admin@example.com
 *   password: Admin1234!
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

const SEED_ADMIN_EMAIL = 'admin@example.com';
const SEED_ADMIN_PASSWORD = 'Admin1234!';

async function seed() {
  const dataSource = AppDataSource;
  await dataSource.initialize();

  const usersRepo = dataSource.getRepository(User);

  const existingAdmin = await usersRepo.findOne({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log(
      `An admin already exists (${existingAdmin.email}) — nothing to seed.`,
    );
    await dataSource.destroy();
    return;
  }

  const existingByEmail = await usersRepo.findOne({
    where: { email: SEED_ADMIN_EMAIL },
  });

  if (existingByEmail) {
    existingByEmail.role = UserRole.ADMIN;
    existingByEmail.isActive = true;
    await usersRepo.save(existingByEmail);
    console.log(`Promoted existing user ${SEED_ADMIN_EMAIL} to admin.`);
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(
    SEED_ADMIN_PASSWORD,
    Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  );

  const admin = usersRepo.create({
    email: SEED_ADMIN_EMAIL,
    password: hashedPassword,
    name: 'Default Admin',
    role: UserRole.ADMIN,
    isActive: true,
  });

  await usersRepo.save(admin);
  console.log(
    `Seeded admin account: ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`,
  );
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
