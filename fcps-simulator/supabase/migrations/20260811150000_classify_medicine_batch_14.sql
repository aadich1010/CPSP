-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 14: fetched the 100 lowest-id 'Medicine' rows; 59 were repeats
-- already decided in earlier batches (kept-Medicine vignettes + the
-- corrupted id 31c43918-9ec5-4976-ae8f-39123381009d), skipped again.
-- Of the 41 genuinely new rows, 38 reclassified. 3 left as 'Medicine':
-- 2 genuine clinical case-vignettes, plus a second corrupted/garbled
-- source row (id 962d358f-c625-481f-ab88-741563dc3840, mixes an
-- unrelated Brodmann-area stem with COPD acid-base content -- flagged
-- for admin review, left untouched like 31c43918).
-- Running total: 932 of 1705 processed (by DB count), 773 remain
-- tagged 'Medicine'.

update public.questions set subject = 'Applied Physiology' where id in (
'923faf31-64d4-4931-a1b5-bb1e6587de9e','92b37a94-6f0e-4bf0-9467-6a6a5e3b6bfb','930ccc15-6114-4dcf-b097-2ba08f99558c','9320a9f5-0c66-41a2-8e49-d634f19fc397','93eb3a72-3b37-4dc0-acd4-072f6e744d5b','950b395c-b405-4cfb-8209-63baf41a6443','952ea51e-aa23-45a7-a583-f71fbf37a6b1','955dc83d-658a-4f31-8a7c-17d8df9b5b6d','95add665-1ae2-465b-b5d2-833cd030d3dc','95bbbc53-bd6b-4f22-bbcf-22ad5196b10e','96d33c69-2b1e-4ecc-9ad1-6b8d0c0fccef','97081c07-e64b-4fa2-9155-772e66f59098','974a2a8b-1c71-4d58-9169-74f055db092f','97513651-22b6-4499-99bc-ee235a978165'
);
update public.questions set subject = 'ENT' where id in ('92433feb-2017-4d30-bccb-249bcbf896ca','96ed160f-e7e4-4bea-887c-2f93ee34e395');
update public.questions set subject = 'Applied Pathology' where id in ('92a8ff53-2329-4141-b1f9-6451d8a78fa5','9415172d-2169-4972-b5b6-219681c3ddce','96b51360-f096-4069-a2b1-f33f695d056a','9723610f-75ce-4290-b640-5a0fb1874e1e');
update public.questions set subject = 'Immunology' where id in ('92aa5f14-1224-43d6-ac9b-b506eab0ef44','9615731c-a1ff-4ce6-b017-089bef4e8fef');
update public.questions set subject = 'Applied Pharmacology' where id in ('92e2948f-1eaa-4c7a-8c1f-7d2caa6caec2','956e5bc0-b0e3-42a5-8d63-cdee90fb4c5f','972002d2-9f6c-444a-b042-4a940c44b991');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('938c973c-c366-4592-b78d-b6a4fd75349c','962c0472-6ac2-47eb-ab8a-75eb1940d2f5');
update public.questions set subject = 'Microbiology' where id in ('939960a0-61d4-41f9-ac17-6eed03c6394b','95675f97-9915-410f-afe0-53ed4020a3a8','971365d8-5684-4fd9-a5c4-c35a5d2e7c6e');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('93ce4893-262c-4403-b602-41c4cf75c161');
update public.questions set subject = 'Clinical Anatomy' where id in ('946b893d-b6bc-4597-b610-c6c4ebd9f5b8','953df268-0766-41ea-986e-c11e20847f5c','96ae6da8-b6ca-4b7a-93f7-e7ba43d0d81a');
update public.questions set subject = 'Pediatrics' where id in ('95b5351c-8722-46b2-9537-b412535427fa','96002087-32f8-4ddb-afc0-a9a2e1448731');
update public.questions set subject = 'Ophthalmology' where id in ('9709c6c1-c0e6-4b3a-b29a-935d90fe8b37');
update public.questions set subject = 'Anesthesia' where id in ('973b8ac0-fb08-40db-b7c6-fa504276b1f3');
