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

  @Column({ length: 9 }) 
  rrn: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 255, nullable: true })
  memo: string;
}
