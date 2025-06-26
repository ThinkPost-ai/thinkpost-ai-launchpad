

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."restaurant_category" AS ENUM (
    'fast_food',
    'casual_dining',
    'fine_dining',
    'cafe',
    'bakery',
    'pizza',
    'seafood',
    'middle_eastern',
    'asian',
    'italian',
    'american',
    'mexican',
    'indian',
    'other'
);


ALTER TYPE "public"."restaurant_category" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_oauth_states"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.tiktok_oauth_states 
  WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_oauth_states"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_caption_credits"("user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits and lock the row
  SELECT caption_credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;
  
  -- Check if user has credits
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Decrement credits
  UPDATE public.profiles
  SET caption_credits = caption_credits - 1
  WHERE id = user_id;
  
  RETURN current_credits - 1;
END;
$$;


ALTER FUNCTION "public"."decrement_caption_credits"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, auth_provider, tiktok_open_id)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'auth_provider', 'email'),
    new.raw_user_meta_data->>'tiktok_open_id'
  );
  return new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "original_filename" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instagram_oauth_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_value" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '01:00:00'::interval)
);


ALTER TABLE "public"."instagram_oauth_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2),
    "description" "text",
    "image_path" "text",
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "display_name" "text",
    "caption_credits" integer DEFAULT 15 NOT NULL,
    "auth_provider" "text" DEFAULT 'email'::"text",
    "tiktok_open_id" "text",
    "tiktok_username" "text",
    "tiktok_avatar_url" "text",
    "tiktok_access_token" "text",
    "tiktok_connected" boolean DEFAULT false,
    "instagram_user_id" "text",
    "instagram_username" "text",
    "instagram_avatar_url" "text",
    "instagram_access_token" "text",
    "instagram_connected" boolean DEFAULT false,
    "facebook_page_id" "text",
    "facebook_access_token" "text",
    "instagram_test_mode" boolean DEFAULT false,
    "facebook_app_scoped_user_id" "text",
    "instagram_development_mode" boolean DEFAULT true,
    CONSTRAINT "profiles_auth_provider_check" CHECK (("auth_provider" = ANY (ARRAY['email'::"text", 'tiktok'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "location" "text" NOT NULL,
    "category" "public"."restaurant_category" NOT NULL,
    "vision" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "image_id" "uuid",
    "caption" "text" NOT NULL,
    "scheduled_date" timestamp with time zone NOT NULL,
    "platform" "text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_content_source" CHECK (((("product_id" IS NOT NULL) AND ("image_id" IS NULL)) OR (("product_id" IS NULL) AND ("image_id" IS NOT NULL)))),
    CONSTRAINT "scheduled_posts_platform_check" CHECK (("platform" = ANY (ARRAY['instagram'::"text", 'tiktok'::"text", 'facebook'::"text"]))),
    CONSTRAINT "scheduled_posts_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'posted'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."scheduled_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tiktok_oauth_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_value" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:10:00'::interval) NOT NULL
);


ALTER TABLE "public"."tiktok_oauth_states" OWNER TO "postgres";


ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_oauth_states"
    ADD CONSTRAINT "instagram_oauth_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instagram_oauth_states"
    ADD CONSTRAINT "instagram_oauth_states_state_value_key" UNIQUE ("state_value");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_owner_id_key" UNIQUE ("owner_id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_posts"
    ADD CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tiktok_oauth_states"
    ADD CONSTRAINT "tiktok_oauth_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tiktok_oauth_states"
    ADD CONSTRAINT "tiktok_oauth_states_state_value_key" UNIQUE ("state_value");



CREATE INDEX "idx_images_created_at" ON "public"."images" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_images_user_id" ON "public"."images" USING "btree" ("user_id");



CREATE INDEX "idx_instagram_oauth_states_expires_at" ON "public"."instagram_oauth_states" USING "btree" ("expires_at");



CREATE INDEX "idx_instagram_oauth_states_state_value" ON "public"."instagram_oauth_states" USING "btree" ("state_value");



CREATE INDEX "idx_restaurants_owner_id" ON "public"."restaurants" USING "btree" ("owner_id");



CREATE INDEX "idx_tiktok_oauth_states_expires_at" ON "public"."tiktok_oauth_states" USING "btree" ("expires_at");



CREATE OR REPLACE TRIGGER "update_images_updated_at" BEFORE UPDATE ON "public"."images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_restaurants_updated_at" BEFORE UPDATE ON "public"."restaurants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scheduled_posts_updated_at" BEFORE UPDATE ON "public"."scheduled_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."images"
    ADD CONSTRAINT "images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instagram_oauth_states"
    ADD CONSTRAINT "instagram_oauth_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_posts"
    ADD CONSTRAINT "scheduled_posts_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_posts"
    ADD CONSTRAINT "scheduled_posts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tiktok_oauth_states"
    ADD CONSTRAINT "tiktok_oauth_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Service role can manage instagram oauth states" ON "public"."instagram_oauth_states" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create their own products" ON "public"."products" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own scheduled posts" ON "public"."scheduled_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own images" ON "public"."images" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own products" ON "public"."products" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own scheduled posts" ON "public"."scheduled_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own images" ON "public"."images" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own restaurant" ON "public"."restaurants" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can manage their own OAuth states" ON "public"."tiktok_oauth_states" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own images" ON "public"."images" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own products" ON "public"."products" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own restaurant" ON "public"."restaurants" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can update their own scheduled posts" ON "public"."scheduled_posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own images" ON "public"."images" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own products" ON "public"."products" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own restaurant" ON "public"."restaurants" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can view their own scheduled posts" ON "public"."scheduled_posts" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instagram_oauth_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tiktok_oauth_states" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_expired_oauth_states"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_oauth_states"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_oauth_states"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_caption_credits"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_caption_credits"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_caption_credits"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."images" TO "anon";
GRANT ALL ON TABLE "public"."images" TO "authenticated";
GRANT ALL ON TABLE "public"."images" TO "service_role";



GRANT ALL ON TABLE "public"."instagram_oauth_states" TO "anon";
GRANT ALL ON TABLE "public"."instagram_oauth_states" TO "authenticated";
GRANT ALL ON TABLE "public"."instagram_oauth_states" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_posts" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_posts" TO "service_role";



GRANT ALL ON TABLE "public"."tiktok_oauth_states" TO "anon";
GRANT ALL ON TABLE "public"."tiktok_oauth_states" TO "authenticated";
GRANT ALL ON TABLE "public"."tiktok_oauth_states" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
