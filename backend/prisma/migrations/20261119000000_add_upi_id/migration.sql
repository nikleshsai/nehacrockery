-- Migration: add upi_id column to site_settings
-- Generated: 2026-11-19

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "upi_id" TEXT;
