import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity("prompts")
export class PromptEntity {
    @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_prompts' })
    id: string = uuidv4();

    @Index("IDX_prompts_name", { unique: true })
    @Column("text")
    name: string;

    @Column("text", { nullable: true })
    description: string;

    @Column("text")
    content: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt: Date;
}
