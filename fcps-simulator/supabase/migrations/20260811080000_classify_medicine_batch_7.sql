-- Continuation of the 'Medicine' classification pass -- see
-- 20260811030000_pilot_classify_medicine_subjects.sql for methodology.
-- Batch 7: fetched the 100 lowest-id 'Medicine' rows again (offset-based
-- paging drifts once rows leave the set, so low-id rows already decided
-- to stay 'Medicine' resurface on every fetch -- those 15 repeats,
-- including the corrupted id 31c43918-9ec5-4976-ae8f-39123381009d, were
-- recognized and skipped, not reprocessed). 63 of the 85 genuinely new
-- rows reclassified; 22 left as genuine clinical case-vignettes.
-- Running total: 619 of 1705 processed (authoritative, by DB count),
-- 1086 remain tagged 'Medicine'.

update public.questions set subject = 'Immunology' where id in (
'2c8277b8-37e4-4117-820d-03b3aec83028','2ddecc76-936a-4e29-ac9b-fc4f9bdc5929','3d66854c-207c-4cff-84a9-a4f148a358f9','4fc5bf0f-a5ac-46dc-9122-6a01237cc66c','6058f66f-eb67-4344-b52d-4f63ab89ce1b','6623eb97-c91c-4633-bfe6-fe462dcece2e'
);
update public.questions set subject = 'Applied Physiology' where id in (
'2c934c58-c000-43f5-ab82-e0dac226c83f','2d0988d5-8bfc-4aeb-a33f-4ec194a15edf','2d5b5da5-9a09-46c8-9486-ba0b59bcd082','2ff0488a-ceba-4a87-baa1-3c53259e5998','4f43c18d-0b52-4967-9a69-a82bfecfc626','4f532fd8-0790-4384-bf43-b7a32b619d9b','5fba3791-a955-4ef7-bd69-1188290afa9c','5ffae056-eed6-4161-aa9c-12e92fd7a68d','602faa00-50d9-4c78-b95a-424c776e567b','6074aa85-3f9e-42c5-a72b-548c58407173','628d8da3-28fa-46b6-bb7f-b230d237f6b9','6294a5ec-d79b-4036-96fa-0f9be5b3cd4a','635b6fab-4071-4bb1-ad78-c399e8f45c75','635c81bd-2e93-4285-b127-db4257676278','650d0101-7c7e-474b-bd5c-a6f2d30ff660','657c9abf-06e6-47d8-a583-5503df3ece26','65b0356f-b24e-4c64-9cb0-e58cf242e9b3','665bcca8-d1f1-4d8f-87b3-1e19d2927888','6669459f-07c5-4789-98d0-2a52235b355a'
);
update public.questions set subject = 'Applied Pharmacology' where id in (
'2d76d8b0-79d6-4ca1-bece-17e744fb21e0','3d044b09-c6b5-435c-a393-30b21fb3d8ea','60ecfb56-530f-4138-a6ba-98f1d36d6378','651b8425-df2f-44ac-adc7-655fb61818e8'
);
update public.questions set subject = 'Applied Pathology' where id in (
'2e272929-462e-48a9-9772-d5543db3737b','3da8f104-ba8d-461e-b0a3-bd0bd620bcf5','62f3b2be-c09c-4d40-b2d8-3f43731dc010','65136aac-43db-4703-ae28-65c0b16eb3a7','6575bdbc-25ea-4d87-94f7-c672f495ec23','662eea3c-95c1-4baf-ac9c-ef4bacc5cb80','68369ba1-b424-48b2-ae1e-3bf8565cd11c','6845e56f-df7b-4b5a-a94d-d9968ce908ce'
);
update public.questions set subject = 'Applied Biochemistry' where id in (
'3ce6ebe5-96ef-43f2-8406-4b3cabd3e839','5038e14f-a01e-4df4-b459-aa990965d1ac','618089df-89de-4c5a-b182-4c0d9fee23c2','62c333c8-a5c4-468a-ac00-8e76b5bfc8c6','65699ffc-ee35-4b5c-a0b6-e38ad58e59ec'
);
update public.questions set subject = 'Clinical Anatomy' where id in (
'4f60982a-86e7-41d7-8737-8b795ca7f558','60c552e1-ae92-4301-82cd-b006234980f4','60f9fa3e-4607-49c5-8baa-c39c064a44cd','631457ea-15e9-4024-8c15-cb81daca1c65','64493c7f-eb6d-4dd3-b838-777b7cafe346','65586e79-0db0-4623-af07-e491ffa01044','65a8fe78-1121-42e6-99ea-8f269b527f96','67581094-2b92-4ce7-aafc-65dd93e181bf','67ea0b49-5069-451a-a0a3-9e8c7174512e'
);
update public.questions set subject = 'Microbiology' where id in (
'2d116315-9ab6-4e4a-bace-7d21e281be5b','3d83d80c-5560-4816-ac44-ed6037cabba8','65f8b133-f16c-4792-b726-eac87440ba40'
);
update public.questions set subject = 'Radiology (Imaging Basics)' where id in ('502d97b8-7bb2-4fec-94c9-3948e1aed4e1');
update public.questions set subject = 'Obstetrics & Gynecology' where id in ('2e115908-2cb0-49f1-b59d-8ee0ef5238fd','6227b14a-cb5c-4b10-9e63-a2d7245de74e','664d3607-6ca9-4c38-974f-2cefa62d4e59');
update public.questions set subject = 'Ophthalmology' where id in ('4ef34fc8-96b4-4223-9a64-70e41105f544');
update public.questions set subject = 'Anesthesia' where id in ('60a9cc70-2fbb-4502-97d4-d66239d82cfb');
update public.questions set subject = 'Epidemiology & Biostatistics' where id in ('618b5bf9-71d0-43b8-a262-f95410ea3ee5');
update public.questions set subject = 'Pediatrics' where id in ('50a07fd4-e2a2-4d5b-a2e9-168a7318b203');
update public.questions set subject = 'ENT' where id in ('65209e3e-04f2-475f-80cd-c2a763c2699a');
