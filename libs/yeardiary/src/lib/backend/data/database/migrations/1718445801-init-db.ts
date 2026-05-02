import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class InitDb1634567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Diary
    await queryRunner.createTable(
      new Table({
        name: 'Diary',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            default: "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('AB89', 1 + (abs(random()) % 4) , 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))"
          },
          {
            name: 'createdDate',
            type: 'datetime',
            default: "datetime('now')"
          },
          {
            name: 'updatedDate',
            type: 'datetime',
            default: "datetime('now')"
          },
          {
            name: 'text',
            type: 'varchar',
            default: "''"
          },
          {
            name: 'day',
            type: 'int'
          },
          {
            name: 'month',
            type: 'int'
          },
          {
            name: 'year',
            type: 'int'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.dropTable('Diary', true);
  }
}
