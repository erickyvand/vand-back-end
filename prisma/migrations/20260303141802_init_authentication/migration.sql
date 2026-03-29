-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Authentication";

-- CreateEnum
CREATE TYPE "Authentication"."UserType" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "Authentication"."Language" AS ENUM ('en', 'fr', 'rw');

-- CreateTable
CREATE TABLE "Authentication"."Users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "userType" "Authentication"."UserType" NOT NULL,
    "language" "Authentication"."Language" NOT NULL DEFAULT 'rw',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authentication"."Roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authentication"."InternalProfiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastPasswordChange" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorSecret" TEXT,
    "twoFactorOtp" TEXT,
    "twoFactorOtpExpiry" TIMESTAMP(3),
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedBy" TEXT,
    "createdBy" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "displayName" TEXT,
    "xLink" TEXT,
    "linkedinLink" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authentication"."Terms" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authentication"."ExternalProfiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "interests" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_slug_key" ON "Authentication"."Users"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Authentication"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_phone_key" ON "Authentication"."Users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Authentication"."Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Terms_version_key" ON "Authentication"."Terms"("version");

-- CreateIndex
CREATE UNIQUE INDEX "InternalProfiles_userId_key" ON "Authentication"."InternalProfiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalProfiles_userId_key" ON "Authentication"."ExternalProfiles"("userId");

-- AddForeignKey
ALTER TABLE "Authentication"."Roles" ADD CONSTRAINT "Roles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Authentication"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authentication"."InternalProfiles" ADD CONSTRAINT "InternalProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Authentication"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authentication"."InternalProfiles" ADD CONSTRAINT "InternalProfiles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Authentication"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authentication"."ExternalProfiles" ADD CONSTRAINT "ExternalProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Authentication"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authentication"."ExternalProfiles" ADD CONSTRAINT "ExternalProfiles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Authentication"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
