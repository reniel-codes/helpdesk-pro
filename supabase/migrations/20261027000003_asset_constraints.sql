-- Length limits for asset text fields.
-- The asset form checks these too, but the database is the final guard
-- (same idea as the ticket title CHECK in the first migration).
--
-- This is a NEW migration instead of an edit to the first one, because the
-- first one has already run on the live database and won't run again.

alter table public.assets
  add constraint assets_asset_tag_length     check (char_length(asset_tag) between 1 and 50),
  add constraint assets_serial_number_length check (char_length(serial_number) between 1 and 100),
  add constraint assets_brand_length         check (brand is null or char_length(brand) <= 100),
  add constraint assets_model_length         check (model is null or char_length(model) <= 100),
  add constraint assets_notes_length         check (notes is null or char_length(notes) <= 2000);
