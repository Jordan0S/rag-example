import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPromptTable1755573296523 implements MigrationInterface {
    name = 'AddPromptTable1755573296523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "content" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_prompts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_prompts_name" ON "prompts" ("name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_prompts_name"`);
        await queryRunner.query(`DROP TABLE "prompts"`);
    }

}
