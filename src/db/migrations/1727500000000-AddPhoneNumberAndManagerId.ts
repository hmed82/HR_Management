import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Brings the SQLite schema up to date with the current entities:
 *  1. users.phoneNumber (User entity has the column, DB never did)
 *  2. employees.managerId (manager / subordinates feature)
 *  3. drops the legacy "employee" table left over from an early prototype
 */
export class AddPhoneNumberAndManagerId1727500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "phoneNumber" varchar`,
    );

    await queryRunner.query(
      `ALTER TABLE "employees" ADD COLUMN "managerId" integer`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "employee"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "managerId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
  }
}
