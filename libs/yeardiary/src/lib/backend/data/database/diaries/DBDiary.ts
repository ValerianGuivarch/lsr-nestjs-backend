import { Diary } from '../../../domain/models/diaries/Diary';
import { CreateDateColumn, UpdateDateColumn, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Diary' })
export class DBDiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'datetime', default: () => "datetime('now')" })
  createdDate: Date;

  @UpdateDateColumn({ type: 'datetime', default: () => "datetime('now')" })
  updatedDate: Date;

  @Column({ nullable: false, default: '' })
  text: string;

  @Column({ nullable: false })
  day: number;

  @Column({ nullable: false })
  month: number;

  @Column({ nullable: false })
  year: number;

  static readonly RELATIONS = {};

  static toDiary(dbDiary: DBDiary): Diary {
    return new Diary({
      id: dbDiary.id,
      text: dbDiary.text,
      day: dbDiary.day,
      month: dbDiary.month,
      year: dbDiary.year,
      lastUpdate: dbDiary.updatedDate
    });
  }
}

export type DBDiaryToCreate = Omit<DBDiary, 'id'>;
export type DBDiaryToUpdate = Omit<DBDiary, 'id' | 'createdDate'>;
