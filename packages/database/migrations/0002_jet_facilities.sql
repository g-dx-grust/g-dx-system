-- JET（節水事業）: 施設テーブル
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"postal_code" text,
	"prefecture" text,
	"city" text,
	"address_line1" text,
	"main_phone" text,
	"manager_name" text,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- JET 契約拡張カラム（contracts テーブル）
ALTER TABLE "contracts" ADD COLUMN "facility_id" uuid;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "termination_date" date;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "rebate_required" boolean;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "rebate_amount" numeric(18, 2);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "rebate_status" text;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "rebate_paid_at" date;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "gdx_referral_possible" boolean;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "gdx_referral_status" text;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "gdx_referral_date" date;
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "gdx_referral_note" text;
--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- JET 契約活動記録テーブル
CREATE TABLE "contract_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"activity_date" date NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contract_activities" ADD CONSTRAINT "contract_activities_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "contract_activities" ADD CONSTRAINT "contract_activities_business_unit_id_business_units_id_fk" FOREIGN KEY ("business_unit_id") REFERENCES "public"."business_units"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "contract_activities" ADD CONSTRAINT "contract_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
