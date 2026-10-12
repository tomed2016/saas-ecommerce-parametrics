import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1660000000000 implements MigrationInterface {
    name = 'InitialSchema1660000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "code" text NOT NULL UNIQUE, "legalname" text NOT NULL, "displayname" text NOT NULL, "domain" text, "status" text DEFAULT 'ACTIVE', "currency" text DEFAULT 'CLP', "language" text DEFAULT 'es', "branding" jsonb)`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "email" text NOT NULL, "passwordhash" text NOT NULL, "isemailverified" boolean DEFAULT false, "role" text DEFAULT 'USER', "totpenabled" boolean DEFAULT false, "totpsecret" text, CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL)`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "sku" text NOT NULL, "name" text NOT NULL, "description" text, "active" boolean DEFAULT true, "attributes" jsonb, CONSTRAINT "FK_products_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE TABLE "warehouses" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "name" text NOT NULL, "code" text, "address" text, CONSTRAINT "FK_warehouses_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "product_id" uuid, "warehouse_id" uuid, "stockphysical" integer DEFAULT 0, "stockreserved" integer DEFAULT 0, CONSTRAINT "UQ_inventory_tenant_product_warehouse" UNIQUE ("tenant_id","product_id","warehouse_id"), CONSTRAINT "FK_inventory_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE, CONSTRAINT "FK_inventory_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE, CONSTRAINT "FK_inventory_warehouse" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE TABLE "carts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "customerid" text, "items" jsonb DEFAULT '[]', "checkedout" boolean DEFAULT false, CONSTRAINT "FK_carts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid, "status" text NOT NULL, "lines" jsonb NOT NULL, "totalamount" numeric DEFAULT 0, "createdat" timestamptz DEFAULT now(), CONSTRAINT "FK_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE TABLE "outbox" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "aggregateid" text NOT NULL, "aggregatetype" text NOT NULL, "eventtype" text NOT NULL, "payload" jsonb NOT NULL, "status" text DEFAULT 'PENDING', "attempts" integer DEFAULT 0, "createdat" timestamptz DEFAULT now(), "tenantid" text, "correlationid" text, "nextattemptat" timestamptz, "lasterror" text)`);
        await queryRunner.query(`CREATE TABLE "inbox" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "event_id" text NOT NULL, "event_type" text NOT NULL, "aggregate_id" text NOT NULL, "tenant_id" text, "consumer_name" text NOT NULL, "status" text DEFAULT 'PROCESSING', "payload" jsonb, "createdAt" timestamptz DEFAULT now(), "processedAt" timestamptz)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_inbox_event_consumer" ON "inbox" ("event_id","consumer_name")`);
        await queryRunner.query(`CREATE TABLE "processed_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "eventid" text NOT NULL, "eventtype" text NOT NULL, "aggregateid" text NOT NULL, "tenantid" text, "payload" jsonb, "consumername" text NOT NULL, "processedat" timestamptz DEFAULT now())`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "processed_events"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inbox_event_consumer"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "inbox"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "outbox"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "carts"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "inventory"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouses"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    }
}
