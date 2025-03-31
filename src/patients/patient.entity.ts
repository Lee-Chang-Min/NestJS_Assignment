import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: true })
  chartNumber: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 11, nullable: true })
  phoneNumber: string;

  @Column({ length: 9, nullable: true }) // 주민번호 앞자리 + 성별 식별자
  rrn: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  memo: string;
}
