CREATE TABLE "user_kpi_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"target_month" text NOT NULL,
	"call_target" integer DEFAULT 0 NOT NULL,
	"visit_target" integer DEFAULT 0 NOT NULL,
	"appointment_target" integer DEFAULT 0 NOT NULL,
	"negotiation_target" integer DEFAULT 0 NOT NULL,
	"contract_target" integer DEFAULT 0 NOT NULL,
	"revenue_target" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_kpi_targets_user_id_business_unit_id_target_month_unique" UNIQUE("user_id","business_unit_id","target_month")
);
--> statement-breakpoint
CREATE TABLE "master_lead_source" (
	"流入経路コード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"カテゴリ" text NOT NULL,
	"並び順" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_logs" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "fs_in_charge_user_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "is_in_charge_user_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "product_code" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "has_subsidy" boolean;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "license_plan_code" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "free_support_months" integer;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "enterprise_license_count" integer;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "pro_license_count" integer;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "a2_license_count" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lark_chat_id" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lark_calendar_id" text;--> statement-breakpoint
ALTER TABLE "call_logs" ADD COLUMN "next_call_datetime" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_kpi_targets" ADD CONSTRAINT "user_kpi_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_kpi_targets" ADD CONSTRAINT "user_kpi_targets_business_unit_id_business_units_id_fk" FOREIGN KEY ("business_unit_id") REFERENCES "public"."business_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_fs_in_charge_user_id_users_id_fk" FOREIGN KEY ("fs_in_charge_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_is_in_charge_user_id_users_id_fk" FOREIGN KEY ("is_in_charge_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ubm_user_idx" ON "user_business_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ubm_business_unit_idx" ON "user_business_memberships" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "ubm_user_business_unit_idx" ON "user_business_memberships" USING btree ("user_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "ura_user_idx" ON "user_role_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ura_role_idx" ON "user_role_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "ura_user_role_idx" ON "user_role_assignments" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_normalized_name_idx" ON "companies" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "companies_display_name_idx" ON "companies" USING btree ("display_name");--> statement-breakpoint
CREATE INDEX "companies_updated_at_idx" ON "companies" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "cbp_business_unit_idx" ON "company_business_profiles" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "cbp_company_idx" ON "company_business_profiles" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cbp_company_business_unit_idx" ON "company_business_profiles" USING btree ("company_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "cbp_owner_user_idx" ON "company_business_profiles" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "ccl_company_idx" ON "company_contact_links" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "ccl_contact_idx" ON "company_contact_links" USING btree ("contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ccl_company_contact_idx" ON "company_contact_links" USING btree ("company_id","contact_id");--> statement-breakpoint
CREATE INDEX "cbpr_contact_idx" ON "contact_business_profiles" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "cbpr_business_unit_idx" ON "contact_business_profiles" USING btree ("business_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cbpr_contact_business_unit_idx" ON "contact_business_profiles" USING btree ("contact_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "contacts_full_name_idx" ON "contacts" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contract_activities_contract_idx" ON "contract_activities" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_activities_business_unit_idx" ON "contract_activities" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "contracts_business_unit_idx" ON "contracts" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "contracts_company_idx" ON "contracts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "contracts_deal_idx" ON "contracts" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "contracts_owner_user_idx" ON "contracts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "deal_activities_deal_idx" ON "deal_activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_activities_business_unit_idx" ON "deal_activities" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "deal_stage_history_deal_idx" ON "deal_stage_history" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_stage_history_changed_at_idx" ON "deal_stage_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "deals_business_unit_idx" ON "deals" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "deals_company_idx" ON "deals" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "deals_owner_user_idx" ON "deals" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "deals_pipeline_idx" ON "deals" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "deals_current_stage_idx" ON "deals" USING btree ("current_stage_id");--> statement-breakpoint
CREATE INDEX "deals_updated_at_idx" ON "deals" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "deals_company_deleted_idx" ON "deals" USING btree ("company_id","deleted_at");--> statement-breakpoint
CREATE INDEX "facilities_company_idx" ON "facilities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "pipeline_stages_pipeline_idx" ON "pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX "pipelines_business_unit_idx" ON "pipelines" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "call_campaigns_business_unit_idx" ON "call_campaigns" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "call_logs_business_unit_idx" ON "call_logs" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "call_logs_user_idx" ON "call_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "call_logs_company_idx" ON "call_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "call_logs_started_at_idx" ON "call_logs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "call_logs_deal_idx" ON "call_logs" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "call_targets_campaign_idx" ON "call_targets" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "call_targets_business_unit_idx" ON "call_targets" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "call_targets_company_idx" ON "call_targets" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "call_targets_assigned_user_idx" ON "call_targets" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "tasks_assigned_user_idx" ON "tasks" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX "tasks_business_unit_idx" ON "tasks" USING btree ("business_unit_id");--> statement-breakpoint
CREATE INDEX "tasks_deal_idx" ON "tasks" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "tasks_company_idx" ON "tasks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_at_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "ddm_business_unit_date_idx" ON "dashboard_daily_metrics" USING btree ("business_unit_id","metric_date");--> statement-breakpoint
CREATE INDEX "ddm_metric_key_idx" ON "dashboard_daily_metrics" USING btree ("metric_key");--> statement-breakpoint
CREATE INDEX "audit_logs_table_record_idx" ON "audit_logs" USING btree ("table_name","record_pk");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "erl_entity_idx" ON "external_record_links" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "erl_external_record_idx" ON "external_record_links" USING btree ("external_system","external_record_id");--> statement-breakpoint
CREATE INDEX "lark_sync_jobs_status_idx" ON "lark_sync_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lark_sync_jobs_run_after_idx" ON "lark_sync_jobs" USING btree ("run_after");