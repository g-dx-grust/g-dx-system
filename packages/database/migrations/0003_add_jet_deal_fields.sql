CREATE TABLE "master_acquisition_method" (
	"獲得方法コード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"カテゴリ" text NOT NULL,
	"事業部スコープ" text NOT NULL,
	"並び順" integer NOT NULL,
	"備考・説明" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_call_result" (
	"結果コード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"カテゴリ" text NOT NULL,
	"次アクション推奨" text NOT NULL,
	"UIカラー（hex）" text NOT NULL,
	"並び順" integer NOT NULL,
	"備考・運用説明" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_industry" (
	"業種コード" text PRIMARY KEY NOT NULL,
	"大分類" text NOT NULL,
	"中分類" text NOT NULL,
	"表示名" text NOT NULL,
	"並び順" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_jet_credit_status" (
	"与信進捗コード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"説明" text NOT NULL,
	"UIカラー（hex）" text NOT NULL,
	"並び順" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_jet_deal_status" (
	"ステータスコード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"説明" text NOT NULL,
	"UIカラー（hex）" text NOT NULL,
	"並び順" integer NOT NULL,
	"終了ステータス" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_jet_status2" (
	"ステータス2コード" text PRIMARY KEY NOT NULL,
	"表示名" text NOT NULL,
	"カテゴリ" text NOT NULL,
	"説明" text NOT NULL,
	"UIカラー（hex）" text NOT NULL,
	"並び順" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_pipeline_stage" (
	"パイプラインコード" text NOT NULL,
	"ステージキー" text NOT NULL,
	"ステージ名" text NOT NULL,
	"説明" text NOT NULL,
	"UIカラー（hex）" text NOT NULL,
	"並び順" integer NOT NULL,
	"終了ステージ（受注/失注）" boolean NOT NULL,
	CONSTRAINT "master_pipeline_stage_パイプラインコード_ステージキー_pk" PRIMARY KEY("パイプラインコード","ステージキー")
);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "jet_deal_status" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "jet_credit_status" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "jet_status2" text;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_jet_deal_status_master_jet_deal_status_ステータスコード_fk" FOREIGN KEY ("jet_deal_status") REFERENCES "public"."master_jet_deal_status"("ステータスコード") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_jet_credit_status_master_jet_credit_status_与信進捗コード_fk" FOREIGN KEY ("jet_credit_status") REFERENCES "public"."master_jet_credit_status"("与信進捗コード") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_jet_status2_master_jet_status2_ステータス2コード_fk" FOREIGN KEY ("jet_status2") REFERENCES "public"."master_jet_status2"("ステータス2コード") ON DELETE no action ON UPDATE no action;