import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748977699655 implements MigrationInterface {
    name = 'InitialSchema1748977699655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "fullName" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email"), CONSTRAINT "UQ_2e64383bae8871598afb8b73f0d" UNIQUE ("phoneNumber"), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "imageUrl" character varying, "isAvailable" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_722c4de0accbbfafc77947a8556" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalPrice" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" uuid, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_paymentmethod_enum" AS ENUM('card', 'cash', 'bank_transfer', 'wallet')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_status_enum" AS ENUM('pending', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "paymentMethod" "public"."transaction_paymentmethod_enum" NOT NULL DEFAULT 'card', "referenceId" character varying NOT NULL, "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" uuid, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "itemName" character varying NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_82aa5da437c5bbfb80703b08309" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_menu_items_menu_item" ("orderId" uuid NOT NULL, "menuItemId" uuid NOT NULL, CONSTRAINT "PK_b2822e48e17399d7cad235bd61f" PRIMARY KEY ("orderId", "menuItemId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_95bbd9b25e994f4d9291b75a16" ON "order_menu_items_menu_item" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ceaeb00984a31b6959abea031f" ON "order_menu_items_menu_item" ("menuItemId") `);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_124456e637cca7a415897dce659" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_a6e45c89cfbe8d92840266fd30f" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_menu_items_menu_item" ADD CONSTRAINT "FK_95bbd9b25e994f4d9291b75a163" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_menu_items_menu_item" ADD CONSTRAINT "FK_ceaeb00984a31b6959abea031f3" FOREIGN KEY ("menuItemId") REFERENCES "menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_menu_items_menu_item" DROP CONSTRAINT "FK_ceaeb00984a31b6959abea031f3"`);
        await queryRunner.query(`ALTER TABLE "order_menu_items_menu_item" DROP CONSTRAINT "FK_95bbd9b25e994f4d9291b75a163"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_a6e45c89cfbe8d92840266fd30f"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_124456e637cca7a415897dce659"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ceaeb00984a31b6959abea031f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_95bbd9b25e994f4d9291b75a16"`);
        await queryRunner.query(`DROP TABLE "order_menu_items_menu_item"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_paymentmethod_enum"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "menu_item"`);
        await queryRunner.query(`DROP TABLE "customer"`);
    }

}
