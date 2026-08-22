-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'GUIDE', 'ADMIN');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "guide_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "city_id" INTEGER NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_bookings" (
    "id" SERIAL NOT NULL,
    "guide_id" INTEGER NOT NULL,
    "tourist_id" INTEGER NOT NULL,
    "trip_id" INTEGER,
    "city_id" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "guide_note" TEXT,
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guide_profiles_user_id_key" ON "guide_profiles"("user_id");

-- CreateIndex
CREATE INDEX "guide_profiles_city_id_idx" ON "guide_profiles"("city_id");

-- CreateIndex
CREATE INDEX "guide_profiles_is_active_idx" ON "guide_profiles"("is_active");

-- CreateIndex
CREATE INDEX "guide_bookings_guide_id_start_date_idx" ON "guide_bookings"("guide_id", "start_date");

-- CreateIndex
CREATE INDEX "guide_bookings_tourist_id_idx" ON "guide_bookings"("tourist_id");

-- CreateIndex
CREATE INDEX "guide_bookings_status_idx" ON "guide_bookings"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "guide_profiles" ADD CONSTRAINT "guide_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_profiles" ADD CONSTRAINT "guide_profiles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guide_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_tourist_id_fkey" FOREIGN KEY ("tourist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
