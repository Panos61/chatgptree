CREATE TABLE IF NOT EXISTS "Thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"parentId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "ThreadMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"threadId" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"attachments" json NOT NULL,
	"orderIndex" integer NOT NULL,
	"createdAt" timestamp NOT NULL
);

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Thread" ADD CONSTRAINT "Thread_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ThreadMessage" ADD CONSTRAINT "ThreadMessage_threadId_Thread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;