-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 22: fetched with an id-offset (92); only 73 rows remained (fewer
-- than the usual 100-row page), all genuinely new. 71 reclassified, 2
-- left as 'Medicine' due to corrupted/mismatched source data (flagged
-- for admin review):
--   fb5d4c7c-9a2d-49a3-9379-654a34139b61 (garbled duplicate of the
--     sulfonamide/G6PD/Heinz-body question -- OCR-mangled text "diy
--     urine", "Heip, bodies" and an empty explanation)
--   fd658ded-1014-48d7-a48b-0c647fe3c8c0 (question asks about blood
--     supply of the trachea but the explanation describes the pituitary
--     gland's hypophyseal artery supply -- unrelated content)
-- Running total: 1611 of 1705 processed (by DB count), 94 remain tagged
-- 'Medicine'. Verified via count(*) = 94 (delta of 71 from the prior
-- 165, matching expectations exactly).

update public.questions set subject = 'Applied Physiology' where id in (
'f68bd32b-6a12-4bb3-a7b2-f1cc0e56028e','f6bee129-e911-4ef8-ad98-e9dab6ec744e','f71ad523-58fb-43d2-a977-4f63567eac74','f826ee5d-b660-4ab5-b490-5a2e032c01d5','f819d77d-ed20-40c1-bd59-8163e0c377e0','f96a2f0e-b207-4c1f-95f1-5da03e42cf14','f96cdc1a-5e76-44f2-9d1c-0d6c136caccb','fb4f1c28-bb8e-4312-8961-14aa6e01ed30','fbaffdf5-033d-49a5-bbb5-f4e49b2ae1ea','fc2dc956-1b8a-42d7-834f-2a1f0436d740','fd6f829c-4e0e-4e4f-9c92-323ec9af2377','fd708786-9c5e-4747-8329-92ff66818dde','fe06ff4f-67dc-4799-a4c6-6787d4309ec1','fefd0b9f-a2f5-49b0-b67c-c9093bd39342','ff687cbf-2d5e-4570-8915-2f16f4f378e5'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'f70a7606-7119-4390-ae3b-e9588de4119f','f8be9f89-758e-4260-b841-92decbc9a120','f94cb1fa-9516-4625-a45e-1379e9202f57','f9a6d9ce-696d-4f0a-87d6-53d5d357a5b0','f9b90529-6011-4f58-9273-27f636e69a00','f9c41da4-da27-44ae-be47-cfc9aa9d0b93','faeaffff-32a7-4750-9cd0-a598c3c0b6a4','fb9c07bd-a945-4bd4-a800-23200235de74','fbfd6a4e-4fcc-47d6-8a30-ce88ce4da58c','fca49ce0-d86d-44ce-af2a-49ae6123249d','fcb912db-0a38-4f6d-aca9-8b1725d386c3','fcf8c283-1b12-4d75-b804-3393da163145','fd43e80c-c0a9-4943-b8dc-fff57d49ccfc','fe0cff8a-93d6-4be4-a8f9-58433869fd32','ff231ae7-7e83-476a-a772-fc9cfd6b7bae'
);
update public.questions set subject = 'Applied Pathology' where id in ('f67f77f2-ab8e-4622-913a-d30608aa6eef','f72ced52-e659-4268-b171-8159caf7628d','f737817f-a3ba-48d1-a21a-20487b72839a','f785eac2-53f4-4d81-8a12-8dcb4e00540f','f81f8a22-7f01-4db5-be6a-4b5b9bd7a143','f9775e31-9a19-41ad-96a6-60f62677715e','f9e18d85-e2ff-4f5f-b5a8-bccac0158683','fb032481-5a29-4d1b-aeed-06fdd70d1728','fb6cd1cc-655a-4de4-a9b2-08020cd02793','fc3f2e76-e3fb-4676-859b-1b452601700e');
update public.questions set subject = 'Immunology' where id in ('f754236c-6723-450a-bd05-f1ab110e83df','f85c4edf-9281-4678-a730-460e395a23d8','f91ec450-811c-4b1d-9464-eb9854862f74','fad89792-656d-4d42-a82f-d147e5321ff7','fe64f728-64af-40cd-bbd3-80a38a0ae493');
update public.questions set subject = 'Microbiology' where id in ('f785131e-eb4a-4e9a-b981-9dad6f02afbd','f9471f7e-71fc-45e4-93c9-59c4c78b22a2','fa31d538-a5a0-47a7-82ec-2b73f2429855','fa427d44-90ac-4d64-b0ea-daf148e4ec1d','fb442951-bc26-48bf-a17b-e486c4eaf1f8');
update public.questions set subject = 'Applied Pharmacology' where id in ('f818f244-7804-455b-a726-b1f040b9ee31','f87256f8-3eaa-4afa-b941-a3886ede67fc','ff36cd97-1572-44ec-a1bd-4686ac9fddc3','ffb2808f-cade-4964-8458-dbda22adcfa1','fddc94f9-a959-4efd-b951-e6005301a147');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('f8261ece-9d1b-4efe-bfa8-75c679c924ac','f8fb92ac-ad88-4969-9aaf-b78c3820c6e3','f95390c5-5ae1-46b0-b989-3394e379c1e2','f9d3b2fa-a012-4879-b237-3c825895ca69','febf5939-a08a-4647-88f0-f22e50355b49','ff39e141-5ac1-4cbc-ab19-f0a719a98f80');
update public.questions set subject = 'Applied Biochemistry' where id in ('fa508858-8f0c-412d-bf04-bad38c40c6b0','fc7070e5-8fda-43ce-8158-a9ae029493f7','ff5eeb9a-d42d-4d70-908f-c44e29f77fcb');
update public.questions set subject = 'Community Medicine' where id in ('fcc64ff9-036e-420c-b19f-00fc29bea34d','ff03f5a0-c757-4a36-b487-d33eb84392e6');
update public.questions set subject = 'ENT' where id in ('f8d20002-45ce-4e48-95f4-0da1aa7042c8','f99e5e8d-52da-4fba-b6a7-89d70b16f0fd','fc5f2038-58ad-4a73-aafb-0f252f0d8cd4');
update public.questions set subject = 'General Surgery' where id in ('f7b6025d-bca8-4194-9a3f-bd0a932ee955');
update public.questions set subject = 'Dermatology (Basic Sciences)' where id in ('febd738f-b533-4539-8174-bbad5611114e');
